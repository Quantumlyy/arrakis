import { DuneMCP, type DuneMCPOptions } from "@arrakis/spice";

/**
 * Returns a DuneMCP configured with the demo owner's long-lived access
 * token. This is the "anonymous" path — every visitor sees the same token's
 * data, ISR-cached per the page's `revalidate`.
 *
 * Throws if DUNE_ACCESS_TOKEN is not set. Callers should guard with
 * `isDuneConfigured()` first and render a setup banner when unconfigured.
 */
export function getDuneClient(): DuneMCP {
  const token = process.env.DUNE_ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      "DUNE_ACCESS_TOKEN is not set. Copy apps/muaddib/.env.example to .env.local and fill it in.",
    );
  }

  const opts: DuneMCPOptions = {
    getAccessToken: async () => token,
  };
  if (process.env.DUNE_MCP_URL) {
    opts.mcpUrl = process.env.DUNE_MCP_URL;
  }
  return new DuneMCP(opts);
}

export function isDuneConfigured(): boolean {
  return Boolean(process.env.DUNE_ACCESS_TOKEN && process.env.DUNE_QUERY_ID);
}

export function getConfiguredQueryId(): number | undefined {
  const raw = process.env.DUNE_QUERY_ID;
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}
