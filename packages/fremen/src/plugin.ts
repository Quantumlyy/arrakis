import { genericOAuth } from "better-auth/plugins";
import type { BetterAuthPlugin } from "better-auth";

import {
  DEFAULT_CALLBACK_PATH,
  DUNE_OAUTH_AUTHORIZATION_ENDPOINT,
  DUNE_OAUTH_RESOURCE,
  DUNE_OAUTH_SCOPE,
  DUNE_OAUTH_TOKEN_ENDPOINT,
  DUNE_PROVIDER_ID,
} from "./constants.js";
import { getOrRegisterDuneClient, type DuneClientStore } from "./dcr.js";
import { duneConnectionSchema } from "./schema.js";

/**
 * Options for the `duneConnection` plugin factory.
 */
export interface DuneConnectionOptions {
  /**
   * Human-readable app name sent to Dune's DCR endpoint. Appears to users
   * when they approve the connection.
   */
  appName: string;
  /**
   * Fully-qualified callback URL Dune will redirect back to after consent.
   * Must be stable per deployment — DCR uniqueness is keyed on this value.
   *
   * If omitted, defaults to `${baseURL}${DEFAULT_CALLBACK_PATH}` at request
   * time via the provided `baseURL`.
   */
  redirectURI?: string;
  /**
   * Base URL of the host app — used to compute `redirectURI` when
   * `redirectURI` isn't set. Usually the same as Better Auth's `baseURL`.
   */
  baseURL?: string;
  /**
   * Adapter over the host's database for the `duneOAuthClient` table. In
   * normal usage the plugin builds this from Better Auth's own adapter; you
   * only need to pass one when hand-wiring the plugin in tests.
   */
  clientStore?: DuneClientStore;
  /**
   * Scopes to request. Defaults to `["mcp:dune:full"]`. Reserved for future
   * fine-grained Dune scopes.
   */
  scopes?: string[];
}

/**
 * Better Auth plugin that wires in a "Connect Dune" OAuth flow. Under the
 * hood it delegates to `genericOAuth` for the code + PKCE dance and layers
 * on Dynamic Client Registration + a shipped `duneOAuthClient` schema
 * fragment.
 *
 * @example
 * ```ts
 * import { betterAuth } from "better-auth";
 * import { duneConnection } from "@arrakis/fremen";
 *
 * export const auth = betterAuth({
 *   database: ...,
 *   plugins: [duneConnection({ appName: "My App", baseURL: "https://example.com" })],
 * });
 * ```
 */
export function duneConnection(options: DuneConnectionOptions): BetterAuthPlugin {
  const redirectURI = resolveRedirectURI(options);
  const scopes = options.scopes ?? [DUNE_OAUTH_SCOPE];

  // Lazily cached client_id per redirectURI. The real Better Auth wiring
  // also persists it in the `duneOAuthClient` table via the adapter, but
  // keeping the in-process cache here avoids a DB hit on every authorize.
  let clientIdPromise: Promise<string> | undefined;
  const resolveClientId = (store: DuneClientStore | undefined): Promise<string> => {
    if (!clientIdPromise) {
      clientIdPromise = (async () => {
        if (!store) {
          throw new Error(
            "@arrakis/fremen: no client store available for DCR. Pass `clientStore` in plugin options or use the bundled Better Auth adapter.",
          );
        }
        return getOrRegisterDuneClient({
          store,
          redirectUri: redirectURI,
          appName: options.appName,
        });
      })();
    }
    return clientIdPromise;
  };

  const oauth = genericOAuth({
    config: [
      {
        providerId: DUNE_PROVIDER_ID,
        // client_id is resolved lazily via DCR. Better Auth forwards the
        // value to the authorize URL and the token-exchange request.
        clientId: "__arrakis_fremen_deferred__",
        // Dune uses `token_endpoint_auth_method: "none"` (public client +
        // PKCE), so no clientSecret is sent.
        clientSecret: "",
        authorizationUrl: DUNE_OAUTH_AUTHORIZATION_ENDPOINT,
        tokenUrl: DUNE_OAUTH_TOKEN_ENDPOINT,
        scopes,
        pkce: true,
        authorizationUrlParams: {
          resource: DUNE_OAUTH_RESOURCE,
        },
      },
    ],
  });

  const extensions = {
    $duneFremen: {
      resolveClientId,
      redirectURI,
      appName: options.appName,
    },
  } as const;

  // Layer our identity + schema on top of the genericOAuth plugin so host
  // apps only need to install one plugin. Order matters: spread first,
  // then override.
  return {
    ...oauth,
    id: "dune-connection",
    schema: duneConnectionSchema,
    ...extensions,
  } as BetterAuthPlugin & typeof extensions;
}

function resolveRedirectURI(options: DuneConnectionOptions): string {
  if (options.redirectURI) return options.redirectURI;
  if (!options.baseURL) {
    throw new Error(
      "@arrakis/fremen: pass either `redirectURI` or `baseURL` to duneConnection().",
    );
  }
  const base = options.baseURL.replace(/\/$/, "");
  return `${base}${DEFAULT_CALLBACK_PATH}`;
}
