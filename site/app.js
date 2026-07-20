const elements = {
  search: document.querySelector("#search"),
  category: document.querySelector("#category"),
  sort: document.querySelector("#sort"),
  results: document.querySelector("#results"),
  resultCount: document.querySelector("#result-count"),
  platformCount: document.querySelector("#platform-count"),
  stepCount: document.querySelector("#step-count"),
  sourceCount: document.querySelector("#source-count"),
};

let routes = [];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(Number(value) || 0);
}

function populateCategories(rows) {
  const categories = [...new Set(rows.map((row) => row.category).filter(Boolean))].sort();
  for (const category of categories) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    elements.category.append(option);
  }
}

function compareRows(a, b, mode) {
  if (mode === "steps") return a.steps - b.steps || a.name.localeCompare(b.name);
  if (mode === "friction") return a.friction_score - b.friction_score || a.steps - b.steps;
  if (mode === "minutes") return a.est_minutes - b.est_minutes || a.steps - b.steps;
  return a.name.localeCompare(b.name);
}

function render() {
  const query = elements.search.value.trim().toLocaleLowerCase();
  const category = elements.category.value;
  const sort = elements.sort.value;

  const filtered = routes
    .filter((row) => !category || row.category === category)
    .filter((row) => {
      if (!query) return true;
      const haystack = [row.name, row.category, row.outcome, row.first_success_type]
        .join(" ")
        .toLocaleLowerCase();
      return haystack.includes(query);
    })
    .sort((a, b) => compareRows(a, b, sort));

  elements.resultCount.textContent = `${formatNumber(filtered.length)} of ${formatNumber(routes.length)} platforms`;

  if (filtered.length === 0) {
    elements.results.innerHTML = '<p class="state-message">No documented route matches those filters. Clear the search or choose another category.</p>';
    elements.results.setAttribute("aria-busy", "false");
    return;
  }

  const items = filtered.map((row) => `
    <li class="result">
      <details>
        <summary>
          <span class="result-title">${escapeHtml(row.name)}</span>
          <span class="result-outcome">${escapeHtml(row.outcome)}</span>
          <span class="result-metrics" aria-label="${escapeHtml(row.steps)} steps, friction score ${escapeHtml(row.friction_score)}">
            <span class="metric">${escapeHtml(row.steps)} steps</span>
            <span class="metric">friction ${escapeHtml(row.friction_score)}</span>
          </span>
        </summary>
        <div class="result-body">
          <dl>
            <dt>Category</dt>
            <dd>${escapeHtml(row.category)}</dd>
          </dl>
          <dl>
            <dt>Selected route</dt>
            <dd>${escapeHtml(row.route)}</dd>
          </dl>
          <dl>
            <dt>Heuristic estimate</dt>
            <dd>${escapeHtml(row.est_minutes)} minutes, not observed time</dd>
          </dl>
          <a class="record-link" href="data/records/${encodeURIComponent(row.slug)}.json">Open the evidence record (JSON)</a>
        </div>
      </details>
    </li>
  `).join("");

  elements.results.innerHTML = `<ol class="results-list">${items}</ol>`;
  elements.results.setAttribute("aria-busy", "false");
}

async function load() {
  try {
    const [atlasResponse, coverageResponse] = await Promise.all([
      fetch("data/easiest-path.json"),
      fetch("data/coverage-summary.json"),
    ]);

    if (!atlasResponse.ok || !coverageResponse.ok) {
      throw new Error("The published research files could not be loaded.");
    }

    const [atlas, coverage] = await Promise.all([
      atlasResponse.json(),
      coverageResponse.json(),
    ]);

    routes = atlas.rows;
    elements.platformCount.textContent = formatNumber(coverage.platforms);
    elements.stepCount.textContent = formatNumber(coverage.steps);
    elements.sourceCount.textContent = formatNumber(coverage.sources);
    populateCategories(routes);
    render();
  } catch (error) {
    elements.resultCount.textContent = "Research unavailable";
    elements.results.setAttribute("aria-busy", "false");
    elements.results.innerHTML = `<p class="state-message"><strong>The atlas could not load.</strong><br>${escapeHtml(error.message)} Refresh the page to retry.</p>`;
  }
}

elements.search.addEventListener("input", render);
elements.category.addEventListener("change", render);
elements.sort.addEventListener("change", render);

load();
