const el = {
  form: document.querySelector("#search-form"),
  input: document.querySelector("#search"),
  suggestions: document.querySelector("#suggestions"),
  platformCount: document.querySelector("#platform-count"),
  result: document.querySelector("#result"),
};

let currentSuggestions = [];

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function num(value) {
  return new Intl.NumberFormat("en-US").format(Number(value) || 0);
}

async function api(path) {
  const res = await fetch(path);
  const body = await res.json().catch(() => ({ error: { message: "Bad response" } }));
  if (!res.ok || body.error) {
    const message = body.error ? body.error.message : `Request failed (${res.status})`;
    const err = new Error(message);
    err.code = body.error && body.error.code;
    err.status = res.status;
    throw err;
  }
  return body;
}

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/* ---------- Suggestions ---------- */

function hideSuggestions() {
  el.suggestions.hidden = true;
  el.input.setAttribute("aria-expanded", "false");
}

function renderSuggestions(rows) {
  currentSuggestions = rows;
  if (rows.length === 0) {
    hideSuggestions();
    return;
  }
  el.suggestions.innerHTML = rows
    .slice(0, 8)
    .map(
      (r, i) => `
      <li class="suggestion" role="option" id="sugg-${i}" data-slug="${esc(r.slug)}" aria-selected="false">
        <span class="s-name">${esc(r.name)}</span>
        <span class="s-cat">${esc(r.category)}</span>
      </li>`,
    )
    .join("");
  el.suggestions.hidden = false;
  el.input.setAttribute("aria-expanded", "true");
}

const runSearch = debounce(async (q) => {
  if (!q) {
    hideSuggestions();
    return;
  }
  try {
    const { data } = await api(`/api/search?q=${encodeURIComponent(q)}`);
    renderSuggestions(data);
  } catch {
    hideSuggestions();
  }
}, 160);

/* ---------- Rendering one platform's documented route ---------- */

// A short, honest "how to read this" strip shown with every result. It frames
// the content as documented steps, not a measurement, score, or ranking.
function readStrip() {
  return `
    <p class="read-strip">
      <strong>How to read this:</strong> these are the steps the platform's official docs lay out
      to a first success, extracted from those docs. They describe the documented route, not how easy,
      fast, or good the product is, and this is not a ranking.
    </p>`;
}

function stepItem(s) {
  const meta = [s.phase, s.actor, s.interface]
    .filter(Boolean)
    .map((x) => `<span class="step-tag">${esc(x)}</span>`)
    .join("");
  const details = s.details && s.details.length
    ? `<ul class="step-details">${s.details.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>`
    : "";
  const signal = s.successSignal
    ? `<p class="step-signal"><strong>Success signal:</strong> ${esc(s.successSignal)}</p>`
    : "";
  const optional = s.required ? "" : '<span class="step-optional">optional</span>';
  return `
    <li class="step">
      <div class="step-head"><span class="step-num">${num(s.stepNumber)}</span>${meta}${optional}</div>
      <p class="step-action">${esc(s.action)}</p>
      ${details}
      ${signal}
    </li>`;
}

function renderAssessment(a) {
  const prereqs = a.prerequisites.length
    ? `<div class="chips">${a.prerequisites
        .map((p) => `<span class="chip ${p.required ? "req" : ""}">${esc(p.type)}${p.required ? " (required)" : ""}</span>`)
        .join("")}</div>`
    : '<p class="lede">No prerequisites documented for this route.</p>';

  const gates = a.frictionGates.length
    ? `<ul class="gate-list">${a.frictionGates
        .map((g) => `<li><span class="chip">${esc(g.type)}</span> ${esc(g.description)}${g.atStep ? ` <span class="gate-step">(at step ${num(g.atStep)})</span>` : ""}</li>`)
        .join("")}</ul>`
    : '<p class="lede">No friction gates documented on this route.</p>';

  const time = a.timeToFirstSuccess
    ? `${esc(a.timeToFirstSuccess.value)} ${a.timeToFirstSuccess.vendorClaim ? "(vendor claim)" : ""}`
    : "Not documented";

  const sources = a.sources.length
    ? `<ul class="sources-list">${a.sources
        .slice(0, 8)
        .map((s) => `<li><a href="${esc(s.url)}" rel="noreferrer">${esc(s.title)}</a></li>`)
        .join("")}${a.sources.length > 8 ? `<li>+ ${a.sources.length - 8} more in the record</li>` : ""}</ul>`
    : '<p class="lede">See the full record for sources.</p>';

  const steps = a.steps.length
    ? `<ol class="steps-list">${a.steps.map(stepItem).join("")}</ol>`
    : '<p class="lede">Open the full record for the documented steps.</p>';

  const asOf = a.researchedAt
    ? ` Documented from official docs as of ${esc(a.researchedAt)}. Docs change.`
    : "";

  return `
    <div class="card">
      <div class="assess-head">
        <h2>${esc(a.name)}</h2>
        <span class="pill pill-cat">${esc(a.category)}</span>
      </div>
      <p class="lede">${esc(a.outcome)}</p>
      ${readStrip()}

      <dl class="kv">
        <div><dt>Selected route</dt><dd>${esc(a.selectedSurface)}</dd></div>
        <div><dt>Documented first success</dt><dd>${esc(a.firstSuccess.milestone || a.firstSuccess.normalizedOutcome || a.outcome)}</dd></div>
        <div><dt>Vendor time claim</dt><dd>${time}</dd></div>
        <div><dt>Prerequisites</dt><dd>${prereqs}</dd></div>
        <div><dt>Friction gates (descriptive)</dt><dd>${gates}</dd></div>
      </dl>

      <h3 class="steps-heading">Documented steps <span class="steps-count">${num(a.pathStepCount)} steps, ${num(a.sourceCount)} official sources</span></h3>
      ${steps}

      <div class="sources-block">
        <h3>Sources</h3>
        ${sources}
      </div>

      <p class="dist-line"><a href="${esc(a.recordUrl)}" rel="noreferrer">Open the full evidence record (JSON)</a></p>
      <p class="dist-line note-line">${esc(a.note)}${asOf}</p>
    </div>`;
}

