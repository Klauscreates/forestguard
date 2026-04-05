import { alerts as fallbackAlerts } from "../data/alerts.js";
import { forestGuardBusinessContext } from "../data/business-context.js";
import { findDocumentedSupplyChainLinks } from "../data/supply-chain-links.js";

export const DETER_WFS_URL = "https://terrabrasilis.dpi.inpe.br/geoserver/deter-amz/wfs";
export const DEFAULT_SINCE_HOURS = 24 * 7;
export const DEFAULT_REGION = "sao-felix-do-xingu";
export const DEFAULT_COMMODITY = "beef";
export const DEFAULT_ALERT_COUNT = 80;
export const DEFAULT_BBOX = {
  minLng: -54.2,
  minLat: -8.9,
  maxLng: -49.7,
  maxLat: -4.7,
};

const EVENT_TYPE_MAP = {
  DESMATAMENTO_CR: "Forest-loss spike",
  DESMATAMENTO_VEG: "Forest-loss spike",
  DEGRADACAO: "Forest degradation",
  MINERACAO: "Land-use pressure",
  CICATRIZ_DE_QUEIMADA: "Burn scar",
};

const THREAT_MAP = {
  DESMATAMENTO_CR: "Rapid forest-to-pasture conversion pressure",
  DESMATAMENTO_VEG: "Forest clearing in cattle-linked monitoring territory",
  DEGRADACAO: "Progressive forest degradation that can precede clearing",
  MINERACAO: "Land-use pressure from non-agricultural disturbance",
  CICATRIZ_DE_QUEIMADA: "Thermal/burn-scar context around land-use conversion",
};

const ACTION_MAP = {
  critical: "Open supplier review and request refreshed traceability documentation.",
  high: "Escalate to compliance review and preserve the alert packet in the sourcing risk register.",
  medium: "Keep the zone under enhanced monitoring and request a fresh analyst review.",
  low: "Monitor the zone for repeat activity before changing sourcing posture.",
};

const CARBON_TRACKED_EVENT_TYPES = new Set(["Forest-loss spike"]);

const round = (value, digits = 1) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

export function severityFromRisk(risk) {
  if (risk >= 90) return "critical";
  if (risk >= 70) return "high";
  if (risk >= 40) return "medium";
  return "low";
}

export function formatCoords(lat, lng) {
  const latLabel = `${Math.abs(lat).toFixed(2)}°${lat < 0 ? "S" : "N"}`;
  const lngLabel = `${Math.abs(lng).toFixed(2)}°${lng < 0 ? "W" : "E"}`;
  return `${latLabel}, ${lngLabel}`;
}

export function formatRelativeTime(dateLike) {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return "Unknown";

  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));

  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;

  const diffMonths = Math.round(diffDays / 30);
  return `${diffMonths}mo ago`;
}

export function buildDetersUrl({ sinceHours = DEFAULT_SINCE_HOURS, count = DEFAULT_ALERT_COUNT, bbox = DEFAULT_BBOX } = {}) {
  const sinceDate = new Date(Date.now() - sinceHours * 60 * 60 * 1000);
  const params = new URLSearchParams({
    service: "WFS",
    version: "2.0.0",
    request: "GetFeature",
    typeNames: "deter-amz:deter_public",
    outputFormat: "application/json",
    srsName: "EPSG:4326",
    count: String(count),
    sortBy: "date D",
    CQL_FILTER: `date >= '${sinceDate.toISOString().slice(0, 10)}'`,
    bbox: `${bbox.minLng},${bbox.minLat},${bbox.maxLng},${bbox.maxLat},EPSG:4326`,
  });

  return `${DETER_WFS_URL}?${params.toString()}`;
}

function getFeatureDateValue(properties = {}) {
  return properties.date || properties.view_date || properties.data || null;
}

function toFeatureDate(properties = {}) {
  const rawValue = getFeatureDateValue(properties);
  if (!rawValue) return new Date();
  if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    return new Date(`${rawValue}T12:00:00Z`);
  }
  const parsed = new Date(rawValue);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function getFeatureAreaKm2(properties = {}) {
  const candidates = [
    properties.areamunkm,
    properties.areauckm,
    properties.area_km,
    properties.area_km2,
    properties.area,
  ];

  for (const value of candidates) {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) {
      return numeric;
    }
  }

  return 0;
}

