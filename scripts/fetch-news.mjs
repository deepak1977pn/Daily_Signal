import { writeFile, mkdir } from "node:fs/promises";

const SOURCES = [
  {
    topic: "ai",
    topicLabel: "AI",
    source: "Google News",
    url: "https://news.google.com/rss/search?q=artificial%20intelligence%20OR%20machine%20learning%20when:1d&hl=en-IN&gl=IN&ceid=IN:en",
  },
  {
    topic: "tech",
    topicLabel: "Tech",
    source: "Hacker News",
    url: "https://hnrss.org/frontpage",
  },
  {
    topic: "current-affairs",
    topicLabel: "Current Affairs",
    source: "Google News",
    url: "https://news.google.com/rss/search?q=current%20affairs%20India%20world%20when:1d&hl=en-IN&gl=IN&ceid=IN:en",
  },
];

const MAX_PER_TOPIC = 8;

function decodeEntities(text = "") {
  return text
    .replaceAll("<![CDATA[", "")
    .replaceAll("]]>", "")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replace(/<[^>]*>/g, "")
    .trim();
}

function getTag(item, tag) {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return decodeEntities(match?.[1] || "");
}

function parseRss(xml, sourceConfig) {
  const items = [...xml.matchAll(/<item[\s\S]*?<\/item>/gi)].map((match) => match[0]);

  return items.slice(0, MAX_PER_TOPIC).map((item) => {
    const title = getTag(item, "title");
    const url = getTag(item, "link");
    const publishedAt = getTag(item, "pubDate");
    const description = getTag(item, "description");

    return {
      id: `${sourceConfig.topic}-${url || title}`,
      title,
      description,
      url,
      source: sourceConfig.source,
      topic: sourceConfig.topic,
      topicLabel: sourceConfig.topicLabel,
      publishedAt: publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString(),
    };
  });
}

async function fetchSource(sourceConfig) {
  const response = await fetch(sourceConfig.url, {
    headers: {
      "user-agent": "DailySignalPersonalDashboard/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`${sourceConfig.source} returned ${response.status}`);
  }

  const xml = await response.text();
  return parseRss(xml, sourceConfig);
}

const results = await Promise.allSettled(SOURCES.map(fetchSource));
const articles = results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));

if (articles.length === 0) {
  throw new Error("No articles fetched. Check RSS sources.");
}

await mkdir("data", { recursive: true });
await writeFile(
  "data/news.json",
  `${JSON.stringify(
    {
      updatedAt: new Date().toISOString(),
      articles,
    },
    null,
    2,
  )}\n`,
);

console.log(`Saved ${articles.length} articles to data/news.json`);
