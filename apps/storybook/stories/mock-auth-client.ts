import type { FremenAuthClient } from "@arrakis/fremen/react";

export type MockState = "disconnected" | "connected" | "loading";

export function mockAuthClient(state: MockState, context = "alice"): FremenAuthClient {
  return {
    useSession() {
      if (state === "loading") {
        return { data: null, isPending: true };
      }
      if (state === "disconnected") {
        return {
          data: { user: { id: "u_1", name: "Alice", accounts: [] } },
          isPending: false,
        };
      }
      return {
        data: {
          user: {
            id: "u_1",
            name: "Alice",
            accounts: [
              { providerId: "dune", accountId: "d_123", username: context },
            ],
          },
        },
        isPending: false,
      };
    },
    oauth2: {
      link: async ({ callbackURL }) => {
        alert(`[storybook] would redirect to Dune authorize; callback=${callbackURL}`);
      },
    },
    unlinkAccount: async () => {
      alert("[storybook] would call authClient.unlinkAccount({ providerId: 'dune' })");
    },
  };
}
