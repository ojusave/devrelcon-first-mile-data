import type { SearchProvider } from "../core/ports.js";

const SEARCH_ENDPOINT = "https://ydc-index.io/v1/search";
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_COUNT = 8;

interface YouWebResult {
  url?: string;
  title?: string;
}

interface YouSearchResponse {
  results?: { web?: YouWebResult[] };
}

/**
 * Finds official documentation pages for an unknown platform via the You.com
 * Web Search API. Non-critical Phase 2 dependency: constructed only when
 * RESEARCH_ENABLED is on. A hard failure throws so the research pipeline can
 * mark the attempt as errored rather than fabricate results.
 */
export class YouSearchProvider implements SearchProvider {
  constructor(
    private readonly apiKey: string,
    private readonly timeoutMs = DEFAULT_TIMEOUT_MS,
  ) {
    if (!apiKey) throw new Error("YouSearchProvider requires a YDC_API_KEY.");
  }

  async findOfficialDocs(platform: string): Promise<Array<{ title: string; url: string }>> {
    const query = `${platform} official developer documentation quickstart getting started`;
    const url = `${SEARCH_ENDPOINT}?query=${encodeURIComponent(query)}&count=${DEFAULT_COUNT}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(url, {
        headers: { "X-API-Key": this.apiKey },
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`You.com search failed: ${res.status} ${res.statusText}`);
      }
      const body = (await res.json()) as YouSearchResponse;
      const web = body.results?.web ?? [];
      return web
        .filter((r): r is Required<YouWebResult> => Boolean(r.url && r.title))
        .map((r) => ({ title: r.title, url: r.url }));
    } finally {
      clearTimeout(timer);
    }
  }
}
