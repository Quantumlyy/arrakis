import * as React from "react";

/**
 * Minimum surface `@arrakis/fremen/react` needs from the host's authClient.
 * Keeping this narrow lets hosts use their own Better Auth client instance
 * without us importing `better-auth/client` at build time.
 */
export interface FremenAuthClient {
  useSession(): {
    data: {
      user?: {
        id: string;
        name?: string | null;
        accounts?: Array<{
          providerId: string;
          accountId?: string;
          username?: string | null;
        }>;
      } | null;
    } | null;
    isPending: boolean;
  };
  oauth2: {
    link(args: {
      providerId: string;
      callbackURL?: string;
    }): Promise<unknown> | unknown;
    unlink(args: { providerId: string }): Promise<unknown> | unknown;
  };
}

export interface DuneConnectionContextValue {
  authClient: FremenAuthClient;
  /** Provider id to match against `user.accounts[].providerId`. */
  providerId: string;
  /** Fallback callback URL for `oauth2.link` when hosts don't pass one. */
  defaultCallbackURL?: string;
}

const DuneConnectionContext = React.createContext<
  DuneConnectionContextValue | undefined
>(undefined);

export interface DuneConnectionProviderProps {
  authClient: FremenAuthClient;
  providerId?: string;
  defaultCallbackURL?: string;
  children: React.ReactNode;
}

/**
 * Wrap your app tree once with the host's Better Auth client instance; every
 * `@arrakis/fremen/react` component reads it from context.
 *
 * @example
 * ```tsx
 * import { authClient } from "@/lib/auth-client";
 * import { DuneConnectionProvider } from "@arrakis/fremen/react";
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <DuneConnectionProvider authClient={authClient}>
 *       {children}
 *     </DuneConnectionProvider>
 *   );
 * }
 * ```
 */
export function DuneConnectionProvider({
  authClient,
  providerId = "dune",
  defaultCallbackURL,
  children,
}: DuneConnectionProviderProps): React.ReactElement {
  const value = React.useMemo<DuneConnectionContextValue>(
    () => ({ authClient, providerId, defaultCallbackURL }),
    [authClient, providerId, defaultCallbackURL],
  );
  return (
    <DuneConnectionContext.Provider value={value}>
      {children}
    </DuneConnectionContext.Provider>
  );
}

/**
 * Read the ambient `DuneConnectionContext`. Throws a helpful error when
 * called outside of a `<DuneConnectionProvider>` so mis-wired trees are
 * caught during development.
 */
export function useDuneConnectionContext(): DuneConnectionContextValue {
  const value = React.useContext(DuneConnectionContext);
  if (!value) {
    throw new Error(
      "@arrakis/fremen/react: wrap your app in <DuneConnectionProvider authClient={...}> before using hooks or components.",
    );
  }
  return value;
}
