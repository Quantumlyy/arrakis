import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

import {
  DuneExecutionTimeoutError,
  DuneMCP,
  DuneToolError,
} from "../src/index.js";

function textResult(payload: unknown) {
  return {
    content: [{ type: "text", text: JSON.stringify(payload) }],
  };
}

function structuredResult(payload: unknown) {
  return {
    content: [],
    structuredContent: payload,
  };
}

describe("DuneMCP", () => {
  beforeEach(() => {
    mocks.callTool.mockReset();
    mocks.connect.mockReset();
    mocks.close.mockReset();
    mocks.connect.mockResolvedValue(undefined);
    mocks.close.mockResolvedValue(undefined);
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("forwards call() to the SDK Client.callTool with name and args", async () => {
    mocks.callTool.mockResolvedValueOnce(textResult({ hi: "there" }));
    const dune = new DuneMCP({ getAccessToken: async () => "t" });

    const out = await dune.call("raw_tool", { a: 1 });

    expect(mocks.connect).toHaveBeenCalledTimes(1);
    expect(mocks.callTool).toHaveBeenCalledWith({ name: "raw_tool", arguments: { a: 1 } });
    expect(out).toEqual({ hi: "there" });
  });

  it("reuses a single connection across multiple calls", async () => {
    mocks.callTool
      .mockResolvedValueOnce(textResult({ v: 1 }))
      .mockResolvedValueOnce(textResult({ v: 2 }));
    const dune = new DuneMCP({ getAccessToken: async () => "t" });

    await dune.call("x");
    await dune.call("y");

    expect(mocks.connect).toHaveBeenCalledTimes(1);
  });

  it("prefers structuredContent over the text content block", async () => {
    mocks.callTool.mockResolvedValueOnce(structuredResult({ plan: "pro", creditsUsed: 10 }));
    const dune = new DuneMCP({ getAccessToken: async () => "t" });

    const usage = await dune.getUsage();

    expect(usage.plan).toBe("pro");
    expect(usage.creditsUsed).toBe(10);
  });

  it("getUsage decodes a text-block payload via the Zod schema", async () => {
    mocks.callTool.mockResolvedValueOnce(textResult({ plan: "free", creditsUsed: 0 }));
    const dune = new DuneMCP({ getAccessToken: async () => "t" });

    const usage = await dune.getUsage();
    expect(usage).toMatchObject({ plan: "free", creditsUsed: 0 });
  });

  it("wraps the tool's isError responses as DuneToolError", async () => {
    mocks.callTool.mockResolvedValueOnce({
      isError: true,
      content: [{ type: "text", text: "query not found" }],
    });
    const dune = new DuneMCP({ getAccessToken: async () => "t" });

    const err = await dune.call("get_query").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(DuneToolError);
    expect((err as DuneToolError).message).toContain("query not found");
    expect((err as DuneToolError).tool).toBe("get_query");
  });

  it("runQueryAndWait polls until a terminal success state", async () => {
    const handle = { executionId: "exec-1", state: "QUERY_STATE_PENDING" };
    mocks.callTool
      .mockResolvedValueOnce(structuredResult(handle))
      .mockResolvedValueOnce(structuredResult({ executionId: "exec-1", state: "QUERY_STATE_EXECUTING" }))
      .mockResolvedValueOnce(structuredResult({ executionId: "exec-1", state: "QUERY_STATE_EXECUTING" }))
      .mockResolvedValueOnce(
        structuredResult({
          executionId: "exec-1",
          state: "QUERY_STATE_COMPLETED",
          rows: [{ gas_price: 12.3 }],
        }),
      );
    const dune = new DuneMCP({ getAccessToken: async () => "t" });

    const result = await dune.runQueryAndWait(42, { pollMs: 1, timeoutMs: 5_000 });

    expect(result.state).toBe("QUERY_STATE_COMPLETED");
    expect(result.rows).toEqual([{ gas_price: 12.3 }]);
    expect(mocks.callTool).toHaveBeenCalledTimes(4);
    expect(mocks.callTool).toHaveBeenNthCalledWith(1, {
      name: "execute_query",
      arguments: { queryId: 42 },
    });
  });

  it("runQueryAndWait throws DuneExecutionTimeoutError when deadline elapses", async () => {
    mocks.callTool.mockImplementation(async (req: { name: string }) => {
      if (req.name === "execute_query") {
        return structuredResult({ executionId: "exec-slow", state: "QUERY_STATE_PENDING" });
      }
      return structuredResult({ executionId: "exec-slow", state: "QUERY_STATE_EXECUTING" });
    });
    const dune = new DuneMCP({ getAccessToken: async () => "t" });

    await expect(
      dune.runQueryAndWait(7, { pollMs: 5, timeoutMs: 20 }),
    ).rejects.toBeInstanceOf(DuneExecutionTimeoutError);
  });

  it("runQueryAndWait throws DuneToolError on a non-success terminal state", async () => {
    mocks.callTool
      .mockResolvedValueOnce(structuredResult({ executionId: "exec-fail", state: "QUERY_STATE_PENDING" }))
      .mockResolvedValueOnce(structuredResult({ executionId: "exec-fail", state: "QUERY_STATE_FAILED" }));
    const dune = new DuneMCP({ getAccessToken: async () => "t" });

    const err = await dune
      .runQueryAndWait(9, { pollMs: 1, timeoutMs: 5_000 })
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(DuneToolError);
    expect((err as DuneToolError).message).toContain("QUERY_STATE_FAILED");
  });

  it("close() tears down the client so the next call reconnects", async () => {
    mocks.callTool.mockResolvedValue(textResult({ ok: true }));
    const dune = new DuneMCP({ getAccessToken: async () => "t" });

    await dune.call("x");
    await dune.close();
    await dune.call("x");

    expect(mocks.connect).toHaveBeenCalledTimes(2);
    expect(mocks.close).toHaveBeenCalledTimes(1);
  });
});
