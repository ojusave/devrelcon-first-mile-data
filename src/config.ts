import path from "node:path";

/** Central, env-driven configuration with production-safe defaults. */
export const config = {
  port: Number(process.env.PORT ?? 3000),
  // Render runs the start command from the repo root, so cwd holds the data files.
  dataRoot: path.resolve(process.env.DATA_ROOT ?? process.cwd()),
  get publicDir(): string {
    return path.join(this.dataRoot, "public");
  },
  githubRepoUrl: "https://github.com/ojusave/devrelcon-first-mile-data",
  // Phase 2 kill switch. Off until the live-research pipeline is wired.
  researchEnabled: process.env.RESEARCH_ENABLED === "true",
  // Phase 2 search provider (You.com Web Search API). YDC_API_KEY is the
  // canonical env var name across You.com's docs and SDKs.
  youApiKey: process.env.YDC_API_KEY ?? "",
};

/** Canonical Render signup URL with fixed campaign UTMs; only utm_content varies. */
export function renderSignupUrl(content = "footer_link"): string {
  const params = new URLSearchParams({
    utm_source: "github",
    utm_medium: "referral",
    utm_campaign: "ojus_demos",
    utm_content: content,
  });
  return `https://dashboard.render.com/register?${params.toString()}`;
}