export function getFeatureCentroid(feature) {
  const points = [];

  const collect = (coords) => {
    if (!Array.isArray(coords)) return;

    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      points.push({ lng: coords[0], lat: coords[1] });
      return;
    }

    coords.forEach(collect);
  };

  collect(feature?.geometry?.coordinates);

  if (!points.length) {
    return { lat: -6.6448, lng: -51.9951 };
  }

  const bounds = points.reduce(
    (acc, point) => ({
      minLat: Math.min(acc.minLat, point.lat),
      maxLat: Math.max(acc.maxLat, point.lat),
      minLng: Math.min(acc.minLng, point.lng),
      maxLng: Math.max(acc.maxLng, point.lng),
    }),
    { minLat: Infinity, maxLat: -Infinity, minLng: Infinity, maxLng: -Infinity }
  );

  return {
    lat: round((bounds.minLat + bounds.maxLat) / 2, 4),
    lng: round((bounds.minLng + bounds.maxLng) / 2, 4),
  };
}

export function pointInPolygon(point, polygon) {
  const [lat, lng] = point;
  let inside = false;

  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const [latA, lngA] = polygon[index];
    const [latB, lngB] = polygon[previous];

    const intersects =
      lngA > lng !== lngB > lng &&
      lat < ((latB - latA) * (lng - lngA)) / ((lngB - lngA) || Number.EPSILON) + latA;

    if (intersects) inside = !inside;
  }

  return inside;
}

function normalizeClassName(className) {
  return (className || "DEGRADACAO").toUpperCase();
}

function getEventType(className) {
  return EVENT_TYPE_MAP[normalizeClassName(className)] || "Forest disturbance";
}

function getThreatLabel(className) {
  return THREAT_MAP[normalizeClassName(className)] || "Forest-linked land-use pressure";
}

function getLandUseCompatibility(className) {
  const normalized = normalizeClassName(className);

  if (normalized.startsWith("DESMATAMENTO")) return 100;
  if (normalized === "MINERACAO") return 88;
  if (normalized === "CICATRIZ_DE_QUEIMADA") return 82;
  if (normalized === "DEGRADACAO") return 74;
  return 68;
}

function getMagnitudeScore(hectares) {
  return Math.min(100, hectares * 2.5 + 8);
}

function getRecencyScore(daysSinceDetection, signalCount7d, signalCount30d) {
  const recencyBase = Math.max(0, 100 - daysSinceDetection * 8);
  const frequencyBoost = Math.min(100, signalCount7d * 10 + signalCount30d * 2);
  return Math.min(100, round(recencyBase * 0.6 + frequencyBoost * 0.4, 1));
}

export function computeRiskScore({
  hectares,
  daysSinceDetection,
  signalCount7d,
  signalCount30d,
  protectedAreaOverlap,
  landUseCompatibility,
  businessSensitivity,
}) {
  const disturbanceMagnitude = getMagnitudeScore(hectares);
  const recencyAndFrequency = getRecencyScore(daysSinceDetection, signalCount7d, signalCount30d);
  const protectedAreaScore = protectedAreaOverlap ? 100 : 30;

  const weightedScore =
    disturbanceMagnitude * 0.35 +
    recencyAndFrequency * 0.25 +
    protectedAreaScore * 0.2 +
    landUseCompatibility * 0.1 +
    businessSensitivity * 0.1;

  return Math.max(1, Math.min(100, Math.round(weightedScore)));
}

function buildZoneLabel(protectedAreaOverlap) {
  return protectedAreaOverlap
    ? `${forestGuardBusinessContext.region.protectedArea} monitoring zone`
    : `${forestGuardBusinessContext.region.name} municipality monitoring zone`;
}

function buildWhyText({ protectedAreaOverlap, eventType, hectares, sourceLabel }) {
  const overlapClause = protectedAreaOverlap
    ? `${forestGuardBusinessContext.region.protectedArea} is in scope, which raises protected-area scrutiny for beef-linked sourcing risk.`
    : `${forestGuardBusinessContext.region.name} is a cattle-linked frontier municipality where repeated disturbance signals matter to sourcing confidence.`;

  return `${overlapClause} ${eventType} is visible in the public alert feed with ${hectares} impacted hectares from ${sourceLabel}.`;
}

