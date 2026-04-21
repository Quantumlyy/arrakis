import { DuneMCP, type DuneMCPOptions } from "@arrakis/spice";

/**
 * Returns a DuneMCP backed by the demo owner's Dune API key. Every visitor
 * sees the same account's data, ISR-cached per the page's `revalidate`. The
 * per-user OAuth path (via `@arrakis/fremen`) layers on top of this demo.
 *
 * Throws if `DUNE_API_KEY` is missing. Callers should guard with
 * `isDuneConfigured()` and render a setup banner if unconfigured.
 */
export function getDuneClient(): DuneMCP {
  const apiKey = process.env.DUNE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "DUNE_API_KEY is not set. Copy apps/muaddib/.env.example to .env.local and fill it in.",
    );
  }

  const opts: DuneMCPOptions = { apiKey };
  if (process.env.DUNE_MCP_URL) {
    opts.mcpUrl = process.env.DUNE_MCP_URL;
  }
  return new DuneMCP(opts);
}

export function isDuneConfigured(): boolean {
  return Boolean(process.env.DUNE_API_KEY && process.env.DUNE_QUERY_ID);
}

export function getConfiguredQueryId(): number | undefined {
  const raw = process.env.DUNE_QUERY_ID;
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}
