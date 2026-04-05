import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  DEFAULT_COMMODITY,
  DEFAULT_REGION,
  DEFAULT_SINCE_HOURS,
  buildDetersUrl,
  buildFallbackAlertsPayload,
  buildLivePayloadFromDeter,
  getFeatureCentroid,
  pointInPolygon,
} from "../src/lib/forestguard-shared.js";
import { fetchWeakSignals } from "./_weak-signals.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const apaBoundaryPath = resolve(__dirname, "../src/data/apa-triunfo-do-xingu-boundary.json");
const apaBoundary = JSON.parse(readFileSync(apaBoundaryPath, "utf-8"));

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

function isInsideApa(feature, centroid = getFeatureCentroid(feature)) {
  return pointInPolygon([centroid.lat, centroid.lng], apaBoundary) || String(feature?.properties?.uc || "").toLowerCase().includes("triunfo do xingu");
}

export default async function handler(request, response) {
  const region = request.query.region || DEFAULT_REGION;
  const commodity = request.query.commodity || DEFAULT_COMMODITY;
  const sinceHours = Number(request.query.since_hours || DEFAULT_SINCE_HOURS);
  const includeRaster = request.query.includeRaster === "true";
  const steps = [
    createStep({
      tool: "request.scope",
      label: "Validated ForestGuard monitoring scope",
      detail: `${region} · ${commodity} · ${sinceHours}h window with bounded DETER query`,
    }),
  ];

  if (region !== DEFAULT_REGION || commodity !== DEFAULT_COMMODITY) {
    return response.status(400).json({
      error: "Unsupported ForestGuard scope. This MVP is locked to São Félix do Xingu beef monitoring.",
    });
  }

  try {
    steps.push(
      createStep({
        tool: "fetch.signals",
        label: "Requested public weak signals",
        detail: "Public news/regulatory headlines for enforcement and cattle-linked context",
      })
    );
    const weakSignalPromise = fetchWeakSignals();

    steps.push(
      createStep({
        tool: "fetch.deter",
        label: "Requested INPE TerraBrasilis DETER public feed",
        detail: buildDetersUrl({ sinceHours }),
      })
    );

    const liveResponse = await fetch(buildDetersUrl({ sinceHours }), {
      headers: { Accept: "application/json" },
    });

    if (!liveResponse.ok) {
      throw new Error(`DETER request failed: ${liveResponse.status}`);
    }

    const payload = await liveResponse.json();
    const weakSignalResult = await weakSignalPromise.catch((error) => ({
      fetchedAt: new Date().toISOString(),
      signals: [],
      failures: [{ feedId: "signals", category: "signals", error: error.message }],
    }));
    steps.push(
      createStep({
        tool: "fetch.deter",
        label: "Received public DETER response",
        detail: `${payload.features?.length || 0} raw feature${payload.features?.length === 1 ? "" : "s"}`,
      })
    );
    steps.push(
      createStep({
        tool: "fetch.signals",
        label: "Retrieved weak signals",
        detail: `${weakSignalResult.signals.length} headline${weakSignalResult.signals.length === 1 ? "" : "s"} · ${weakSignalResult.failures.length} failed feed${weakSignalResult.failures.length === 1 ? "" : "s"}`,
        status: weakSignalResult.signals.length ? "completed" : weakSignalResult.failures.length ? "failed" : "completed",
      })
    );

    const livePayload = buildLivePayloadFromDeter(payload.features || [], {
      includeRaster,
      protectedAreaResolver: isInsideApa,
      weakSignals: weakSignalResult.signals,
      weakSignalsFetchedAt: weakSignalResult.fetchedAt,
      weakSignalFailures: weakSignalResult.failures,
      execution: {
        status: "completed",
        currentTask: "Monitoring live public alerts",
        steps: [
          ...steps,
          createStep({
            tool: "normalize.alerts",
            label: "Normalized live alerts and computed risk plus carbon context",
            detail: `${payload.features?.length || 0} feature${payload.features?.length === 1 ? "" : "s"} processed`,
          }),
        ],
        completedAt: new Date().toISOString(),
      },
    });
    return response.status(200).json(livePayload);
  } catch (error) {
    const fallbackPayload = buildFallbackAlertsPayload({
      execution: {
        status: "fallback",
        currentTask: "Using fallback dataset after live ingest failure",
        steps: [
          ...steps,
          createStep({
            tool: "fetch.deter",
            label: "Live DETER ingest failed",
            detail: error.message,
            status: "failed",
          }),
          createStep({
            tool: "fallback.dataset",
            label: "Loaded ForestGuard fallback dataset",
            detail: "Fallback fixtures replaced unavailable live public alerts",
          }),
        ],
        completedAt: new Date().toISOString(),
      },
    });

    return response.status(200).json(fallbackPayload);
  }
}
