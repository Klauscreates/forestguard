const GEMINI_MODEL = "gemini-2.5-flash";
const MAX_FILE_CHARS = 18000;

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

  return JSON.parse(withoutFence);
}

function buildFilePrompt({ fileName, mimeType, content, alertSnapshot, dashboardSnapshot }) {
  return `
You are ForestGuard, a procurement and compliance operations agent.

Analyze the uploaded file against the supplied case context. Use only the file contents and the current alert context. Do not invent suppliers, legal findings, or hidden metadata.

Selected alert:
${JSON.stringify(alertSnapshot, null, 2)}

Current dashboard context:
${JSON.stringify(dashboardSnapshot || {}, null, 2)}

File name: ${fileName}
Mime type: ${mimeType}

File content:
${content}

Return JSON with:
- title: short analysis title
- summary: concise paragraph
- keyFindings: array of 2 to 4 concise findings
- caseImpact: short explanation of how this changes the selected case
- recommendedAction: one concrete next move
`.trim();
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  const { fileName, mimeType, fileSize, content, alertSnapshot, dashboardSnapshot } = request.body || {};
  const steps = [];

  if (!fileName || !content || !alertSnapshot) {
    return response.status(400).json({ error: "fileName, content, and alertSnapshot are required" });
  }

  steps.push(
    createStep({
      tool: "file.validate",
      label: "Validated uploaded file payload",
      detail: `${fileName} · ${Math.round((fileSize || content.length) / 1024)} KB`,
    })
  );

  if (!process.env.GEMINI_API_KEY) {
    steps.push(
      createStep({
        tool: "config.gemini",
        label: "Gemini is not configured for file analysis",
        detail: "GEMINI_API_KEY is missing",
        status: "failed",
      })
    );

    return response.status(200).json({
      ok: false,
      mode: "unavailable",
      message: "Gemini is not configured for this deployment.",
      execution: {
        status: "unavailable",
        currentTask: "File analysis unavailable",
        steps,
        completedAt: new Date().toISOString(),
      },
    });
  }

  const truncated = content.length > MAX_FILE_CHARS;
  const contentForAnalysis = truncated ? content.slice(0, MAX_FILE_CHARS) : content;

  steps.push(
    createStep({
      tool: "file.extract",
      label: "Prepared file contents for analysis",
      detail: truncated ? `Trimmed to ${MAX_FILE_CHARS} characters` : `${contentForAnalysis.length} characters`,
    })
  );

  try {
    steps.push(
      createStep({
        tool: "gemini.generateContent",
        label: "Sent the uploaded file to Gemini for analysis",
        detail: `Model ${GEMINI_MODEL}`,
      })
    );

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: buildFilePrompt({ fileName, mimeType, content: contentForAnalysis, alertSnapshot, dashboardSnapshot }) }],
            },
          ],
          generationConfig: {
            temperature: 0.15,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      steps.push(
        createStep({
          tool: "gemini.generateContent",
          label: "Gemini file-analysis request failed",
          detail: `HTTP ${geminiResponse.status}`,
          status: "failed",
        })
      );

      throw new Error(`Gemini request failed: ${geminiResponse.status}`);
    }

    const payload = await geminiResponse.json();
    const parsed = parseStructuredJson(payload?.candidates?.[0]?.content?.parts?.[0]?.text || "");

    steps.push(
      createStep({
        tool: "response.parse",
        label: "Parsed the uploaded-file analysis response",
        detail: parsed.title,
      })
    );

    return response.status(200).json({
      ok: true,
      mode: "gemini",
      model: GEMINI_MODEL,
      analysis: {
        ...parsed,
        truncated,
      },
      execution: {
        status: "completed",
        currentTask: "Completed file analysis",
        steps,
        completedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    steps.push(
      createStep({
        tool: "file-analysis.error",
        label: "Uploaded file analysis failed",
        detail: error.message,
        status: "failed",
      })
    );

    return response.status(200).json({
      ok: false,
      mode: "error",
      message: error.message,
      execution: {
        status: "error",
        currentTask: "Uploaded file analysis failed",
        steps,
        completedAt: new Date().toISOString(),
      },
    });
  }
}
