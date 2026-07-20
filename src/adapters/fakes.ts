import type { DataStore, DatasetMeta, MetricRow, PlatformRecord } from "../core/ports.js";

/** In-memory DataStore for tests: no filesystem, fully deterministic. */
export class InMemoryDataStore implements DataStore {
  private readonly bySlug: Map<string, MetricRow>;
  private readonly records: Map<string, PlatformRecord>;

  constructor(
    private readonly rows: MetricRow[],
    records: Record<string, PlatformRecord> = {},
    private readonly metaValue: DatasetMeta = {
      count: rows.length,
      generatedAt: "2026-07-19",
      scoreModelVersion: "1.0",
      caveats: [],
      totals: { platforms: rows.length, steps: 0, sources: 0 },
    },
  ) {
    this.bySlug = new Map(rows.map((r) => [r.slug, r]));
    this.records = new Map(Object.entries(records));
  }

  meta(): DatasetMeta {
    return this.metaValue;
  }
  listRows(): MetricRow[] {
    return this.rows;
  }
  getRow(slug: string): MetricRow | undefined {
    return this.bySlug.get(slug);
  }
  getRecord(slug: string): PlatformRecord | undefined {
    return this.records.get(slug);
  }
}
