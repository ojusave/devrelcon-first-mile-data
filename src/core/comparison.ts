import type { MetricRow } from "./ports.js";
import { MEASUREMENT_NOTE } from "./assessment.js";

export interface PeerMetric {
  name: string;
  slug: string;
  developerActions: number;
  gates: number;
  effortScore: number;
  comparability: string;
}

export interface Distribution {
  value: number;
  categoryMedian: number;
  lowerCount: number;
  higherCount: number;
  equalCount: number;
}

export interface Comparison {
  category: string;
  platform: { name: string; slug: string };
  peerCount: number;
  comparablePeerCount: number;
  peers: PeerMetric[];
  distribution: {
    developerActions: Distribution;
    gates: Distribution;
    effortScore: Distribution;
  };
  comparabilityNote: string;
  note: string;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const raw = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  return Math.round(raw * 10) / 10;
}

function distribution(value: number, peerValues: number[]): Distribution {
  return {
    value,
    categoryMedian: median([value, ...peerValues]),
    lowerCount: peerValues.filter((v) => v < value).length,
    higherCount: peerValues.filter((v) => v > value).length,
    equalCount: peerValues.filter((v) => v === value).length,
  };
}

/**
 * Place a platform in the context of its category peers. Reports how the
 * documented counts sit relative to peers as a distribution, never as a rank.
 * Peers flagged not-comparable in ds-quality are excluded from the distribution
 * math but still listed for transparency.
 */
export function buildComparison(row: MetricRow, allRows: MetricRow[]): Comparison {
  const peers = allRows.filter((r) => r.category === row.category && r.slug !== row.slug);
  const comparablePeers = peers.filter((r) => r.comparability_status !== "not-comparable");

  const peerActions = comparablePeers.map((r) => r.developer_action_count);
  const peerGates = comparablePeers.map((r) => r.gate_count);
  const peerEffort = comparablePeers.map((r) => r.heuristic_effort_score);

  return {
    category: row.category,
    platform: { name: row.name, slug: row.slug },
    peerCount: peers.length,
    comparablePeerCount: comparablePeers.length,
    peers: peers
      .map((r) => ({
        name: r.name,
        slug: r.slug,
        developerActions: r.developer_action_count,
        gates: r.gate_count,
        effortScore: r.heuristic_effort_score,
        comparability: r.comparability_status,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    distribution: {
      developerActions: distribution(row.developer_action_count, peerActions),
      gates: distribution(row.gate_count, peerGates),
      effortScore: distribution(row.heuristic_effort_score, peerEffort),
    },
    comparabilityNote:
      row.comparability_status === "comparable"
        ? "This platform's route is marked comparable. Peer comparisons below still exclude routes marked not-comparable."
        : `This platform's route is marked "${row.comparability_status}". Read peer differences as documented-route shape, not as which product is easier to use.`,
    note: MEASUREMENT_NOTE,
  };
}
