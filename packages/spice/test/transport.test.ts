import { describe, expect, it, vi } from "vitest";

import { DuneAuthError, DuneRateLimitError } from "../src/errors.js";
import { createAuthedFetch } from "../src/transport.js";

describe("createAuthedFetch", () => {
  it("injects a fresh bearer token on every request", async () => {
    let call = 0;
    const baseFetch = vi.fn(async (_input, init: RequestInit | undefined) => {
      const auth = new Headers(init?.headers).get("Authorization");
      return new Response(`ok-${auth}`, { status: 200 });
    }) as unknown as typeof fetch;

    const fetcher = createAuthedFetch({
      getAccessToken: async () => `token-${++call}`,
      baseFetch,
    });

    const r1 = await fetcher("https://example.com/mcp");
    const r2 = await fetcher("https://example.com/mcp");
    expect(await r1.text()).toBe("ok-Bearer token-1");
    expect(await r2.text()).toBe("ok-Bearer token-2");
    expect(baseFetch).toHaveBeenCalledTimes(2);
  });

  it("maps 401 responses to DuneAuthError", async () => {
    const baseFetch = (async () => new Response("", { status: 401 })) as typeof fetch;
    const fetcher = createAuthedFetch({
      getAccessToken: async () => "t",
      baseFetch,
    });
    await expect(fetcher("https://example.com")).rejects.toBeInstanceOf(DuneAuthError);
  });

  it("maps 429 responses to DuneRateLimitError with retry-after", async () => {
    const baseFetch = (async () =>
      new Response("", {
        status: 429,
        headers: { "retry-after": "12" },
      })) as typeof fetch;
    const fetcher = createAuthedFetch({
      getAccessToken: async () => "t",
      baseFetch,
    });
    const err = await fetcher("https://example.com").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(DuneRateLimitError);
    expect((err as DuneRateLimitError).retryAfter).toBe(12);
  });
});
