export const forestPolicyCorpus = [
  {
    id: "amazon-net-zero-2040",
    title: "Amazon net-zero commitment",
    summary:
      "Amazon says it aims to reach net-zero carbon emissions across its operations by 2040 through The Climate Pledge.",
    sourceLabel: "Amazon Sustainability · Climate solutions",
    sourceUrl: "https://sustainability.aboutamazon.com/environment/the-climate-pledge-fund",
    tags: ["climate pledge", "net zero", "2040", "emissions", "operations", "amazon goal"],
  },
  {
    id: "amazon-renewable-electricity-2024",
    title: "Amazon renewable electricity milestone",
    summary:
      "Amazon says 100% of the electricity it consumed was matched with renewable energy sources in 2024, for the second consecutive year.",
    sourceLabel: "Amazon Sustainability · Climate solutions",
    sourceUrl: "https://sustainability.aboutamazon.com/environment/the-climate-pledge-fund",
    tags: ["renewable", "electricity", "2024", "energy", "scope 2", "renewable energy"],
  },
  {
    id: "amazon-forest-linked-commodities",
    title: "Amazon private-brand forest-linked commodities commitments",
    summary:
      "Amazon says it has deforestation-related commitments across palm oil, paper and paper packaging, beef, soy, cocoa, coffee, and tea in its food and consumables private-brand supply chains.",
    sourceLabel: "Amazon Sustainability · Natural resources",
    sourceUrl: "https://sustainability.aboutamazon.com/natural-resources",
    tags: ["forest", "deforestation", "beef", "soy", "palm oil", "paper", "private brands", "commodities"],
  },
  {
    id: "amazon-paper-packaging-commitment",
    title: "Amazon paper sourcing commitment",
    summary:
      "Amazon says its private-brand paper products in North America and Europe are either recycled or certified to FSC, SFI, or PEFC standards.",
    sourceLabel: "Amazon Sustainability · Natural resources",
    sourceUrl: "https://sustainability.aboutamazon.com/natural-resources",
    tags: ["paper", "packaging", "fsc", "sfi", "pefc", "certified"],
  },
  {
    id: "amazon-soy-europe-cutoff",
    title: "Amazon soy deforestation-free goal in Europe",
    summary:
      "Amazon says the soy in its Grocery and Consumable Private Brands supply chains in Europe should be deforestation free by the end of 2025 with a 2020 cut-off date.",
    sourceLabel: "Amazon Sustainability · Natural resources",
    sourceUrl: "https://sustainability.aboutamazon.com/natural-resources",
    tags: ["soy", "europe", "2025", "cut-off", "deforestation free"],
  },
  {
    id: "amazon-climate-pledge-fund",
    title: "Amazon Climate Pledge Fund",
    summary:
      "Amazon says The Climate Pledge Fund invests in companies developing products and services that support decarbonization and climate innovation.",
    sourceLabel: "Amazon Sustainability · Climate solutions",
    sourceUrl: "https://sustainability.aboutamazon.com/environment/the-climate-pledge-fund",
    tags: ["climate pledge fund", "fund", "decarbonization", "climate innovation", "investment"],
  },
  {
    id: "amazon-natural-resources-governance",
    title: "Amazon natural resources governance",
    summary:
      "Amazon says it uses certification, recycled content, and commodity-specific deforestation commitments to reduce environmental harm in private-brand supply chains.",
    sourceLabel: "Amazon Sustainability · Natural resources",
    sourceUrl: "https://sustainability.aboutamazon.com/natural-resources",
    tags: ["natural resources", "governance", "certification", "recycled", "private brands", "supply chain"],
  },
];

function scoreDocument(document, normalizedQuestion) {
  let score = 0;

  const title = document.title.toLowerCase();
  const summary = document.summary.toLowerCase();

  for (const tag of document.tags) {
    if (normalizedQuestion.includes(tag)) {
      score += tag.split(" ").length > 1 ? 3 : 2;
    }
  }

  for (const token of normalizedQuestion.split(/\s+/).filter(Boolean)) {
    if (token.length < 4) continue;
    if (title.includes(token)) score += 1;
    if (summary.includes(token)) score += 1;
  }

  if (normalizedQuestion.includes("amazon")) score += 1;
  return score;
}

export function retrievePolicyContext(question, limit = 3) {
  const normalizedQuestion = String(question || "").toLowerCase();

  return forestPolicyCorpus
    .map((document) => ({
      ...document,
      score: scoreDocument(document, normalizedQuestion),
    }))
    .filter((document) => document.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}