async function showPlatform(slug) {
  hideSuggestions();
  el.result.hidden = false;
  el.result.innerHTML = '<div class="state-message">Loading the documented route…</div>';
  el.result.scrollIntoView({ behavior: "smooth", block: "start" });
  try {
    const assessment = await api(`/api/platforms/${encodeURIComponent(slug)}`);
    el.result.innerHTML = renderAssessment(assessment.data);
  } catch (err) {
    el.result.innerHTML = `<div class="state-message"><strong>Could not load that platform.</strong><br>${esc(err.message)}</div>`;
  }
}

function renderUnknown(query) {
  el.result.hidden = false;
  el.result.innerHTML = `
    <div class="card unknown-panel">
      <h2>Researching ${esc(query)}</h2>
      <p class="lede">Looking up official docs and drafting the documented route.</p>
      <ol class="research-log" id="research-log"></ol>
      <button class="btn btn-secondary" id="research-btn" type="button" hidden>Try research again</button>
    </div>`;
  document.querySelector("#research-btn").addEventListener("click", () => researchPlatform(query));
  el.result.scrollIntoView({ behavior: "smooth", block: "start" });
  researchPlatform(query);
}

function logStep(text, cls) {
  const logEl = document.querySelector("#research-log");
  if (!logEl) return;
  logEl.hidden = false;
  const li = document.createElement("li");
  if (cls) li.className = cls;
  li.textContent = text;
  logEl.appendChild(li);
}

async function* readSse(res) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";
    for (const chunk of chunks) {
      const dataLine = chunk.split("\n").find((l) => l.startsWith("data:"));
      if (dataLine) {
        try {
          yield JSON.parse(dataLine.slice(5).trim());
        } catch {
          /* ignore malformed frame */
        }
      }
    }
  }
}

async function researchPlatform(query) {
  const btn = document.querySelector("#research-btn");
  if (btn) {
    btn.hidden = true;
    btn.disabled = true;
  }
  const logEl = document.querySelector("#research-log");
  if (logEl) logEl.innerHTML = "";
  logStep("Starting…");
  try {
    const res = await fetch("/api/research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: query }),
    });
    if (!res.ok || !res.body) {
      const body = await res.json().catch(() => ({}));
      logStep(body.error ? body.error.message : `Research unavailable (${res.status}).`, "err");
      if (btn) {
        btn.hidden = false;
        btn.disabled = false;
      }
      return;
    }

    for await (const ev of readSse(res)) {
      if (ev.type === "status") logStep(ev.message);
      else if (ev.type === "known") return showPlatform(ev.slug);
      else if (ev.type === "result") {
        el.result.innerHTML = renderAssessment(ev.assessment);
      } else if (ev.type === "error") {
        logStep(ev.message, "err");
        if (btn) {
          btn.hidden = false;
          btn.disabled = false;
        }
      }
    }
  } catch {
    logStep("Lost connection to the research service.", "err");
    if (btn) {
      btn.hidden = false;
      btn.disabled = false;
    }
  }
}

async function submitQuery(q) {
  const query = q.trim();
  if (!query) return;
  try {
    const { data } = await api(`/api/search?q=${encodeURIComponent(query)}`);
    const exact = data.find((r) => r.name.toLowerCase() === query.toLowerCase());
    if (exact) return showPlatform(exact.slug);
    if (data.length > 0) return showPlatform(data[0].slug);
    renderUnknown(query);
  } catch (err) {
    el.result.hidden = false;
    el.result.innerHTML = `<div class="state-message">${esc(err.message)}</div>`;
  }
}

/* ---------- Events ---------- */

el.input.addEventListener("input", (e) => runSearch(e.target.value));
el.input.addEventListener("blur", () => setTimeout(hideSuggestions, 150));

el.suggestions.addEventListener("click", (e) => {
  const li = e.target.closest(".suggestion");
  if (li) showPlatform(li.dataset.slug);
});

el.form.addEventListener("submit", (e) => {
  e.preventDefault();
  submitQuery(el.input.value);
});

async function init() {
  try {
    const { data } = await api("/api/meta");
    el.platformCount.textContent = num(data.count);
  } catch {
    /* leave the static fallback count */
  }
}

init();
