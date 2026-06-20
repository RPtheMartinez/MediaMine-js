const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5500;

const SUPPORTED_FORMATS = new Set(["print", "video", "mix"]);
const VIDEO_HOSTS = [
  "youtube.com",
  "youtu.be",
  "vimeo.com",
  "dailymotion.com",
  "tiktok.com",
  "twitch.tv",
  "rumble.com",
  "jwplayer.com"
];
const VIDEO_KEYWORD_PATTERN = /\b(video|watch|livestream|live stream|clip|footage|interview)\b/i;

function isVideoArticle(article) {
  const url = article && article.url ? article.url : "";
  const title = article && article.title ? article.title : "";
  const description = article && article.description ? article.description : "";

  let hostname = "";
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    hostname = "";
  }

  const looksLikeVideoHost = VIDEO_HOSTS.some((host) => hostname.includes(host));
  const looksLikeVideoText = VIDEO_KEYWORD_PATTERN.test(`${title} ${description}`);
  return looksLikeVideoHost || looksLikeVideoText;
}

function interleaveArticles(first, second, limit) {
  const merged = [];
  let i = 0;
  let j = 0;

  while (merged.length < limit && (i < first.length || j < second.length)) {
    if (i < first.length) {
      merged.push(first[i]);
      i += 1;
      if (merged.length >= limit) break;
    }

    if (j < second.length) {
      merged.push(second[j]);
      j += 1;
    }
  }

  return merged;
}

function filterArticlesByFormat(articles, format) {
  const normalized = SUPPORTED_FORMATS.has(format) ? format : "mix";
  const videoArticles = articles.filter(isVideoArticle);
  const printArticles = articles.filter((article) => !isVideoArticle(article));

  if (normalized === "video") {
    return videoArticles;
  }

  if (normalized === "print") {
    return printArticles;
  }

  return interleaveArticles(printArticles, videoArticles, 16);
}

function buildQueryForFormat(state, format) {
  if (format === "video") {
    return `${state} (video OR watch OR livestream OR interview)`;
  }

  if (format === "print") {
    return `${state} news`;
  }

  return `${state} (news OR video)`;
}

app.use(express.static(path.join(__dirname)));

app.get("/api/news", async (req, res) => {
  const state = (req.query.state || "").trim();
  const apiKey = (req.get("x-api-key") || "").trim();
  const format = (req.query.format || "mix").toString().trim().toLowerCase();

  if (!state) {
    return res.status(400).json({
      status: "error",
      message: "Missing required query parameter: state"
    });
  }

  if (!apiKey) {
    return res.status(400).json({
      status: "error",
      message: "Missing NewsAPI key. Enter your key in the app and try again."
    });
  }

  if (!SUPPORTED_FORMATS.has(format)) {
    return res.status(400).json({
      status: "error",
      message: "Unsupported format. Use print, video, or mix."
    });
  }

  const endpoint = "https://newsapi.org/v2/everything";
  const params = new URLSearchParams({
    q: buildQueryForFormat(state, format),
    language: "en",
    sortBy: "publishedAt",
    pageSize: "30",
    apiKey
  });

  try {
    const upstream = await fetch(`${endpoint}?${params.toString()}`);
    const text = await upstream.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = {
        status: "error",
        message: `Unexpected response from news provider (HTTP ${upstream.status}).`
      };
    }

    if (!upstream.ok) {
      return res.status(upstream.status).json(data);
    }

    const articles = Array.isArray(data.articles) ? data.articles : [];
    const filteredArticles = filterArticlesByFormat(articles, format).slice(0, 12);
    return res.status(200).json({
      ...data,
      articles: filteredArticles,
      selectedFormat: format
    });
  } catch {
    return res.status(502).json({
      status: "error",
      message: "Could not reach the news provider. Check your network and try again."
    });
  }
});

app.listen(PORT, () => {
  console.log(`MediaMine running at http://localhost:${PORT}`);
});
