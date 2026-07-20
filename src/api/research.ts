import type { Request, Response } from "express";
import { config } from "../config.js";
import { sendError } from "./http.js";

/**
 * Phase 2 endpoint: research a platform that is not in the dataset, then open a
 * draft PR to add it. Gated by RESEARCH_ENABLED. Until the Render Workflow is
 * wired, this returns a clear, non-crashing status so the UI can degrade.
 */
export function startResearch() {
  return (_req: Request, res: Response): void => {
    if (!config.researchEnabled) {
      sendError(
        res,
        503,
        "research_disabled",
        "Live research for unknown platforms is not enabled yet. This ships in Phase 2.",
      );
      return;
    }
    sendError(res, 501, "not_implemented", "Live research pipeline is under construction (Phase 2).");
  };
}
