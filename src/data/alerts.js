import { forestGuardBusinessContext } from "./business-context.js";
import { findDocumentedSupplyChainLinks } from "./supply-chain-links.js";

const fallbackAlertFixtures = [
  {
    id: "alert-001",
    eventType: "Forest-loss spike",
    severity: "critical",
    title: "+62% forest-loss alerts in 7 days",
    zone: "APA Triunfo do Xingu monitoring zone",
    lat: -6.64,
    lng: -51.99,
    coords: "6.64°S, 51.99°W",
    hectares: 740,
    risk: 97,
    trend: "increasing",
    signalCount7d: 12,
    signalCount30d: 31,
    why: "Monitored beef-linked sourcing zone. Active cattle pasture expansion. DETER alerts spiked inside the protected monitoring perimeter.",
    action: "Generate supplier review packet and request updated traceability documents.",
    threat: "Cattle pasture expansion inside monitored forest frontier",
    timeLabel: "2h ago",
    source: "ForestGuard fallback demo dataset",
    detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    dataLineage: ["Fallback alert fixture", "Protected-area demo scenario"],
    protectedAreaOverlap: true,
    landUseContext: "Protected-area cattle pressure in a monitored beef-sourcing region.",
    businessImpact:
      "This is a high-confidence demo of how procurement and compliance teams would respond when the monitored protected-area zone shows repeated forest-loss pressure.",
    recommendedActions: [
      "Open a supplier review window",
      "Request refreshed traceability and sourcing documents",
      "Preserve the event in the due-diligence workflow",
    ],
    evidence: ["Protected-area overlap: yes", "7-day signal spike", "Cattle-linked commodity context"],
    nextReviewStep: "Reassess the zone after the next public alert cycle and document any repeat activity.",
  },
  {
    id: "alert-002",
    eventType: "Protected-area overlap",
    severity: "critical",
    title: "520 ha clearing inside APA Triunfo",
    zone: "APA Triunfo do Xingu monitoring zone",
    lat: -6.3,
    lng: -52.4,
    coords: "6.30°S, 52.40°W",
    hectares: 520,
    risk: 94,
    trend: "increasing",
    signalCount7d: 8,
    signalCount30d: 22,
    why: "Protected-area overlap raises compliance scrutiny for the monitored beef geography.",
    action: "Escalate to sustainability and compliance review before additional sourcing confidence is assumed.",
    threat: "Forest clearing intersecting conservation-sensitive territory",
    timeLabel: "5h ago",
    source: "ForestGuard fallback demo dataset",
    detectedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    dataLineage: ["Fallback alert fixture", "Protected-area demo scenario"],
    protectedAreaOverlap: true,
    landUseContext: "Conservation-sensitive cattle frontier context.",
    businessImpact:
      "This event increases procurement, compliance, and reputational exposure because the monitored disturbance intersects a protected-area context.",
    recommendedActions: [
      "Escalate protected-area overlap to compliance",
      "Freeze assumptions of low-risk sourcing for the zone",
      "Prepare a documented analyst review packet",
    ],
    evidence: ["Protected-area overlap: yes", "High-impact clearing", "Active escalation state"],
    nextReviewStep: "Keep the event in manual review until the next alert cycle confirms whether the trend is stabilizing.",
  },
  {
    id: "alert-003",
    eventType: "Traceability gap",
    severity: "high",
    title: "GTA documentation missing in monitored zone",
    zone: "São Félix do Xingu municipality monitoring zone",
    lat: -7.1,
    lng: -51.8,
    coords: "7.10°S, 51.80°W",
    hectares: 380,
    risk: 86,
    trend: "stable",
    signalCount7d: 4,
    signalCount30d: 14,
    why: "Environmental ambiguity becomes procurement risk when supporting documentation is incomplete.",
    action: "Hold the record in enhanced due diligence pending updated evidence.",
    threat: "Business-process gap attached to forest-risk zone",
    timeLabel: "10h ago",
    source: "ForestGuard fallback demo dataset",
    detectedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    dataLineage: ["Fallback alert fixture", "Documentation-risk demo scenario"],
    protectedAreaOverlap: false,
    landUseContext: "Municipality-level cattle frontier monitoring context.",
    businessImpact:
      "The event shows how ForestGuard turns environmental ambiguity into a business review workflow even before supplier-level truth is available.",
    recommendedActions: [
      "Request refreshed documentation",
      "Hold the zone in enhanced due diligence",
      "Document the risk signal in the sourcing register",
    ],
    evidence: ["Protected-area overlap: no", "Documentation incomplete", "Municipality-level watch zone"],
    nextReviewStep: "Reopen the review when fresh documentation and the next public alert cycle are available.",
  },
  {
    id: "alert-004",
    eventType: "Forest-loss spike",
    severity: "high",
    title: "290 ha slash-and-burn signal in monitored east zone",
    zone: "São Félix do Xingu municipality monitoring zone",
    lat: -6.5,
    lng: -51.3,
    coords: "6.50°S, 51.30°W",
    hectares: 290,
    risk: 81,
    trend: "increasing",
    signalCount7d: 6,
    signalCount30d: 18,
    why: "Repeated disturbance pressure suggests the zone should not be treated as low-risk without more evidence.",
    action: "Flag in the risk register and request a fresh analyst review packet.",
    threat: "Slash-and-burn clearing preceding pasture conversion",
    timeLabel: "14h ago",
    source: "ForestGuard fallback demo dataset",
    detectedAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    dataLineage: ["Fallback alert fixture", "Municipality disturbance demo scenario"],
    protectedAreaOverlap: false,
    landUseContext: "Municipality-level cattle frontier monitoring context.",
    businessImpact:
      "This event demonstrates how repeated public alerts become a business-risk trigger for procurement and sustainability teams.",
    recommendedActions: [
      "Log the event in the risk register",
      "Request additional analyst verification",
      "Track repeat activity across the next 30 days",
    ],
    evidence: ["Protected-area overlap: no", "Increasing trend", "Public alert cadence"],
    nextReviewStep: "Review repeat activity after the next 30-day monitoring window.",
  },
  {
    id: "alert-005",
    eventType: "Forest degradation",
    severity: "medium",
    title: "160 ha selective logging preceding pasture pressure",
    zone: "APA Triunfo do Xingu monitoring zone",
    lat: -6.8,
    lng: -52.6,
    coords: "6.80°S, 52.60°W",
    hectares: 160,
    risk: 64,
    trend: "stable",
    signalCount7d: 3,
    signalCount30d: 9,
    why: "Pre-clearing patterns can escalate to broader conversion, but the current evidence supports monitoring rather than immediate escalation.",
    action: "Add the zone to the 30-day monitoring watchlist.",
    threat: "Selective logging preceding broader land-use conversion",
    timeLabel: "1d ago",
    source: "ForestGuard fallback demo dataset",
    detectedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    dataLineage: ["Fallback alert fixture", "Protected-area monitoring demo scenario"],
    protectedAreaOverlap: true,
    landUseContext: "Protected-area cattle frontier monitoring context.",
    businessImpact:
      "The signal is material enough to watch closely, but it shows how ForestGuard can separate urgent response from enhanced monitoring.",
    recommendedActions: [
      "Keep the event on the watchlist",
      "Track repeat activity for 30 days",
      "Prepare to escalate if the trend turns increasing",
    ],
    evidence: ["Protected-area overlap: yes", "Selective logging pattern", "Watchlist state"],
    nextReviewStep: "Escalate only if the next alert cycle shows an increasing trend or larger affected area.",
  },
];

