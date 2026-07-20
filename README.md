# Platform first-mile knowledge base

This is the standalone source-grounded platform dataset for the DevRelCon
first-mile workshop research. It contains data and validation artifacts only;
the workshop application, session contract, stage outline, and broader blocker
research live elsewhere.

## Research question

For each named platform, what is the complete path documented by the platform
from a developer arriving with intent to the first-success boundary that the
official documentation itself explicitly names or demonstrates?

"Complete" applies only inside that bounded first path. It does not mean
researching the full product, advanced configuration, production hardening,
scaling, or later tutorials.

## Evidence rules

1. Inspect current official documentation directly. Search and memory may locate
   a page but cannot support a recorded fact.
2. Follow every official link needed to reconstruct the path. Do not summarize
   only the landing page or quickstart index.
3. Record every required prerequisite, account or access gate, atomic action,
   system response, wait, branch, and verification step on the primary path.
   When the docs present peer starting routes, preserve the shared spine in
   `primary_path` and record at least one complete, ordered, atomic official
   route in `candidate_paths`. A branch summary does not count as the journey.
   If public official docs genuinely cannot expose an executable candidate,
   record the exact source-backed reason in `candidate_path_gap` instead.
4. Cite source IDs on every prerequisite, path step, gate, time claim, and
   completion claim.
5. Record the vendor's explicit time claim when one exists. Otherwise write
   `not documented`; never estimate.
6. Do not choose the success boundary. A complete record requires an official
   milestone that is either explicitly named or demonstrated as the terminal
   success state of the official getting-started path. `normalized_outcome` is
   only a faithful paraphrase of that documented result.
7. When official documentation is missing, contradictory, login-gated, or does
   not select one canonical surface, record the uncertainty or return
   `blocked`/`needs-human-judgment`. Do not fill the gap from memory.
8. Paraphrase. Preserve exact commands, UI labels, field names, response values,
   and very short excerpts only when necessary to make the path reproducible.
9. Stop at the documented first-success boundary and list excluded next steps.
10. Do not create accounts, accept terms, enter payment details, deploy, send
    messages, or otherwise exercise a production system.

## Selection rule for broad platforms

Start at the vendor's official developer or product documentation home. Choose
the path the vendor itself presents as the general or recommended getting-started
route. Record why it is primary and list plausible alternatives. If the vendor
offers several equally primary surfaces or terminal success states and the
documentation does not select a default, return `needs-human-judgment` rather
than choosing silently.

## Contents

- `roster.json`: the complete 205-platform research roster, including all 100 independently audited records from the scale run.
- `record.schema.json`: machine-checkable record contract.
- `record.template.json`: copyable starting shape for each independent agent.
- `candidate-path-audit.json`: records flagged because their shared spine stops before an executable candidate route.
- `cold-audit-open.json`: unresolved independent source-to-step findings that keep a record invalid until correction and recheck.
- `cold-audit-summary.md`: resolved cross-batch source-to-step audit receipt for the high-risk and reworked records.
- `records/`: one canonical JSON record per platform.
- `catalog.md`: generated human-readable index after integration.
- `coverage.json`: generated validation and completion report.
- `ds-quality.json`: generated per-record quality and shape flags for downstream analysis (see below).
- `easiest-path.json`: generated derived heuristic for exploration only (see below); not measured data.

## Route selection policy

When official docs present peer routes, or a cloud signup gate previously left a
record unresolved, this dataset applies `SELECTION-POLICY.md`: commit to the
fastest and most commonly used documented route (prefer local/no-account when
offered; otherwise the vendor's first-listed or recommended quickstart).

## Completion standard

A platform record is complete only when its full bounded path is reconstructed
from inspected official sources and every evidence-bearing field is attributable.
Passing the schema is necessary but not sufficient; the parent also reviews
source coverage and representative paths cold.

## What `complete` means (and what it does not)

Under the current workshop policy, `complete` means one committed documented
route was reconstructed all the way to a terminal first success, with sources on
every step. See `SELECTION-POLICY.md` for how that route is chosen.

`complete` does not mean:

- every signup or OAuth field is publicly enumerated. When a form is opaque, the
  path records a single opaque signup step and the details live in
  `uncertainties`, not in the success labels.
- the vendor named one canonical platform-wide path. When docs leave peer routes
  open, the platform-level ambiguity is recorded in `surface.selection_basis`,
  `surface.alternatives_considered`, and `uncertainties`.

Because of this, `documented_first_success` on a complete record always describes
the selected route's affirmative terminal. `validate-records.mjs` fails any
complete record whose success labels still read like a blocked or
`needs-human-judgment` state (for example "not established", "no single
milestone", "requires human selection").

## Downstream analysis honesty

This repo is data plus validation. Two generated files support analysis but must
not be mistaken for measured truth:

- `ds-quality.json` (run `node gen-ds-quality.mjs --write`): machine-readable
  filter flags per record for notebooks, such as `step_count`, `gate_count`,
  `uncertainty_count`, `has_opaque_signup_language`, `thin_path`,
  `local_or_playground_route`, `candidate_paths_count`, and
  `contradictory_success_labels` (which stays as a guardrail and should read
  `false` for every record). These are shape and integrity flags, not a ranking.
- `easiest-path.json` (run `node derive-easiest-path.mjs`): a derived heuristic
  for exploration only. Its `est_minutes` is a synthetic score from per-step
  phase weights, not an observed time-to-success and not a vendor claim. The
  selection policy prefers local/no-account routes when offered, which biases
  those estimates downward: treat that as a confound, not a finding.
