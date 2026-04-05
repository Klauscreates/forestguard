import {
  buildForestGuardStructuredContext,
  buildForestGuardSystemInstructions,
  buildForestRouteInstructions,
} from "./_agent-prompt.js";
import {
  chooseReasoningProvider,
  GEMINI_MODEL,
  invokeReasoningModel,
  isBedrockConfigured,
} from "./_reasoning-provider.js";
import { retrievePolicyContext } from "../src/data/policy-rag.js";

function createStep({ tool, label, detail, status = "completed" }) {
  return {
    id: crypto.randomUUID(),
    tool,
    label,
    detail,
    status,
    timestamp: new Date().toISOString(),
  };
}

function parseStructuredJson(text) {
  const trimmed = text.trim();
  const withoutFence = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(withoutFence);
  } catch {
    const objectMatch = withoutFence.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return JSON.parse(objectMatch[0]);
    }
    throw new Error("Gemini returned a non-JSON response.");
  }
}

function normalizeParsedResponse(parsed, route, rawText) {
  if (!parsed || typeof parsed !== "object") {
    return {
      title: "Forest response",
      summary: rawText || "Insufficient Data",
      sections: [
        { label: "Answer", text: rawText || "Insufficient Data" },
        { label: "Context", text: "Forest did not return structured sections for this request." },
        { label: "Next step", text: "Re-run the request if you need a more structured output." },
      ],
      recommendedActions: [],
      route,
    };
  }

  const summary = typeof parsed.summary === "string" && parsed.summary.trim()
    ? parsed.summary.trim()
    : typeof rawText === "string" && rawText.trim()
      ? rawText.trim()
      : "Insufficient Data";

  const sections = Array.isArray(parsed.sections) && parsed.sections.length
    ? parsed.sections
        .filter((section) => section && typeof section.label === "string" && typeof section.text === "string")
        .slice(0, 3)
    : [
        { label: "Answer", text: summary },
        { label: "Context", text: "Forest returned a partial response without structured sections." },
        { label: "Next step", text: "Use the recommended actions below or refine the question." },
      ];

  const recommendedActions = Array.isArray(parsed.recommendedActions)
    ? parsed.recommendedActions.filter((action) => typeof action === "string" && action.trim()).slice(0, 4)
    : [];

  return {
    title: typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : "Forest response",
    summary,
    sections,
    recommendedActions,
    route: parsed.route || route,
  };
}

function buildGeminiPrompt({ alertSnapshot, question, dashboardSnapshot, attachments, route, policyContext }) {
  const context = buildForestGuardStructuredContext(alertSnapshot, dashboardSnapshot, attachments);

  return `
SYSTEM INSTRUCTIONS
${buildForestGuardSystemInstructions()}

ROUTER DECISION
${route}

ROUTE INSTRUCTIONS
${buildForestRouteInstructions(route)}

CASE CONTEXT JSON
${JSON.stringify(context, null, 2)}

POLICY CONTEXT JSON
${JSON.stringify(policyContext, null, 2)}

USER QUESTION
${question}

Return JSON with:
- title: short answer title
- summary: one concise paragraph answering the user directly
- sections: array of 3 objects with { label, text }
- recommendedActions: array of 2 to 4 concise action strings
- route: one of "policy_rag", "live_signal", "synthesis", "cross_reference"
`.trim();
}

