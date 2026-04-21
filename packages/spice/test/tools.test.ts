/**
 * Shape check for the expanded tool surface: every typed wrapper dispatches
 * to the correct MCP tool name with the documented arg layout.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  callTool: vi.fn(),
  connect: vi.fn(),
  close: vi.fn(),
}));

vi.mock("@modelcontextprotocol/sdk/client/index.js", () => {
  class Client {
    connect = mocks.connect;
    callTool = mocks.callTool;
    close = mocks.close;
  }
  return { Client };
});

vi.mock("@modelcontextprotocol/sdk/client/streamableHttp.js", () => {
  class StreamableHTTPClientTransport {
    constructor(_url: URL, _opts?: unknown) {}
  }
  return { StreamableHTTPClientTransport };
});

import { DuneMCP } from "../src/index.js";

function structured(payload: unknown) {
  return { content: [], structuredContent: payload };
}

describe("DuneMCP tool dispatch", () => {
  beforeEach(() => {
    mocks.callTool.mockReset();
    mocks.connect.mockReset();
    mocks.connect.mockResolvedValue(undefined);
  });

  it.each([
    ["searchDocs", () => dune.searchDocs("gas"), "searchDocs", { query: "gas" }],
    [
      "searchTables",
      () => dune.searchTables({ chain: "ethereum", limit: 5 }),
      "searchTables",
      { chain: "ethereum", limit: 5 },
    ],
    ["listBlockchains", () => dune.listBlockchains(), "listBlockchains", undefined],
    [
      "searchTablesByContractAddress",
      () => dune.searchTablesByContractAddress("0xabc", "ethereum"),
      "searchTablesByContractAddress",
      { address: "0xabc", chain: "ethereum" },
    ],
    [
      "getTableSize",
      () => dune.getTableSize(["ethereum.transactions"]),
      "getTableSize",
      { tables: ["ethereum.transactions"] },
    ],
    [
      "getDuneQuery",
      () => dune.getDuneQuery(42),
      "getDuneQuery",
      { queryId: 42 },
    ],
    [
      "updateDuneQuery",
      () => dune.updateDuneQuery(42, { name: "new" }),
      "updateDuneQuery",
      { queryId: 42, name: "new" },
    ],
    [
      "getVisualization",
      () => dune.getVisualization("viz-1"),
      "getVisualization",
      { visualizationId: "viz-1" },
    ],
    [
      "listQueryVisualizations",
      () => dune.listQueryVisualizations(42),
      "listQueryVisualizations",
      { queryId: 42 },
    ],
    [
      "getDashboard",
      () => dune.getDashboard("dash-1"),
      "getDashboard",
      { dashboardId: "dash-1" },
    ],
    [
      "archiveDashboard",
      () => dune.archiveDashboard("dash-1"),
      "archiveDashboard",
      { dashboardId: "dash-1" },
    ],
  ] as const)("%s forwards to tool %s with %o", async (_label, invoke, name, args) => {
    mocks.callTool.mockResolvedValueOnce(structured({}));
    await invoke();
    expect(mocks.callTool).toHaveBeenCalledWith({ name, arguments: args });
  });
});

let dune: DuneMCP;

beforeEach(() => {
  dune = new DuneMCP({ apiKey: "sk-test" });
});
