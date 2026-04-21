/**
 * Hits the real Dune MCP server. Skipped unless SPICE_INTEGRATION=1 and a
 * DUNE_ACCESS_TOKEN is present.
 */
import { describe, expect, it } from "vitest";

import { DuneMCP } from "../src/index.js";

const shouldRun = process.env.SPICE_INTEGRATION === "1" && !!process.env.DUNE_ACCESS_TOKEN;

describe.runIf(shouldRun)("DuneMCP (integration)", () => {
  it("getUsage returns plan information for the provided token", async () => {
    const dune = new DuneMCP({
      getAccessToken: async () => process.env.DUNE_ACCESS_TOKEN!,
      mcpUrl: process.env.DUNE_MCP_URL,
    });
    try {
      const usage = await dune.getUsage();
      expect(usage).toBeTypeOf("object");
    } finally {
      await dune.close();
    }
  }, 30_000);
});