function buildBusinessImpact({ protectedAreaOverlap, risk, hectares, carbonEstimate }) {
  const protectedAreaImpact = protectedAreaOverlap
    ? "Because the alert overlaps the protected-area monitoring context, it raises the likelihood of a compliance and reputational escalation."
    : "Because the alert sits in a municipality-level cattle monitoring zone, it raises procurement uncertainty that should be documented before sourcing confidence is assumed.";

  const carbonClause = carbonEstimate?.tracked && carbonEstimate?.estimatedCarbonTonnes
    ? ` The current methodology maps that forest-loss area to approximately ${carbonEstimate.estimatedCarbonTonnes} tCO2e at risk.`
    : "";

  return `${protectedAreaImpact} ForestGuard scores the event at ${risk}/100 on ${hectares} impacted hectares inside the monitored beef geography.${carbonClause}`;
}

function buildSupplyChainLinkSummary(links = []) {
  if (!links.length) return null;

  const buyers = [...new Set(links.flatMap((entry) => entry.linkedBuyers))];
  return `Public reporting documents historical buyer links in this monitoring zone involving ${buyers.join(", ")}. ForestGuard is surfacing those links as contextual due-diligence evidence, not as a direct ranch match for this alert.`;
}

function buildDiscoveryClassification({ risk, protectedAreaOverlap, signalCount7d, weakSignalCount }) {
  if (protectedAreaOverlap || risk >= 80) {
    return {
      key: "known_case",
      label: "Known case",
      summary: "Confirmed live disturbance in the monitored zone.",
    };
  }

  if (risk >= 55 && signalCount7d >= 2 && weakSignalCount > 0) {
    return {
      key: "probable_new_case",
      label: "Probable new case",
      summary: "Live disturbance plus recent external signals justify immediate analyst review.",
    };
  }

  return {
    key: "watchlist",
    label: "Watchlist",
    summary: "Monitor repeated activity and external context before opening a full case.",
  };
}

function getCarbonEstimate(eventType, hectares, protectedAreaOverlap) {
  if (!CARBON_TRACKED_EVENT_TYPES.has(eventType)) {
    return {
      tracked: false,
      carbonDensity: null,
      estimatedCarbonTonnes: null,
      carbonMethodology: forestGuardBusinessContext.carbonMethodology.scopeLabel,
      carbonSource: forestGuardBusinessContext.carbonMethodology.sourceLabel,
    };
  }

  const carbonDensity = protectedAreaOverlap
    ? forestGuardBusinessContext.carbonMethodology.densityByZone.protectedAreaForest
    : forestGuardBusinessContext.carbonMethodology.densityByZone.degradedFrontier;

  return {
    tracked: true,
    carbonDensity,
    estimatedCarbonTonnes: Math.round(hectares * carbonDensity * 3.67),
    carbonMethodology: forestGuardBusinessContext.carbonMethodology.scopeLabel,
    carbonSource: forestGuardBusinessContext.carbonMethodology.sourceLabel,
  };
}

function buildRecommendedActions({ severity, protectedAreaOverlap, zone, signalCount30d }) {
  const actions = [
    ACTION_MAP[severity] || ACTION_MAP.medium,
    `Preserve the event in the ${zone} due-diligence workflow with the current evidence trail and public data lineage.`,
    `Track repeat activity against the last-30-day volume (${signalCount30d} signals) before the next sourcing review.`,
  ];

  if (protectedAreaOverlap) {
    actions.splice(
      1,
      0,
      `Escalate ${forestGuardBusinessContext.region.protectedArea} overlap to sustainability and compliance before approving additional beef-linked sourcing confidence.`
    );
  }

  return actions;
}

function buildInterventionPolicy(protectedAreaOverlap) {
  return protectedAreaOverlap
    ? {
        priority: "Immediate",
        primary: "Immediate IBAMA Field Inspection",
        secondary: "Meatpacker Blockage",
        policy: forestGuardBusinessContext.interventionPolicy.protectedArea,
      }
    : {
        priority: "High",
        primary: "Enhanced procurement review",
        secondary: "Traceability escalation",
        policy: forestGuardBusinessContext.interventionPolicy.municipality,
      };
}

