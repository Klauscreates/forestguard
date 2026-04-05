export const challengeCard = {
  eyebrow: "Amazon's Track",
  title: "Sustainability Challenge",
  summary:
    "The climate crisis demands creative, scalable solutions. Build a project that helps individuals, businesses, or communities reduce waste, lower their carbon footprint, make more sustainable purchasing decisions, or measure their environmental impact.",
  criteria:
    "Judging criteria: innovation, technical execution, environmental impact, and feasibility.",
};

export const missionStats = [
  { value: "72 hrs", label: "Build window to demo" },
  { value: "4", label: "Core product surfaces" },
  { value: "1", label: "Primary region for MVP" },
  { value: "3", label: "Decision-maker personas" },
];

export const pillars = [
  {
    title: "Environmental Signal Layer",
    description:
      "Ingest forest-loss events, thermal hotspots, and region metadata into one alert pipeline that feels live from the first demo.",
  },
  {
    title: "Business Risk Translation",
    description:
      "Turn raw satellite change into supplier, commodity, and compliance impact so procurement teams know what changed and why it matters.",
  },
  {
    title: "Action Workflow",
    description:
      "Generate next steps, due-diligence prompts, and escalation paths so the app behaves like an operational system instead of a map screenshot.",
  },
];

export const executionPhases = [
  {
    name: "Phase 1",
    window: "Tonight",
    objective: "Lock the story and data spine",
    tasks: [
      "Finalize the single-region MVP around Sao Felix do Xingu and one forest-linked commodity.",
      "Normalize alert payloads, severity bands, action types, and confidence rules.",
      "Freeze the demo narrative: detect, assess, escalate, report.",
    ],
  },
  {
    name: "Phase 2",
    window: "Tomorrow morning",
    objective: "Ship the operator workflow",
    tasks: [
      "Complete dashboard interactions across map, alert feed, recommendations, and report generation.",
      "Connect the guide to concrete builder modules and owner-ready tasks.",
      "Polish mobile and desktop layouts so the deck and live demo tell the same story.",
    ],
  },
  {
    name: "Phase 3",
    window: "Before Sunday 10:30 AM",
    objective: "Rehearse the demo path",
    tasks: [
      "Validate that every CTA resolves to a working screen with no dead ends.",
      "Create a five-minute walkthrough from challenge slide to command center to compliance report.",
      "Run a final QA pass on copy, responsiveness, and build output.",
    ],
  },
];

export const builders = [
  {
    id: "signal-ingest",
    name: "Signal Ingest Builder",
    owner: "Data + geospatial",
    status: "Ready",
    outcome: "Produce normalized alert objects with severity, hectares, trend, source, and commodity tags.",
    deliverables: [
      "Static MVP adapter for DETER / GLAD / VIIRS-style events",
      "Region metadata and polygon bindings",
      "Alert confidence and freshness scoring",
    ],
  },
  {
    id: "risk-engine",
    name: "Risk Engine Builder",
    owner: "Decision logic",
    status: "In Progress",
    outcome: "Translate environmental signals into zone, supplier, and compliance risk states.",
    deliverables: [
      "Weighted risk formula for severity, proximity, repetition, and commodity relevance",
      "Escalation thresholds for procurement, compliance, and sustainability teams",
      "Trend summaries suitable for dashboards and reports",
    ],
  },
  {
    id: "command-center",
    name: "Command Center Builder",
    owner: "Frontend + UX",
    status: "Ready",
    outcome: "Expose the live story across map, feed, mission controls, and action panel.",
    deliverables: [
      "Challenge landing page and story architecture",
      "Integrated dashboard for alert triage",
      "Working report and guide surfaces for the demo sequence",
    ],
  },
  {
    id: "compliance-copilot",
    name: "Compliance Copilot Builder",
    owner: "AI + reporting",
    status: "Ready",
    outcome: "Generate plain-English reasoning, recommended actions, and a due-diligence packet scaffold.",
    deliverables: [
      "Recommendation templates for each alert class",
      "Report sections with evidence, risks, and next actions",
      "Prompt-ready structure for future Bedrock or Gemini integration",
    ],
  },
];

export const guideSteps = [
  {
    step: "Detect",
    title: "Capture new forest-loss risk",
    detail:
      "Watch a single geography closely enough that new clearing becomes a business signal within hours, not weeks.",
  },
  {
    step: "Diagnose",
    title: "Explain why the event matters",
    detail:
      "Assess location, commodity linkage, trajectory, and compliance exposure so the event is decision-ready.",
  },
  {
    step: "Direct",
    title: "Recommend the next move",
    detail:
      "Tell procurement, sustainability, and compliance what to request, what to verify, and what to escalate.",
  },
  {
    step: "Document",
    title: "Create the proof layer",
    detail:
      "Package the evidence into a report, timeline, and checklist that can support a real review process.",
  },
];

export const demoRoute = [
  "Open the challenge landing page and frame ForestGuard as Amazon-relevant sustainability infrastructure.",
  "Jump to the command center and click through one critical alert on the map.",
  "Show the AI-style recommendation panel and risk score shift for that zone.",
  "Open the guide to explain the operating model behind the prototype.",
  "Finish in Builders to prove the implementation path is already staged for execution.",
];
