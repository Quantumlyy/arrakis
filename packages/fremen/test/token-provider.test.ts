import { describe, expect, it, vi } from "vitest";

import { REFRESH_BUFFER_MS } from "../src/constants.js";
import { createRefreshingTokenProvider } from "../src/token-provider.js";

const T0 = new Date("2026-04-21T14:00:00Z").getTime();

describe("createRefreshingTokenProvider", () => {
  it("re-checks expiry on each call so a long-lived client refreshes mid-poll", async () => {
    const fetchImpl = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          access_token: "at-new",
          refresh_token: "rt-new",
          expires_in: 300,
        }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    let now = T0;
    const persist = vi.fn(async () => {});

    const getAccessToken = createRefreshingTokenProvider({
      initial: {
        accessToken: "at-initial",
        refreshToken: "rt-initial",
        accessTokenExpiresAt: new Date(T0 + 2 * REFRESH_BUFFER_MS),
      },
      clientId: "cid",
      now: () => now,
      persist,
      fetchImpl,
    });

    // First call while initial token is still fresh: no refresh.
    expect(await getAccessToken()).toBe("at-initial");
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(persist).not.toHaveBeenCalled();

    // Advance past the refresh buffer — next call must refresh.
    now = T0 + 2 * REFRESH_BUFFER_MS + 1;
    expect(await getAccessToken()).toBe("at-new");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(persist).toHaveBeenCalledTimes(1);

    // After refresh, subsequent calls reuse the new token without hitting
    // the network again.
    expect(await getAccessToken()).toBe("at-new");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it("dedupes concurrent refreshes so ten simultaneous calls fire one request", async () => {
    let pending: ((res: Response) => void) | undefined;
    const fetchImpl = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          pending = resolve;
        }),
    ) as unknown as typeof fetch;
    const persist = vi.fn(async () => {});

    const getAccessToken = createRefreshingTokenProvider({
      initial: {
        accessToken: "at-old",
        refreshToken: "rt-old",
        accessTokenExpiresAt: new Date(T0 - 1_000),
      },
      clientId: "cid",
      now: () => T0,
      persist,
      fetchImpl,
    });

    const calls = Array.from({ length: 10 }, () => getAccessToken());

    // All ten should be waiting on the same refresh in flight.
    await new Promise((r) => setTimeout(r, 0));
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    pending?.(
      new Response(
        JSON.stringify({
          access_token: "at-new",
          refresh_token: "rt-new",
          expires_in: 300,
        }),
        { status: 200 },
      ),
    );

    const results = await Promise.all(calls);
    expect(results).toEqual(Array.from({ length: 10 }, () => "at-new"));
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it("returns the initial token unchanged when it is still fresh", async () => {
    const fetchImpl = vi.fn();
    const persist = vi.fn(async () => {});

    const getAccessToken = createRefreshingTokenProvider({
      initial: {
        accessToken: "at-fresh",
        refreshToken: "rt-fresh",
        accessTokenExpiresAt: new Date(T0 + REFRESH_BUFFER_MS + 60_000),
      },
      clientId: "cid",
      now: () => T0,
      persist,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(await getAccessToken()).toBe("at-fresh");
    expect(await getAccessToken()).toBe("at-fresh");
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(persist).not.toHaveBeenCalled();
  });
});