export function normalizeDeterFeature(feature, allFeatures, options = {}) {
  const properties = feature?.properties || {};
  const centroid = getFeatureCentroid(feature);
  const detectedAt = toFeatureDate(properties);
  const areaKm2 = getFeatureAreaKm2(properties);
  const hectares = Math.max(1, round(areaKm2 * 100, 1));
  const protectedAreaOverlap = options.protectedAreaResolver
    ? options.protectedAreaResolver(feature, centroid)
    : String(properties.uc || "").toLowerCase().includes("triunfo do xingu");
  const zone = buildZoneLabel(protectedAreaOverlap);
  const eventType = getEventType(properties.classname);
  const sameZoneFeatures = allFeatures.filter((entry) => {
    const entryCentroid = getFeatureCentroid(entry);
    const entryProtectedArea = options.protectedAreaResolver
      ? options.protectedAreaResolver(entry, entryCentroid)
      : String(entry?.properties?.uc || "").toLowerCase().includes("triunfo do xingu");
    return entryProtectedArea === protectedAreaOverlap;
  });
  const signalCount7d = sameZoneFeatures.filter((entry) => {
    const viewDate = toFeatureDate(entry?.properties || {});
    return Date.now() - viewDate.getTime() <= 7 * 24 * 60 * 60 * 1000;
  }).length;
  const signalCount30d = sameZoneFeatures.filter((entry) => {
    const viewDate = toFeatureDate(entry?.properties || {});
    return Date.now() - viewDate.getTime() <= 30 * 24 * 60 * 60 * 1000;
  }).length;
  const daysSinceDetection = Math.max(0, Math.round((Date.now() - detectedAt.getTime()) / (1000 * 60 * 60 * 24)));
  const landUseCompatibility = getLandUseCompatibility(properties.classname);
  const businessSensitivity = protectedAreaOverlap
    ? forestGuardBusinessContext.businessSensitivity.beefProtectedArea
    : forestGuardBusinessContext.businessSensitivity.beef;
  const risk = computeRiskScore({
    hectares,
    daysSinceDetection,
    signalCount7d,
    signalCount30d,
    protectedAreaOverlap,
    landUseCompatibility,
    businessSensitivity,
  });
  const severity = severityFromRisk(risk);
  const sourceLabel = `INPE TerraBrasilis DETER · ${properties.satellite || properties.sensor || "Amazon monitoring"}`;
  const trend = signalCount7d >= Math.max(2, Math.ceil(signalCount30d / 4)) ? "increasing" : "stable";
  const title = `${hectares} ha ${eventType.toLowerCase()} signal`;
  const carbonEstimate = getCarbonEstimate(eventType, hectares, protectedAreaOverlap);
  const historicalBuyerLinks = findDocumentedSupplyChainLinks({
    protectedAreaOverlap,
    municipality: forestGuardBusinessContext.region.name,
  });
  const supplyChainLinkSummary = buildSupplyChainLinkSummary(historicalBuyerLinks);
  const intervention = buildInterventionPolicy(protectedAreaOverlap);
  const weakSignals = (options.weakSignals || []).slice(0, 3);
  const discovery = buildDiscoveryClassification({
    risk,
    protectedAreaOverlap,
    signalCount7d,
    weakSignalCount: weakSignals.length,
  });

  return {
    id: properties.gid || feature.id || crypto.randomUUID(),
    eventType,
    type: eventType,
    severity,
    title,
    zone,
    lat: centroid.lat,
    lng: centroid.lng,
    coords: formatCoords(centroid.lat, centroid.lng),
    hectares,
    risk,
    trend,
    signalCount7d,
    signalCount30d,
    signal_count_7d: signalCount7d,
    signal_count_30d: signalCount30d,
    why: buildWhyText({ protectedAreaOverlap, eventType, hectares, sourceLabel }),
    action: ACTION_MAP[severity] || ACTION_MAP.medium,
    intervention,
    discovery,
    weakSignals,
    threat: getThreatLabel(properties.classname),
    detectedAt: detectedAt.toISOString(),
    timeLabel: formatRelativeTime(detectedAt),
    time: formatRelativeTime(detectedAt),
    source: sourceLabel,
    dataLineage: [
      "INPE TerraBrasilis WFS",
      `DETER class: ${properties.classname || "Unknown"}`,
      `Publish month: ${properties.publish_month || "Unknown"}`,
    ],
    protectedAreaOverlap,
    landUseContext: forestGuardBusinessContext.landUseContext,
    businessImpact: buildBusinessImpact({ protectedAreaOverlap, risk, hectares, carbonEstimate }),
    recommendedActions: buildRecommendedActions({ severity, protectedAreaOverlap, zone, signalCount30d }),
    historicalBuyerLinks,
    supplyChainLinkSummary,
    carbonTracked: carbonEstimate.tracked,
    carbonDensity: carbonEstimate.carbonDensity,
    estimatedCarbonTonnes: carbonEstimate.estimatedCarbonTonnes,
    carbonMethodology: carbonEstimate.carbonMethodology,
    carbonSource: carbonEstimate.carbonSource,
    evidence: [
      `${eventType} detected on ${detectedAt.toISOString().slice(0, 10)}`,
      `Sensor: ${properties.satellite || properties.sensor || "Unknown"}`,
      protectedAreaOverlap ? "Protected-area overlap: yes" : "Protected-area overlap: no",
    ],
    nextReviewStep: forestGuardBusinessContext.nextReviewDefault,
  };
}

