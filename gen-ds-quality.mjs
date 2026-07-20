import fs from "node:fs";
import path from "node:path";

// Generates ds-quality.json: machine-readable filter flags for downstream data
// science. These are quality/shape signals for notebooks, NOT a ranking or a
// measure of developer experience. Run: node gen-ds-quality.mjs [--write]

const base = path.dirname(new URL(import.meta.url).pathname);
const roster = JSON.parse(fs.readFileSync(path.join(base, "roster.json"), "utf8"));
const recordsDir = path.join(base, "records");

// Mirrors the blocked/needs-human-judgment detector in validate-records.mjs.
// After the integrity pass this should flag zero complete records; the detector
// stays so the contradiction cannot silently return.
const blockedSuccessPhrases = [
  /not established/i,
  /no single[^.]*\bmilestone\b/i,
  /no\s+\S*(?:-wide|-level)\b[^.]*\bmilestone\b/i,
  /no\s+(?:platform-wide|cross-product|cross-platform|cross-scenario)[^.]*\b(?:milestone|first[- ]?success|completion signal)\b/i,
  /cannot be (?:reconstructed|established)/i,
  /human selection[^.]*required/i,
  /human[- ]judgment/i,
  /needs-human-judgment/i,
  /\bunresolved\b/i,
  /no complete first[- ]?user (?:route|path)/i,
  /required before a documented first[- ]?success/i,
  /do(?:es)? not establish the complete/i,
];

const opaqueSignupPattern = /(opaque|not enumerated|unspecified|does not document|does not expose|does not specify|not publicly (?:documented|enumerated)|form fields (?:are )?not)/i;
const localOrPlaygroundPattern = /(playground|localhost|\blocal\b|docker|\boss\b|no[- ]account|self[- ]host|open source)/i;

function stepText(steps) {
  return (steps || [])
    .map((s) => `${s.action || ""} ${(s.details || []).join(" ")}`)
    .join(" ");
}

function analyze(record) {
  const s = record.documented_first_success || {};
  const primary = record.primary_path || [];
  const gates = record.friction_gates || [];
  const uncertainties = record.uncertainties || [];
  const candidates = record.candidate_paths || [];

  const successFields = [
    s.official_milestone,
    s.normalized_outcome,
    s.observable_completion_signal,
    s.why_this_is_the_boundary,
    record.surface?.name,
  ].filter((x) => typeof x === "string");
  const contradictory = successFields.some((text) => blockedSuccessPhrases.some((p) => p.test(text)));

  const pathText = stepText(primary);
  const opaqueText = `${pathText} ${uncertainties.map((u) => `${u.question || ""} ${u.reason_unresolved || ""}`).join(" ")}`;
  const surfaceAndPath = `${record.surface?.name || ""} ${pathText}`;

  const stepCount = primary.length;
  const thinPath = stepCount <= 4;
  const hasOpaqueSignup = opaqueSignupPattern.test(opaqueText);
  const localOrPlayground = localOrPlaygroundPattern.test(surfaceAndPath);

  const notes = [];
  if (contradictory) notes.push("Success labels still contain blocked/needs-human-judgment phrasing.");
  if (thinPath) notes.push("Thin path (<= 4 primary steps); confirm it reaches a real terminal.");
  if (hasOpaqueSignup) notes.push("Path relies on an opaque signup/OAuth step; some fields are not publicly enumerated.");
  if (candidates.length === 0) notes.push("No enumerated candidate_paths; single documented route only.");

  return {
    slug: record.platform?.slug,
    research_status: record.research_status,
    step_count: stepCount,
    gate_count: gates.length,
    uncertainty_count: uncertainties.length,
    has_opaque_signup_language: hasOpaqueSignup,
    contradictory_success_labels: contradictory,
    thin_path: thinPath,
    local_or_playground_route: localOrPlayground,
    candidate_paths_count: candidates.length,
    notes,
  };
}

const records = [];
const missing = [];
for (const entry of roster) {
  const file = path.join(recordsDir, `${entry.slug}.json`);
  if (!fs.existsSync(file)) {
    missing.push(entry.slug);
    continue;
  }
  records.push(analyze(JSON.parse(fs.readFileSync(file, "utf8"))));
}

const summary = {
  total: records.length,
  contradictory_success_labels: records.filter((r) => r.contradictory_success_labels).length,
  has_opaque_signup_language: records.filter((r) => r.has_opaque_signup_language).length,
  thin_path: records.filter((r) => r.thin_path).length,
  local_or_playground_route: records.filter((r) => r.local_or_playground_route).length,
  no_candidate_paths: records.filter((r) => r.candidate_paths_count === 0).length,
};

const report = {
  generated_at: new Date().toISOString(),
  purpose: "Filter flags for downstream data science; not a ranking and not a measure of developer experience. Flags describe record shape and label integrity so notebooks can include or exclude records deliberately.",
  flag_definitions: {
    step_count: "Number of steps on the reconstructed primary_path.",
    gate_count: "Number of friction_gates recorded on the primary path.",
    uncertainty_count: "Number of recorded uncertainties.",
    has_opaque_signup_language: "The path or uncertainties note an opaque signup/OAuth step or fields not publicly enumerated.",
    contradictory_success_labels: "Success labels still read like a blocked/needs-human-judgment record (should be false for all complete records).",
    thin_path: "primary_path has <= 4 steps.",
    local_or_playground_route: "Selected route looks local/no-account (playground, localhost, Docker, OSS). Selection policy prefers these, which biases est_minutes downward: a confound, not a finding.",
    candidate_paths_count: "Number of enumerated alternative candidate_paths (often 0; do not mass-invent peers).",
  },
  summary,
  missing_records: missing,
  records,
};

if (process.argv.includes("--write")) {
  fs.writeFileSync(path.join(base, "ds-quality.json"), `${JSON.stringify(report, null, 2)}\n`);
}

console.log(JSON.stringify(summary, null, 2));
if (summary.contradictory_success_labels > 0 || missing.length > 0) process.exitCode = 1;
