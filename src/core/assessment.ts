import type { MetricRow, PlatformRecord } from "./ports.js";

// Guardrail copy kept consistent with MEASUREMENT-CONTRACT.md and the original site.
export const MEASUREMENT_NOTE =
  "This describes documented route shape, not usability, conversion, or observed developer completion time. " +
  "The effort score is a unitless heuristic over normalized counts, not minutes and not a vendor claim. " +
  "Routes are only conditionally comparable; this is not a ranking.";

export interface Assessment {
  name: string;
  slug: string;
  category: string;
  outcome: string;
  selectedSurface: string;
  firstSuccessType: string;
  metrics: {
    developerActions: number;
    requiredActions: number;
    optionalActions: number;
    platformEvents: number;
    rawTransitions: number;
    docNavigation: number;
    waits: number;
    gates: number;
    effortScore: number;
    comparability: string;
  };
  recordAvailable: boolean;
  firstSuccess: {
    milestone: string | null;
    normalizedOutcome: string | null;
    completionSignal: string | null;
    boundaryType: string | null;
  };
  prerequisites: Array<{ type: string; requirement: string; required: boolean }>;
  frictionGates: Array<{ type: string; description: string }>;
  timeToFirstSuccess: { vendorClaim: boolean; value: string } | null;
  pathStepCount: number;
  sources: Array<{ title: string; url: string }>;
  sourceCount: number;
  uncertaintyCount: number;
  recordUrl: string;
  note: string;
}

/**
 * Join a metrics row with its canonical record into a single assessment.
 * The record is optional: when absent, metrics still render and record-only
 * fields degrade to empty rather than throwing.
 */
export function buildAssessment(row: MetricRow, record?: PlatformRecord): Assessment {
  const fs = record?.documented_first_success;
  const ttfs = record?.time_to_first_success;

  return {
    name: row.name,
    slug: row.slug,
    category: row.category,
    outcome: row.outcome,
    selectedSurface: row.selected_surface,
    firstSuccessType: row.first_success_type,
    metrics: {
      developerActions: row.developer_action_count,
      requiredActions: row.required_developer_action_count,
      optionalActions: row.optional_developer_action_count,
      platformEvents: row.platform_event_count,
      rawTransitions: row.raw_transition_count,
      docNavigation: row.documentation_navigation_count,
      waits: row.wait_or_async_count,
      gates: row.gate_count,
      effortScore: row.heuristic_effort_score,
      comparability: row.comparability_status,
    },
    recordAvailable: Boolean(record),
    firstSuccess: {
      milestone: fs?.official_milestone ?? null,
      normalizedOutcome: fs?.normalized_outcome ?? null,
      completionSignal: fs?.observable_completion_signal ?? null,
      boundaryType: fs?.boundary_evidence?.type ?? null,
    },
    prerequisites: (record?.prerequisites ?? []).map((p) => ({
      type: p.type,
      requirement: p.requirement,
      required: p.required,
    })),
    frictionGates: (record?.friction_gates ?? []).map((g) => ({
      type: g.type ?? "gate",
      description: g.description ?? g.requirement ?? "",
    })),
    timeToFirstSuccess:
      ttfs && ttfs.value
        ? { vendorClaim: Boolean(ttfs.vendor_claim), value: ttfs.value }
        : null,
    pathStepCount: record?.primary_path?.length ?? 0,
    sources: (record?.sources ?? []).map((s) => ({ title: s.title, url: s.url })),
    sourceCount: record?.sources?.length ?? 0,
    uncertaintyCount: record?.uncertainties?.length ?? 0,
    recordUrl: `data/records/${row.slug}.json`,
    note: MEASUREMENT_NOTE,
  };
}
