const GOOGLE_NEWS_RSS_BASE = "https://news.google.com/rss/search";

const SIGNAL_FEEDS = [
  {
    id: "brazil-deforestation-enforcement",
    category: "enforcement",
    query: 'Brazil deforestation enforcement OR IBAMA OR embargo',
  },
  {
    id: "brazil-deforestation-regulation",
    category: "regulatory",
    query: 'Brazil deforestation regulation OR bank credit OR environmental compliance',
  },
  {
    id: "amazon-cattle-traceability",
    category: "supply_chain",
    query: 'Amazon cattle traceability deforestation meatpacker',
  },
];

function stripCdata(value = "") {
  return value.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
}

function decodeXml(value = "") {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXml(stripCdata(match[1])) : "";
}

function extractSource(block) {
  const match = block.match(/<source(?:\s+url="([^"]*)")?>([\s\S]*?)<\/source>/i);
  if (!match) return { name: "Unknown source", url: null };
  return {
    name: decodeXml(stripCdata(match[2])) || "Unknown source",
    url: match[1] || null,
  };
}

function parseRssItems(xml = "") {
  const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
  return itemMatches.map((block) => {
    const source = extractSource(block);
    return {
      title: extractTag(block, "title"),
      link: extractTag(block, "link"),
      publishedAt: extractTag(block, "pubDate"),
      description: extractTag(block, "description"),
      sourceName: source.name,
      sourceUrl: source.url,
    };
  });
}

function buildFeedUrl(query) {
  const params = new URLSearchParams({
    q: query,
    hl: "en-US",
    gl: "US",
    ceid: "US:en",
  });
  return `${GOOGLE_NEWS_RSS_BASE}?${params.toString()}`;
}

function scoreSignal(item) {
  const haystack = `${item.title} ${item.description}`.toLowerCase();
  let score = 0;
  if (haystack.includes("deforestation")) score += 3;
  if (haystack.includes("ibama")) score += 3;
  if (haystack.includes("credit")) score += 2;
  if (haystack.includes("amazon")) score += 2;
  if (haystack.includes("cattle") || haystack.includes("meat")) score += 2;
  if (haystack.includes("compliance") || haystack.includes("regulation")) score += 2;
  return score;
}

export async function fetchWeakSignals() {
  const fetchedAt = new Date().toISOString();
  const settled = await Promise.allSettled(
    SIGNAL_FEEDS.map(async (feed) => {
      const response = await fetch(buildFeedUrl(feed.query), {
        headers: { Accept: "application/rss+xml, application/xml, text/xml" },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const xml = await response.text();
      return parseRssItems(xml)
        .filter((item) => item.title && item.link)
        .map((item) => ({
          ...item,
          category: feed.category,
          feedId: feed.id,
          score: scoreSignal(item),
        }));
    })
  );

  const deduped = [];
  const seen = new Set();
  for (const signal of settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    .sort((left, right) => {
      const scoreDiff = (right.score || 0) - (left.score || 0);
      if (scoreDiff !== 0) return scoreDiff;
      return new Date(right.publishedAt || 0).getTime() - new Date(left.publishedAt || 0).getTime();
    })) {
    const key = signal.link || signal.title;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(signal);
    if (deduped.length >= 8) break;
  }

  const failures = settled
    .map((result, index) => ({ result, feed: SIGNAL_FEEDS[index] }))
    .filter(({ result }) => result.status === "rejected")
    .map(({ result, feed }) => ({
      feedId: feed.id,
      category: feed.category,
      error: result.reason?.message || "Signal fetch failed",
    }));

  return { fetchedAt, signals: deduped, failures };
}
