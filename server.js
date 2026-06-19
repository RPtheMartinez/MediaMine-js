const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5500;

app.use(express.static(path.join(__dirname)));

app.get("/api/news", async (req, res) => {
  const state = (req.query.state || "").trim();
  const apiKey = (req.get("x-api-key") || "").trim();

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

  const endpoint = "https://newsapi.org/v2/everything";
  const params = new URLSearchParams({
    q: state,
    language: "en",
    sortBy: "publishedAt",
    pageSize: "5",
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

    return res.status(upstream.status).json(data);
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