export function buildAlertsPayload({ alerts, mode, generatedAt, sources, includeRaster = false, execution = null }) {
  const normalizedAlerts = [...alerts].sort((left, right) => {
    if (right.risk !== left.risk) return right.risk - left.risk;
    return new Date(right.detectedAt).getTime() - new Date(left.detectedAt).getTime();
  });

  const summary = normalizedAlerts.reduce(
    (accumulator, alert) => {
      accumulator.alertCount += 1;
      accumulator.totalHectares += alert.hectares;
      accumulator.peakRisk = Math.max(accumulator.peakRisk, alert.risk);
      accumulator[`${alert.severity}Count`] += 1;
      if (alert.carbonTracked && alert.estimatedCarbonTonnes) {
        accumulator.carbonTrackedAlerts += 1;
        accumulator.estimatedCarbonAtRiskTonnes += alert.estimatedCarbonTonnes;
        if (alert.protectedAreaOverlap) {
          accumulator.protectedAreaCarbonTonnes += alert.estimatedCarbonTonnes;
        }
      }
      if (alert.discovery?.key === "known_case") accumulator.knownCaseCount += 1;
      if (alert.discovery?.key === "watchlist") accumulator.watchlistCount += 1;
      if (alert.discovery?.key === "probable_new_case") accumulator.probableNewCaseCount += 1;
      return accumulator;
    },
    {
      alertCount: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      totalHectares: 0,
      peakRisk: 0,
      carbonTrackedAlerts: 0,
      estimatedCarbonAtRiskTonnes: 0,
      protectedAreaCarbonTonnes: 0,
      knownCaseCount: 0,
      watchlistCount: 0,
      probableNewCaseCount: 0,
    }
  );

  const heatPoints = normalizedAlerts.map((alert) => ({
    id: alert.id,
    lat: alert.lat,
    lng: alert.lng,
    intensity: Math.min(1, alert.risk / 100 + alert.hectares / 150),
  }));

  return {
    mode,
    generatedAt,
    sources,
    region: {
      name: forestGuardBusinessContext.region.name,
      commodity: forestGuardBusinessContext.commodity,
      geometryVersion: "geoBoundaries ADM2 + IDEFLOR-Bio APA boundary",
    },
    summary: {
      ...summary,
      totalHectares: round(summary.totalHectares, 1),
      estimatedCarbonAtRiskTonnes: Math.round(summary.estimatedCarbonAtRiskTonnes),
      protectedAreaCarbonTonnes: Math.round(summary.protectedAreaCarbonTonnes),
    },
    alerts: normalizedAlerts,
    layers: {
      heatPoints,
      thermalTileTemplate: includeRaster
        ? "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_Thermal_Anomalies_375m/default/{date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png"
        : undefined,
    },
    discovery: {
      weakSignals: [],
      fetchedAt: generatedAt,
    },
    execution,
  };
}

export function buildLivePayloadFromDeter(features, options = {}) {
  const normalizedAlerts = features.map((feature) => normalizeDeterFeature(feature, features, options));
  const payload = buildAlertsPayload({
    alerts: normalizedAlerts,
    mode: "live",
    generatedAt: new Date().toISOString(),
    sources: [
      "INPE TerraBrasilis DETER public feed",
      ...(options.weakSignals?.length ? ["Public news/regulatory weak signals"] : []),
    ],
    includeRaster: options.includeRaster,
    execution: options.execution || null,
  });
  payload.discovery = {
    weakSignals: options.weakSignals || [],
    fetchedAt: options.weakSignalsFetchedAt || payload.generatedAt,
    failures: options.weakSignalFailures || [],
  };
  return payload;
}

export function buildFallbackAlertsPayload(options = {}) {
  return buildAlertsPayload({
    alerts: fallbackAlerts,
    mode: "fallback",
    generatedAt: new Date().toISOString(),
    sources: ["ForestGuard fallback demo dataset"],
    includeRaster: false,
    execution: options.execution || null,
  });
}
