/**
 * Hits the real Dune MCP server. Skipped unless SPICE_INTEGRATION=1 and one
 * of DUNE_API_KEY or DUNE_ACCESS_TOKEN is present.
 */
import { describe, expect, it } from "vitest";

import { DuneMCP, type DuneMCPOptions } from "../src/index.js";

const apiKey = process.env.DUNE_API_KEY;
const accessToken = process.env.DUNE_ACCESS_TOKEN;
const shouldRun = process.env.SPICE_INTEGRATION === "1" && (!!apiKey || !!accessToken);

describe.runIf(shouldRun)("DuneMCP (integration)", () => {
  it("getUsage returns plan information", async () => {
    const opts: DuneMCPOptions = apiKey
      ? { apiKey }
      : { getAccessToken: async () => accessToken! };
    if (process.env.DUNE_MCP_URL) opts.mcpUrl = process.env.DUNE_MCP_URL;

    const dune = new DuneMCP(opts);
    try {
      const usage = await dune.getUsage();
      expect(usage).toBeTypeOf("object");
    } finally {
      await dune.close();
    }
  }, 30_000);
});
