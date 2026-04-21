import { DuneMCP, type DuneMCPOptions } from "@arrakis/spice";

/**
 * DuneMCP backed by the demo owner's API key. Every visitor hits the same
 * token; the returned rows are ISR-cached per the page's `revalidate`. This
 * is the "anonymous" path — when a visitor signs in and connects their own
 * Dune account, `getConnectedDune()` takes over and their credits fuel the
 * query instead.
 */
export function getAnonymousDune(): DuneMCP {
  const apiKey = process.env.DUNE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "DUNE_API_KEY is not set. Copy apps/muaddib/.env.example to .env.local and fill it in.",
    );
  }
  const opts: DuneMCPOptions = { apiKey };
  if (process.env.DUNE_MCP_URL) opts.mcpUrl = process.env.DUNE_MCP_URL;
  return new DuneMCP(opts);
}

export function isAnonymousConfigured(): boolean {
  return Boolean(process.env.DUNE_API_KEY && process.env.DUNE_QUERY_ID);
}

export function getConfiguredQueryId(): number | undefined {
  const raw = process.env.DUNE_QUERY_ID;
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}
