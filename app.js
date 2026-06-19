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

const stateInput = document.getElementById("stateInput");
const stateSelect = document.getElementById("stateSelect");
const stateSelectLabel = document.getElementById("stateSelectLabel");
const fetchBtn = document.getElementById("fetchBtn");
const feedback = document.getElementById("feedback");
const resultsTitle = document.getElementById("resultsTitle");
const results = document.getElementById("results");
const apiKeyInput = document.getElementById("apiKey");

function filterStates(query) {
  if (!query || query.length < 3) return [];
  const q = query.toLowerCase();
  return US_STATES.filter((state) => state.toLowerCase().includes(q));
}

function clearSelect() {
  stateSelect.innerHTML = "";
  stateSelect.classList.add("hidden");
  stateSelectLabel.classList.add("hidden");
  fetchBtn.disabled = true;
}

function renderSelect(matches) {
  stateSelect.innerHTML = "";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select a state...";
  stateSelect.appendChild(defaultOption);

  matches.forEach((state) => {
    const option = document.createElement("option");
    option.value = state;
    option.textContent = state;
    stateSelect.appendChild(option);
  });

  stateSelect.classList.remove("hidden");
  stateSelectLabel.classList.remove("hidden");
}

function renderHeadlines(state, articles) {
  resultsTitle.textContent = `Top Headlines for ${state}`;

  if (!articles.length) {
    results.innerHTML = `<p>No headlines found for <strong>${state}</strong>.</p>`;
    return;
  }

  const listItems = articles
    .slice(0, 5)
    .map((article) => {
      const title = article.title || "No title";
      const url = article.url || "#";
      return `<li><a href="${url}" target="_blank" rel="noreferrer">${title}</a></li>`;
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

  if (value.length < 3) {
    feedback.textContent = "Type at least 3 characters.";
    clearSelect();
    return;
  }

  const matches = filterStates(value);

  if (!matches.length) {
    feedback.textContent = "No matching states found.";
    clearSelect();
    return;
  }

  feedback.textContent = `Found ${matches.length} matching state(s).`;
  renderSelect(matches);
});

stateSelect.addEventListener("change", () => {
  fetchBtn.disabled = !stateSelect.value;
});

fetchBtn.addEventListener("click", async () => {
  const selectedState = stateSelect.value;
  const apiKey = apiKeyInput.value.trim();

  if (!selectedState) {
    feedback.textContent = "Please select a state first.";
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
    fetchBtn.disabled = false;
  }
});
