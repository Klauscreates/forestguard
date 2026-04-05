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
  return (
    pointInPolygon([centroid.lat, centroid.lng], apaBoundary) ||
    String(feature?.properties?.uc || "").toLowerCase().includes("triunfo do xingu")
  );
}

/**
 * Fetch DETER WFS safely.
 * - Checks Content-Type before calling .json() — avoids the XML parse crash.
 * - Treats any non-JSON response as a live-source failure and falls through to fallback.
 */
async function fetchDeterSafe(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000); // 12s timeout

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json, text/plain, */*" },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`DETER HTTP ${res.status}`);
    }

    // Check content-type — GeoServer sometimes returns XML exception even on 200
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("xml") || ct.includes("text/html")) {
      const text = await res.text();
      throw new Error(
        `DETER returned non-JSON (${ct.split(";")[0].trim()}): ${text.slice(0, 120)}`
      );
    }

    const text = await res.text();

    // Extra guard: if body starts with XML declaration, reject it
    if (text.trimStart().startsWith("<")) {
      throw new Error(
        `DETER returned XML body: ${text.slice(0, 120)}`
      );
    }

    return JSON.parse(text);
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

export default async function handler(request, response) {
  // CORS for local dev
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (request.method === "OPTIONS") {
    return response.status(204).end();
  }

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
      error:
        "Unsupported ForestGuard scope. This MVP is locked to São Félix do Xingu beef monitoring.",
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
    const weakSignalPromise = fetchWeakSignals().catch((err) => ({
      fetchedAt: new Date().toISOString(),
      signals: [],
      failures: [{ feedId: "signals", category: "signals", error: err.message }],
    }));

    const deterUrl = buildDetersUrl({ sinceHours });
    steps.push(
      createStep({
        tool: "fetch.deter",
        label: "Requested INPE TerraBrasilis DETER public feed",
        detail: deterUrl,
      })
    );

    const payload = await fetchDeterSafe(deterUrl);
    const weakSignalResult = await weakSignalPromise;

    steps.push(
      createStep({
        tool: "fetch.deter",
        label: "Received DETER response",
        detail: `${payload.features?.length || 0} raw feature${payload.features?.length === 1 ? "" : "s"}`,
      })
    );
    steps.push(
      createStep({
        tool: "fetch.signals",
        label: "Retrieved weak signals",
        detail: `${weakSignalResult.signals.length} headline${weakSignalResult.signals.length === 1 ? "" : "s"}`,
        status: weakSignalResult.failures.length && !weakSignalResult.signals.length ? "failed" : "completed",
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
    // Graceful fallback — never 500 to the client
    const fallbackPayload = buildFallbackAlertsPayload({
      execution: {
        status: "fallback",
        currentTask: "Using fallback dataset after live ingest failure",
        steps: [
          ...steps,
          createStep({
            tool: "fetch.deter",
            label: "Live DETER ingest failed — falling back",
            detail: error.message,
            status: "failed",
          }),
          createStep({
            tool: "fallback.dataset",
            label: "Loaded ForestGuard fallback dataset",
            detail: "Static fallback fixtures replaced unavailable live public alerts",
          }),
        ],
        completedAt: new Date().toISOString(),
      },
    });

    return response.status(200).json(fallbackPayload);
  }
}
