import type { FremenAuthClient } from "@arrakis/fremen/react";

export type MockState = "disconnected" | "connected" | "loading";

/**
 * Build a mock Better Auth client for stories. The real hook also hits
 * `/api/auth/dune/status` and `/api/auth/dune/link` — {@link installFetchMock}
 * intercepts those so components can render realistic state without a
 * backend.
 */
export function mockAuthClient(state: MockState): FremenAuthClient {
  return {
    useSession() {
      if (state === "loading") {
        return { data: null, isPending: true };
      }
      return {
        data: { user: { id: "u_1", name: "Alice" } },
        isPending: false,
      };
    },
  };
}

type FetchImpl = typeof fetch;

let originalFetch: FetchImpl | undefined;

export function installFetchMock(state: MockState, context = "alice") {
  if (typeof window === "undefined") return;
  if (!originalFetch) originalFetch = window.fetch.bind(window);
  window.fetch = (async (input, init) => {
    const url = typeof input === "string" ? input : (input as Request).url ?? String(input);
    if (url.endsWith("/dune/status")) {
      if (state === "connected") {
        return new Response(
          JSON.stringify({ connected: true, context }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      return new Response(JSON.stringify({ connected: false }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    if (url.endsWith("/dune/link")) {
      // Pretend-redirect — stories surface this via an alert so the visible
      // state doesn't change.
      alert(`[storybook] would redirect to Dune authorize URL`);
      return new Response(
        JSON.stringify({
          url: "https://dune.com/oauth/mcp/authorize?client_id=storybook",
          redirect: false,
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }
    if (url.endsWith("/dune/unlink")) {
      alert("[storybook] would disconnect Dune");
      return new Response(JSON.stringify({ ok: true, unlinked: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return originalFetch!(input, init);
  }) as FetchImpl;
}

export function uninstallFetchMock() {
  if (typeof window === "undefined") return;
  if (originalFetch) {
    window.fetch = originalFetch;
    originalFetch = undefined;
  }
}
