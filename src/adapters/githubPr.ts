import type { RepoWriter } from "../core/ports.js";

/**
 * Phase 2 seam. Opens a human-gated draft PR adding a schema-valid record to the
 * dataset repo. Never auto-merges. Not implemented yet: gated behind
 * RESEARCH_ENABLED and run on a Render Workflow.
 */
export class GitHubPrWriter implements RepoWriter {
  constructor(private readonly token: string, private readonly repo: string) {}

  async openDraftRecordPR(): Promise<{ url: string }> {
    throw new Error("GitHubPrWriter not implemented (Phase 2).");
  }
}
