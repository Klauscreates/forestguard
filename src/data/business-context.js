export const forestGuardBusinessContext = {
  commodity: "beef",
  region: {
    name: "São Félix do Xingu",
    state: "Pará",
    country: "Brazil",
    protectedArea: "APA Triunfo do Xingu",
  },
  problemStatement:
    "Companies can miss early forest-loss risk in sourcing regions because the data is technical, fragmented, and disconnected from day-to-day procurement workflows.",
  solutionStatement:
    "ForestGuard converts public disturbance signals into decision-ready sourcing intelligence for procurement, compliance, and sustainability teams.",
  amazonRelevance: [
    "Amazon has public forest-related commitments across forest-linked commodities in its private brands supply chain, including beef and paper-linked materials.",
    "Private brands beef is expected to come from low-deforestation-risk regions or from supply that can be fully traced and documented.",
    "A municipality-level cattle monitoring view is a credible first operational scope before supplier-level verification is available.",
  ],
  businessSensitivity: {
    beef: 92,
    beefProtectedArea: 100,
  },
  carbonMethodology: {
    tonnesPerHectareForestLoss: 216.696,
    densityByZone: {
      protectedAreaForest: 165,
      degradedFrontier: 70,
    },
    sourceLabel:
      "Environmental Pollution (2019) deforestation-fire emissions study for the Brazilian Amazon",
    scopeLabel:
      "Zone-based carbon-at-risk estimate applied only to forest-loss alerts with affected-hectare values. Protected-area forest alerts use a higher density than degraded frontier alerts.",
  },
  interventionPolicy: {
    protectedArea:
      "If the alert is within APA Triunfo do Xingu, the recommended intervention is Immediate IBAMA Field Inspection and Meatpacker Blockage.",
    municipality:
      "If the alert is outside the APA but still within the monitored municipality, the recommended intervention is enhanced procurement review and traceability escalation.",
  },
  landUseContext:
    "São Félix do Xingu is a cattle-linked frontier municipality where forest-to-pasture conversion risk matters to sourcing confidence, compliance posture, and reputational exposure.",
  nextReviewDefault:
    "Review fresh public alerts, request updated traceability evidence, and reassess the monitored zone inside the next procurement cycle.",
};
