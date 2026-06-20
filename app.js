const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
  "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
  "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
  "New Hampshire", "New Jersey", "New Mexico", "New York",
  "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
  "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
  "West Virginia", "Wisconsin", "Wyoming"
];

const STATE_ABBREVIATIONS = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming"
};

const stateInput = document.getElementById("stateInput");
const stateSuggestions = document.getElementById("stateSuggestions");
const fetchBtn = document.getElementById("fetchBtn");
const feedback = document.getElementById("feedback");
const resultsTitle = document.getElementById("resultsTitle");
const results = document.getElementById("results");
const apiKeyInput = document.getElementById("apiKey");
const toggleApiKeyBtn = document.getElementById("toggleApiKey");

function ensureStateInputIsEditable({ focus = false, selectAll = false } = {}) {
  if (stateInput.type !== "text") {
    stateInput.type = "text";
  }

  stateInput.readOnly = false;
  stateInput.disabled = false;

  if (focus || selectAll) {
    stateInput.focus();
  }

  if (selectAll) {
    stateInput.select();
  }
}

function filterStates(query) {
  if (!query) return [];
  const normalized = query.trim();
  const q = normalized.toLowerCase();
  if (!q) return [];

  const matches = [];
  const seen = new Set();
  const abbreviation = normalized.toUpperCase();
  if (abbreviation.length === 2 && STATE_ABBREVIATIONS[abbreviation]) {
    const abbreviationMatch = STATE_ABBREVIATIONS[abbreviation];
    matches.push(abbreviationMatch);
    seen.add(abbreviationMatch);
  }

  US_STATES.forEach((state) => {
    if (state.toLowerCase().includes(q) && !seen.has(state)) {
      matches.push(state);
      seen.add(state);
    }
  });

  return matches;
}

function resolveState(value) {
  const normalized = value.trim();
  if (!normalized) return "";

  const abbreviation = normalized.toUpperCase();
  if (abbreviation.length === 2 && STATE_ABBREVIATIONS[abbreviation]) {
    return STATE_ABBREVIATIONS[abbreviation];
  }

  const stateName = normalized.toLowerCase();
  const match = US_STATES.find((state) => state.toLowerCase() === stateName);
  return match || "";
}

function renderSuggestions(matches) {
  stateSuggestions.innerHTML = "";
  matches.forEach((state) => {
    const option = document.createElement("option");
    option.value = state;
    stateSuggestions.appendChild(option);
  });
}

function syncFetchButtonState() {
  const selectedState = resolveState(stateInput.value);
  const apiKey = apiKeyInput.value.trim();
  fetchBtn.disabled = !selectedState || !apiKey;
}

function renderHeadlines(state, articles) {
  resultsTitle.textContent = `Top Headlines for ${state}`;

  if (!articles.length) {
    results.innerHTML = `<p>No headlines found for <strong>${state}</strong>.</p>`;
    return;
  }

  const listItems = articles
    .slice(0, 8)
    .map((article) => {
      const title = article.title || "No title";
      const url = article.url || "#";
      const source = article.source && article.source.name ? article.source.name : "Unknown";
      return `
        <li>
          <a href="${url}" target="_blank" rel="noreferrer">${title}</a>
          <div class="article-source">Source: ${source}</div>
        </li>
      `;
    })
    .join("");

  results.innerHTML = `<ol>${listItems}</ol>`;
}

async function fetchNews(state, apiKey) {
  const params = new URLSearchParams({ state });
  const response = await fetch(`/api/news?${params.toString()}`, {
    headers: {
      "x-api-key": apiKey
    }
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const apiMessage = payload && payload.message ? payload.message : null;
    throw new Error(apiMessage || `HTTP ${response.status}`);
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("Unexpected response format from the news provider.");
  }

  const data = payload;

  if (data.status !== "ok") {
    throw new Error(data.message || "Unknown API error");
  }

  return data.articles || [];
}

stateInput.addEventListener("input", () => {
  const value = stateInput.value.trim();
  results.innerHTML = "";
  resultsTitle.textContent = "Results";

  if (value.length < 2) {
    feedback.textContent = "Type at least 2 characters or a 2-letter state abbreviation.";
    renderSuggestions([]);
    syncFetchButtonState();
    return;
  }

  const matches = filterStates(value);
  renderSuggestions(matches);

  if (!matches.length) {
    feedback.textContent = "No matching states found.";
    syncFetchButtonState();
    return;
  }

  const selectedState = resolveState(value);
  if (selectedState) {
    feedback.textContent = `Ready to fetch headlines for ${selectedState}.`;
  } else {
    feedback.textContent = `Found ${matches.length} matching state(s). Keep typing or pick a suggestion.`;
  }

  syncFetchButtonState();
});

stateInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;

  const selectedState = resolveState(stateInput.value);
  if (!selectedState) return;

  event.preventDefault();
  stateInput.value = selectedState;
  feedback.textContent = `Selected ${selectedState}.`;
  ensureStateInputIsEditable({ focus: true });
  syncFetchButtonState();
});

apiKeyInput.addEventListener("input", syncFetchButtonState);

toggleApiKeyBtn.addEventListener("click", () => {
  const shouldShow = apiKeyInput.type === "password";
  apiKeyInput.type = shouldShow ? "text" : "password";
  toggleApiKeyBtn.textContent = shouldShow ? "Hide" : "Show";
  toggleApiKeyBtn.setAttribute("aria-pressed", String(shouldShow));
});

fetchBtn.addEventListener("click", async () => {
  const selectedState = resolveState(stateInput.value);
  const apiKey = apiKeyInput.value.trim();

  if (!selectedState) {
    feedback.textContent = "Please choose a valid U.S. state.";
    return;
  }

  if (!apiKey) {
    feedback.textContent = "Please enter your NewsAPI key.";
    return;
  }

  feedback.textContent = `Fetching headlines for ${selectedState}...`;
  fetchBtn.disabled = true;

  try {
    const articles = await fetchNews(selectedState, apiKey);
    renderHeadlines(selectedState, articles);
    feedback.textContent = "Done.";
  } catch (error) {
    results.innerHTML = "";
    resultsTitle.textContent = "Results";
    feedback.textContent = `Error fetching news: ${error.message}`;
  } finally {
    // Keep state entry ready so the user can immediately search a different state.
    ensureStateInputIsEditable({ selectAll: true });
    syncFetchButtonState();
  }
});
