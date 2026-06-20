const express = require("express");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5500;
const supabaseUrl = (process.env.SUPABASE_URL || "").trim();
const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || "").trim();

function hasSupabaseConfig() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

function createSupabaseAnonClient() {
  if (!hasSupabaseConfig()) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

function createSupabaseAuthedClient(accessToken) {
  if (!hasSupabaseConfig() || !accessToken) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

const SUPPORTED_FORMATS = new Set(["print", "video", "mix"]);
const STATE_CODE_BY_NAME = {
  Alabama: "AL",
  Alaska: "AK",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  Florida: "FL",
  Georgia: "GA",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Pennsylvania: "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY"
};
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

function getArticleFormatLabel(article) {
  return isVideoArticle(article) ? "VIDEO" : "PRINT";
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isStateRelevantArticle(article, state) {
  const normalizedState = state.trim();
  if (!normalizedState) return false;

  const stateCode = STATE_CODE_BY_NAME[normalizedState] || "";
  const textBlob = [
    article && article.title ? article.title : "",
    article && article.description ? article.description : "",
    article && article.content ? article.content : "",
    article && article.url ? article.url : "",
    article && article.source && article.source.name ? article.source.name : ""
  ].join(" ");

  const fullStateRegex = new RegExp(`\\b${escapeRegExp(normalizedState)}\\b`, "i");
  if (fullStateRegex.test(textBlob)) {
    return true;
  }

  if (!stateCode) {
    return false;
  }

  const codeRegex = new RegExp(`\\b${escapeRegExp(stateCode)}\\b`, "i");
  return codeRegex.test(textBlob);
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
  const quotedState = `"${state}"`;

  if (format === "video") {
    return `${quotedState} (video OR watch OR livestream OR interview)`;
  }

  if (format === "print") {
    return `${quotedState} news`;
  }

  return `${quotedState} (news OR video)`;
}

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get("/api/config", (_req, res) => {
  return res.status(200).json({
    supabaseUrl,
    supabaseAnonKey
  });
});

app.post("/api/signup", async (req, res) => {
  if (!hasSupabaseConfig()) {
    return res.status(500).json({
      status: "error",
      message: "Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env."
    });
  }

  const supabaseClient = createSupabaseAnonClient();

  const firstName = (req.body && req.body.firstName ? req.body.firstName : "").trim();
  const lastName = (req.body && req.body.lastName ? req.body.lastName : "").trim();
  const email = (req.body && req.body.email ? req.body.email : "").trim().toLowerCase();
  const password = (req.body && req.body.password ? req.body.password : "").trim();
  const state = (req.body && req.body.state ? req.body.state : "").trim();

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({
      status: "error",
      message: "Missing required fields: firstName, lastName, email, password."
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      status: "error",
      message: "Password must be at least 8 characters long."
    });
  }

  const signup = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        state
      }
    }
  });

  if (signup.error) {
    return res.status(400).json({
      status: "error",
      message: signup.error.message
    });
  }

  const user = signup.data && signup.data.user ? signup.data.user : null;
  const accessToken = signup.data && signup.data.session ? signup.data.session.access_token : null;
  if (user && user.id && accessToken) {
    const supabaseAuthedClient = createSupabaseAuthedClient(accessToken);
    if (supabaseAuthedClient) {
      const profileInsert = await supabaseAuthedClient
        .from("profiles")
        .upsert(
          {
            id: user.id,
            email,
            first_name: firstName,
            last_name: lastName,
            state
          },
          { onConflict: "id" }
        );

      if (profileInsert.error) {
        console.warn("Could not upsert profiles row:", profileInsert.error.message);
      }
    }
  }

  return res.status(200).json({
    status: "ok",
    message: signup.data && signup.data.session
      ? "Signup complete."
      : "Signup submitted. Check your email to confirm your account.",
    hasSession: Boolean(signup.data && signup.data.session),
    user: user
      ? {
          id: user.id,
          email: user.email || email,
          firstName,
          lastName,
          state
        }
      : null
  });
});

app.post("/api/login", async (req, res) => {
  if (!hasSupabaseConfig()) {
    return res.status(500).json({
      status: "error",
      message: "Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env."
    });
  }

  const supabaseClient = createSupabaseAnonClient();
  const email = (req.body && req.body.email ? req.body.email : "").trim().toLowerCase();
  const password = (req.body && req.body.password ? req.body.password : "").trim();

  if (!email || !password) {
    return res.status(400).json({
      status: "error",
      message: "Missing required fields: email, password."
    });
  }

  const login = await supabaseClient.auth.signInWithPassword({ email, password });
  if (login.error) {
    return res.status(401).json({
      status: "error",
      message: login.error.message
    });
  }

  const user = login.data && login.data.user ? login.data.user : null;
  if (!user) {
    return res.status(500).json({
      status: "error",
      message: "Could not load user profile after sign in."
    });
  }

  const userMeta = user.user_metadata || {};
  return res.status(200).json({
    status: "ok",
    message: "Signed in successfully.",
    user: {
      id: user.id,
      email: user.email || email,
      firstName: userMeta.first_name || "",
      lastName: userMeta.last_name || "",
      state: userMeta.state || ""
    }
  });
});

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
    const stateMatchedArticles = articles.filter((article) => isStateRelevantArticle(article, state));
    const filteredArticles = filterArticlesByFormat(stateMatchedArticles, format)
      .slice(0, 12)
      .map((article) => ({
        ...article,
        mediaFormat: getArticleFormatLabel(article),
        stateMatch: true
      }));
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
