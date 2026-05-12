const STORAGE_KEY = "daily-signal-state-v1";

const articleList = document.querySelector("#articleList");
const emptyState = document.querySelector("#emptyState");
const progressText = document.querySelector("#progressText");
const progressBar = document.querySelector("#progressBar");
const unreadCount = document.querySelector("#unreadCount");
const savedCount = document.querySelector("#savedCount");
const updatedAt = document.querySelector("#updatedAt");
const todayDate = document.querySelector("#todayDate");
const themeToggle = document.querySelector("#themeToggle");
const searchInput = document.querySelector("#searchInput");
const topicFilters = document.querySelector("#topicFilters");

let articles = [];
let activeTopic = "all";
let state = loadState();
let currentTheme = localStorage.getItem("daily-signal-theme") || "dark";

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { read: {}, saved: {} };
  } catch {
    return { read: {}, saved: {} };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function articleId(article) {
  return article.id || article.url || article.title;
}

function formatDate(value) {
  if (!value) return "recent";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function matchesFilters(article) {
  const id = articleId(article);
  const query = searchInput.value.trim().toLowerCase();
  const topicMatch =
    activeTopic === "all" ||
    article.topic === activeTopic ||
    (activeTopic === "saved" && state.saved[id]) ||
    (activeTopic === "unread" && !state.read[id]);
  const queryMatch = !query || `${article.title} ${article.source} ${article.description}`.toLowerCase().includes(query);
  return topicMatch && queryMatch;
}

function render() {
  const filtered = articles.filter(matchesFilters);
  articleList.innerHTML = "";

  filtered.forEach((article) => {
    const id = articleId(article);
    const isRead = Boolean(state.read[id]);
    const isSaved = Boolean(state.saved[id]);

    const card = document.createElement("article");
    card.className = `article-card${isRead ? " read" : ""}`;
    card.innerHTML = `
      <input class="read-check" type="checkbox" aria-label="Mark as read" ${isRead ? "checked" : ""} />
      <div>
        <span class="article-topic">${article.topicLabel || article.topic}</span>
        <h3><a href="${article.url}" target="_blank" rel="noopener noreferrer">${article.title}</a></h3>
        <p class="article-meta">${article.source || "Source"} &middot; ${formatDate(article.publishedAt)}</p>
        <p class="article-description">${article.description || "Open the story for the full details."}</p>
      </div>
      <button class="save-button${isSaved ? " saved" : ""}" type="button" aria-label="Save article">${
        isSaved ? "&starf;" : "&star;"
      }</button>
    `;

    card.querySelector(".read-check").addEventListener("change", (event) => {
      state.read[id] = event.target.checked;
      saveState();
      render();
    });

    card.querySelector(".save-button").addEventListener("click", () => {
      state.saved[id] = !state.saved[id];
      saveState();
      render();
    });

    articleList.appendChild(card);
  });

  emptyState.hidden = filtered.length > 0;
  updateSummary();
}

function updateSummary() {
  const readTotal = articles.filter((article) => state.read[articleId(article)]).length;
  const savedTotal = articles.filter((article) => state.saved[articleId(article)]).length;
  const percent = articles.length ? Math.round((readTotal / articles.length) * 100) : 0;

  progressText.textContent = `${readTotal}/${articles.length} read today`;
  progressBar.style.width = `${percent}%`;
  unreadCount.textContent = String(Math.max(articles.length - readTotal, 0));
  savedCount.textContent = String(savedTotal);
}

async function loadArticles() {
  try {
    const response = await fetch("data/news.json", { cache: "no-store" });
    const payload = await response.json();
    articles = payload.articles || [];
    updatedAt.textContent = payload.updatedAt ? formatDate(payload.updatedAt) : "Today";
  } catch {
    articles = [];
    updatedAt.textContent = "Not yet";
  }

  render();
}

topicFilters.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-topic]");
  if (!button) return;

  activeTopic = button.dataset.topic;
  document.querySelectorAll(".filter-button").forEach((item) => item.classList.remove("active"));
  button.classList.add("active");
  render();
});

searchInput.addEventListener("input", render);

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const icon = themeToggle.querySelector(".theme-icon");
  if (icon) {
    icon.textContent = theme === "dark" ? "☾" : "☀";
  }
  themeToggle.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  localStorage.setItem("daily-signal-theme", theme);
}

themeToggle.addEventListener("click", () => {
  currentTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(currentTheme);
});

todayDate.textContent = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
}).format(new Date());

applyTheme(currentTheme);
loadArticles();
