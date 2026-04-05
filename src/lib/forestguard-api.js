import apaBoundary from "../data/apa-triunfo-do-xingu-boundary.json";
import {
  DEFAULT_COMMODITY,
  DEFAULT_REGION,
  DEFAULT_SINCE_HOURS,
  buildDetersUrl,
  buildFallbackAlertsPayload,
  buildLivePayloadFromDeter,
  getFeatureCentroid,
  pointInPolygon,
} from "./forestguard-shared";

function parseJsonResponse(response) {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

async function parseJsonBody(response) {
  const contentType = response.headers.get("content-type") || "";
  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}${responseText ? ` · ${responseText.slice(0, 240)}` : ""}`);
  }

  if (!contentType.includes("application/json")) {
    throw new Error(
      `Expected JSON response, received ${contentType || "unknown content type"}${responseText ? ` · ${responseText.slice(0, 240)}` : ""}`
    );
  }

  return JSON.parse(responseText);
}

function isInsideApa(feature, centroid = getFeatureCentroid(feature)) {
  return pointInPolygon([centroid.lat, centroid.lng], apaBoundary) || String(feature?.properties?.uc || "").toLowerCase().includes("triunfo do xingu");
}

async function fetchDirectDeterPayload({ sinceHours = DEFAULT_SINCE_HOURS, includeRaster = false } = {}) {
  const steps = [
    {
      id: crypto.randomUUID(),
      tool: "browser.fetch",
      label: "Requested DETER public feed directly from the browser",
      detail: buildDetersUrl({ sinceHours }),
      status: "completed",
      timestamp: new Date().toISOString(),
    },
  ];
  const response = await fetch(buildDetersUrl({ sinceHours }), {
    headers: { Accept: "application/json" },
  });
  const payload = await parseJsonResponse(response);

  return buildLivePayloadFromDeter(payload.features || [], {
    includeRaster,
    protectedAreaResolver: isInsideApa,
    execution: {
      status: "completed",
      currentTask: "Monitoring live public alerts",
      steps: [
        ...steps,
        {
          id: crypto.randomUUID(),
          tool: "normalize.alerts",
          label: "Normalized direct-browser DETER response",
          detail: `${payload.features?.length || 0} raw feature${payload.features?.length === 1 ? "" : "s"}`,
          status: "completed",
          timestamp: new Date().toISOString(),
        },
      ],
      completedAt: new Date().toISOString(),
    },
  });
}

export async function fetchAlertsData({
  region = DEFAULT_REGION,
  commodity = DEFAULT_COMMODITY,
  sinceHours = DEFAULT_SINCE_HOURS,
  includeRaster = false,
} = {}) {
  const params = new URLSearchParams({
    region,
    commodity,
    since_hours: String(sinceHours),
    includeRaster: includeRaster ? "true" : "false",
  });

  try {
    const response = await fetch(`/api/alerts?${params.toString()}`);
    const payload = await parseJsonResponse(response);

    if (payload?.mode === "fallback") {
      try {
        const directPayload = await fetchDirectDeterPayload({ sinceHours, includeRaster });
        return {
          ...directPayload,
          execution: {
            ...(directPayload.execution || {}),
            steps: [
              {
                id: crypto.randomUUID(),
                tool: "api.alerts",
                label: "Server runtime returned fallback data",
                detail: "Browser promoted the dashboard back to the direct live DETER feed.",
                status: "failed",
                timestamp: new Date().toISOString(),
              },
              ...(directPayload.execution?.steps || []),
            ],
          },
        };
      } catch {
        return payload;
      }
    }

    return payload;
  } catch (apiError) {
    try {
      return await fetchDirectDeterPayload({ sinceHours, includeRaster });
    } catch (liveError) {
      return buildFallbackAlertsPayload({
        execution: {
          status: "fallback",
          currentTask: "Using fallback dataset after live ingest failure",
          steps: [
            {
              id: crypto.randomUUID(),
              tool: "api.alerts",
              label: "Local /api/alerts path was unavailable",
              detail: apiError.message,
              status: "failed",
              timestamp: new Date().toISOString(),
            },
            {
              id: crypto.randomUUID(),
              tool: "browser.fetch",
              label: "Direct DETER browser request failed",
              detail: liveError.message,
              status: "failed",
              timestamp: new Date().toISOString(),
            },
            {
              id: crypto.randomUUID(),
              tool: "fallback.dataset",
              label: "Loaded ForestGuard fallback dataset",
              detail: "Live alert ingest is unavailable in the current runtime",
              status: "completed",
              timestamp: new Date().toISOString(),
            },
          ],
          completedAt: new Date().toISOString(),
        },
      });
    }
  }
}

export async function askAlertQuestion({ alertId, question, alertSnapshot }) {
  const payload = {
    alertId,
    question,
    alertSnapshot,
  };

  const response = await fetch("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseJsonBody(response);
}

export async function runAgentChat({ alertId, question, alertSnapshot, dashboardSnapshot, attachments = [] }) {
  try {
    const response = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        alertId,
        question,
        alertSnapshot,
        dashboardSnapshot,
        attachments,
      }),
    });

    return await parseJsonBody(response);
  } catch (error) {
    return {
      ok: false,
      mode: "error",
      model: null,
      title: "Agent request failed",
      summary: error.message,
      message: error.message,
      sections: [
        { label: "Failure", text: error.message },
        { label: "Cause", text: "The command center did not receive a valid JSON response from /api/ask." },
        { label: "Next step", text: "Retry the request after the current deployment stabilizes or inspect the Vercel function response." },
      ],
      recommendedActions: [],
      execution: {
        status: "error",
        currentTask: "Agent request failed",
        steps: [
          {
            id: crypto.randomUUID(),
            tool: "api.ask",
            label: "Command center request failed",
            detail: error.message,
            status: "failed",
            timestamp: new Date().toISOString(),
          },
        ],
        completedAt: new Date().toISOString(),
      },
    };
  }
}

export async function requestAgentSpeech(text) {
  const response = await fetch("/api/speak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("audio/")) {
    return {
      ok: true,
      blob: await response.blob(),
    };
  }

  return parseJsonBody(response);
}

export async function requestLiveAgentToken() {
  const response = await fetch("/api/live-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  return parseJsonBody(response);
}

export async function analyzeUploadedFile({
  fileName,
  mimeType,
  fileSize,
  content,
  alertSnapshot,
  dashboardSnapshot,
}) {
  const response = await fetch("/api/file-analysis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName,
      mimeType,
      fileSize,
      content,
      alertSnapshot,
      dashboardSnapshot,
    }),
  });

  return parseJsonBody(response);
}
