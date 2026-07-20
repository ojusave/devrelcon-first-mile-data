import type { LLMProvider } from "../core/ports.js";

/**
 * Phase 2 seam. Reconstructs a schema-valid record from official docs using an
 * OpenRouter-hosted model, following agent-instructions.md rules. Not
 * implemented yet: gated behind RESEARCH_ENABLED and run on a Render Workflow.
 */
export class OpenRouterProvider implements LLMProvider {
  constructor(private readonly apiKey: string, private readonly model: string) {}

  async reconstructRecord(): ReturnType<LLMProvider["reconstructRecord"]> {
    throw new Error("OpenRouterProvider not implemented (Phase 2).");
  }
}
