import type { SearchProvider } from "../core/ports.js";

/**
 * Phase 2 seam. Finds official documentation pages for an unknown platform via
 * Exa. Not implemented yet: the live-research pipeline is gated behind
 * RESEARCH_ENABLED and runs on a Render Workflow, so this adapter is never
 * constructed in Phase 1.
 */
export class ExaSearchProvider implements SearchProvider {
  constructor(private readonly apiKey: string) {}

  async findOfficialDocs(): Promise<Array<{ title: string; url: string }>> {
    throw new Error("ExaSearchProvider not implemented (Phase 2).");
  }
}