function routeQuestion(question) {
  const normalized = String(question || "").toLowerCase();
  const policyTerms = [
    "renewable",
    "climate pledge",
    "net zero",
    "goal",
    "policy",
    "standard",
    "commitment",
    "sustainability",
    "sustainable",
    "report",
    "private brands",
    "beef",
    "soy",
    "paper",
    "palm oil",
  ];
  const liveTerms = [
    "this case",
    "selected case",
    "this alert",
    "zone",
    "polygon",
    "carbon at risk",
    "what should procurement do",
    "intervention",
    "risk score",
    "apa",
    "triunfo",
    "deter",
    "current",
    "live",
    "monitoring",
    "carbon",
    "procurement",
    "business impact",
  ];
  const crossReferenceTerms = [
    "supplier",
    "meatpacker",
    "buyer",
    "purchase order",
    "po #",
    "po ",
    "tier-1",
    "tier 1",
    "tier-2",
    "tier 2",
    "traceability",
    "linked to",
    "affect po",
  ];

  const hasPolicy = policyTerms.some((term) => normalized.includes(term));
  const hasLive = liveTerms.some((term) => normalized.includes(term));
  const hasCrossReference = crossReferenceTerms.some((term) => normalized.includes(term));

  if (hasCrossReference) return hasPolicy ? "synthesis" : "cross_reference";
  if (hasPolicy && hasLive) return "synthesis";
  if (hasPolicy) return "policy_rag";
  return "live_signal";
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  const { alertId, question, alertSnapshot, dashboardSnapshot, attachments = [] } = request.body || {};
  const steps = [];

  if (!alertId || !question || !alertSnapshot) {
    return response.status(400).json({ error: "alertId, question, and alertSnapshot are required" });
  }

  steps.push(
    createStep({
      tool: "context.compile",
      label: "Compiled selected case context",
      detail: `${alertSnapshot.title} · ${alertSnapshot.zone}`,
    })
  );

  if (attachments.length) {
    steps.push(
      createStep({
        tool: "context.attachments",
        label: "Merged uploaded file analyses into the case context",
        detail: `${attachments.length} analyzed file${attachments.length === 1 ? "" : "s"}`,
      })
    );
  }

  const route = routeQuestion(question);
  const policyContext = route === "live_signal" ? [] : retrievePolicyContext(question, route === "policy_rag" ? 4 : 3);
  steps.push(
    createStep({
      tool: "router.ask",
      label: "Routed Forest query",
      detail:
        route === "policy_rag"
          ? `Policy RAG path · ${policyContext.length} policy document${policyContext.length === 1 ? "" : "s"}`
          : route === "cross_reference"
            ? "Cross-reference path · selected case plus documented buyer-link evidence"
          : route === "synthesis"
            ? `Synthesis path · ${policyContext.length} policy document${policyContext.length === 1 ? "" : "s"} plus live case`
            : "Live signal path · selected case context only",
    })
  );

  if (policyContext.length) {
    steps.push(
      createStep({
        tool: "rag.policy",
        label: "Retrieved Amazon sustainability policy context",
        detail: policyContext.map((document) => document.title).join(" · "),
      })
    );
  }

  const provider = chooseReasoningProvider({ route });

  if (provider === "bedrock" && !isBedrockConfigured()) {
    steps.push(
      createStep({
        tool: "config.bedrock",
        label: "Bedrock is not configured for this deployment",
        detail: "AWS credentials or BEDROCK_MODEL_ID are missing",
        status: "failed",
      })
    );
  }

  if (provider === "gemini" && !process.env.GEMINI_API_KEY) {
    steps.push(
      createStep({
        tool: "config.gemini",
        label: "Gemini is not configured for this deployment",
        detail: "GEMINI_API_KEY is missing",
        status: "failed",
      })
    );

    return response.status(200).json({
      ok: false,
      mode: "unavailable",
      model: null,
      title: "Gemini unavailable",
      summary: "The live agent cannot answer because Gemini is not configured for this deployment.",
      sections: [],
      recommendedActions: [],
      message: "Gemini is not configured for this deployment.",
      execution: {
        status: "unavailable",
        currentTask: "Gemini unavailable",
        steps,
        completedAt: new Date().toISOString(),
      },
    });
  }

  if (provider !== "gemini" && provider !== "bedrock") {
    return response.status(200).json({
      ok: false,
      mode: "unavailable",
      model: null,
      provider: null,
      title: "Reasoning unavailable",
      summary: "No supported model provider is configured for this deployment.",
      sections: [],
      recommendedActions: [],
      message: "No supported model provider is configured for this deployment.",
      execution: {
        status: "unavailable",
        currentTask: "Reasoning unavailable",
        steps,
        completedAt: new Date().toISOString(),
      },
    });
  }

  try {
    steps.push(
      createStep({
        tool: provider === "bedrock" ? "bedrock.converse" : "gemini.generateContent",
        label: provider === "bedrock" ? "Sent the case context to Bedrock" : "Sent the case context to Gemini",
        detail: provider === "bedrock" ? "Policy/compliance reasoning path" : `Model ${GEMINI_MODEL}`,
      })
    );

    const modelResponse = await invokeReasoningModel({
      provider,
      prompt: buildGeminiPrompt({
        alertSnapshot,
        question,
        dashboardSnapshot,
        attachments,
        route,
        policyContext,
      }),
    });
    const text = modelResponse.text;
    const parsed = normalizeParsedResponse(parseStructuredJson(text), route, text);

    steps.push(
      createStep({
        tool: "response.parse",
        label: "Parsed model response into the ForestGuard schema",
        detail: `${parsed.title}${parsed.route ? ` · ${parsed.route}` : ""}`,
      })
    );

    return response.status(200).json({
      ok: true,
      mode: provider,
      provider,
      model: modelResponse.model,
      title: parsed.title,
      summary: parsed.summary,
      sections: parsed.sections,
      recommendedActions: parsed.recommendedActions,
      route: parsed.route || route,
      message: parsed.summary,
      execution: {
        status: "completed",
        currentTask: "Completed case reasoning run",
        steps,
        completedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    steps.push(
      createStep({
        tool: "agent.error",
        label: "Agent run failed",
        detail: error.message,
        status: "failed",
      })
    );

    return response.status(200).json({
      ok: false,
      mode: "error",
      provider,
      model: provider === "bedrock" ? process.env.BEDROCK_MODEL_ID || null : GEMINI_MODEL,
      title: "Agent request failed",
      summary: "The live agent could not complete this request.",
      sections: [],
      recommendedActions: [],
      message: error.message,
      execution: {
        status: "error",
        currentTask: "Agent request failed",
        steps,
        completedAt: new Date().toISOString(),
      },
    });
  }
}