function enrichAlert(alert) {
  const carbonTracked = alert.eventType === "Forest-loss spike";
  const carbonDensity = carbonTracked
    ? alert.protectedAreaOverlap
      ? forestGuardBusinessContext.carbonMethodology.densityByZone.protectedAreaForest
      : forestGuardBusinessContext.carbonMethodology.densityByZone.degradedFrontier
    : null;
  const estimatedCarbonTonnes = carbonTracked
    ? Math.round(alert.hectares * carbonDensity * 3.67)
    : null;
  const historicalBuyerLinks = findDocumentedSupplyChainLinks({
    protectedAreaOverlap: alert.protectedAreaOverlap,
    municipality: forestGuardBusinessContext.region.name,
  });

  return {
    ...alert,
    type: alert.eventType,
    time: alert.timeLabel,
    signal_count_7d: alert.signalCount7d,
    signal_count_30d: alert.signalCount30d,
    carbonTracked,
    carbonDensity,
    estimatedCarbonTonnes,
    carbonMethodology: forestGuardBusinessContext.carbonMethodology.scopeLabel,
    carbonSource: forestGuardBusinessContext.carbonMethodology.sourceLabel,
    intervention: alert.protectedAreaOverlap
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
        },
    historicalBuyerLinks,
    supplyChainLinkSummary: historicalBuyerLinks.length
      ? `Public reporting documents historical buyer links in this monitoring zone involving ${[...new Set(historicalBuyerLinks.flatMap((entry) => entry.linkedBuyers))].join(", ")}. ForestGuard is surfacing those links as contextual due-diligence evidence, not as a direct ranch match for this alert.`
      : null,
  };
}

export const alerts = fallbackAlertFixtures.map(enrichAlert);

export const hotspots = alerts.map((alert) => ({
  id: alert.id,
  lat: alert.lat,
  lng: alert.lng,
  severity: alert.severity,
  hectares: alert.hectares,
  name: alert.zone,
  risk: alert.risk,
  type: alert.threat,
}));

export function getAlertById(id) {
  return alerts.find((alert) => alert.id === id) || null;
}

export function filterAlerts(severity) {
  if (severity === "all") return alerts;
  return alerts.filter((alert) => alert.severity === severity);
}
