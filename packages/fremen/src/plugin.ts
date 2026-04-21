import type { BetterAuthPlugin } from "better-auth";
import {
  APIError,
  createAuthEndpoint,
  getSessionFromCtx,
  sessionMiddleware,
} from "better-auth/api";
import * as z from "zod";

import {
  DEFAULT_CALLBACK_PATH,
  DUNE_OAUTH_AUTHORIZATION_ENDPOINT,
  DUNE_OAUTH_RESOURCE,
  DUNE_OAUTH_SCOPE,
  DUNE_OAUTH_TOKEN_ENDPOINT,
  DUNE_PROVIDER_ID,
} from "./constants.js";
import {
  duneClientStoreFromAdapter,
  getOrRegisterDuneClient,
  type DuneClientStore,
} from "./dcr.js";
import {
  generateCodeChallenge,
  generateCodeVerifier,
  generateRandomToken,
} from "./pkce.js";
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
 * What the plugin stashes under `plugin.$duneFremen` for other fremen entry
 * points (notably the server-side `getDuneClient`) to read. Not part of the
 * public Better Auth plugin contract.
 */
export interface DuneFremenMeta {
  appName: string;
  redirectURI: string;
  scopes: string[];
  /**
   * Return the DCR'd `client_id` for this deployment's `redirectURI`. Caches
   * the first result in-process. The adapter is only required on the first
   * call; passing it lets the plugin persist to the host's database.
   */
  resolveClientId(adapter?: Parameters<typeof duneClientStoreFromAdapter>[0]): Promise<string>;
}

const STATE_COOKIE = "dune_oauth_link";
const STATE_COOKIE_MAX_AGE = 600; // 10 minutes — authorize+consent should take seconds

const LinkBodySchema = z
  .object({
    callbackURL: z.string().optional(),
    errorCallbackURL: z.string().optional(),
    disableRedirect: z.boolean().optional(),
  })
  .partial();

const CallbackQuerySchema = z.object({
  code: z.string().optional(),
  state: z.string().optional(),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

/**
 * Better Auth plugin that exposes a "Connect Dune" flow: `POST /dune/link` to
 * kick off the OAuth dance, `GET /dune/callback` to finish it,
 * `POST /dune/unlink` to drop the row, and `GET /dune/status` to inspect.
 *
 * The plugin handles DCR, PKCE, and the token exchange directly — Dune's MCP
 * OAuth has no userinfo endpoint, so Better Auth's `genericOAuth` can't cover
 * it.
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
export function duneConnection(
  options: DuneConnectionOptions,
): BetterAuthPlugin & { $duneFremen: DuneFremenMeta } {
  const redirectURI = resolveRedirectURI(options);
  const scopes = options.scopes ?? [DUNE_OAUTH_SCOPE];

  // Lazily cached client_id per redirectURI. The underlying DCR cache is
  // redirectUri-keyed so repeated calls across process restarts hit the
  // store before the registration endpoint.
  let clientIdPromise: Promise<string> | undefined;
  const resolveClientId: DuneFremenMeta["resolveClientId"] = (adapter) => {
    if (!clientIdPromise) {
      const store =
        options.clientStore ??
        (adapter ? duneClientStoreFromAdapter(adapter) : undefined);
      if (!store) {
        return Promise.reject(
          new Error(
            "@arrakis/fremen: no client store available for DCR. Pass `clientStore` in plugin options or call this from an endpoint where `ctx.context.adapter` is available.",
          ),
        );
      }
      clientIdPromise = getOrRegisterDuneClient({
        store,
        redirectUri: redirectURI,
        appName: options.appName,
      }).catch((err) => {
        // Reset on failure so a subsequent attempt can retry DCR.
        clientIdPromise = undefined;
        throw err;
      });
    }
    return clientIdPromise;
  };

  const meta: DuneFremenMeta = {
    appName: options.appName,
    redirectURI,
    scopes,
    resolveClientId,
  };

  return {
    id: "dune-connection",
    schema: duneConnectionSchema,
    $duneFremen: meta,
    endpoints: {
      duneLink: createAuthEndpoint(
        "/dune/link",
        {
          method: "POST",
          body: LinkBodySchema,
          use: [sessionMiddleware],
        },
        async (ctx) => {
          const session = ctx.context.session;
          if (!session?.user?.id) {
            throw new APIError("UNAUTHORIZED", {
              message: "Sign in before connecting Dune.",
            });
          }

          const body = ctx.body ?? {};
          const callbackURL = body.callbackURL ?? ctx.context.baseURL;
          const errorCallbackURL = body.errorCallbackURL ?? callbackURL;

          const clientId = await resolveClientId(ctx.context.adapter);

          const codeVerifier = generateCodeVerifier();
          const codeChallenge = await generateCodeChallenge(codeVerifier);
          const state = generateRandomToken(32);

          const cookiePayload = JSON.stringify({
            state,
            codeVerifier,
            userId: session.user.id,
            callbackURL,
            errorCallbackURL,
          });

          await ctx.setSignedCookie(
            STATE_COOKIE,
            cookiePayload,
            ctx.context.secret,
            {
              maxAge: STATE_COOKIE_MAX_AGE,
              httpOnly: true,
              secure: ctx.context.baseURL.startsWith("https://"),
              sameSite: "lax",
              path: "/",
            },
          );

          const authorize = new URL(DUNE_OAUTH_AUTHORIZATION_ENDPOINT);
          authorize.searchParams.set("response_type", "code");
          authorize.searchParams.set("client_id", clientId);
          authorize.searchParams.set("redirect_uri", redirectURI);
          authorize.searchParams.set("scope", scopes.join(" "));
          authorize.searchParams.set("state", state);
          authorize.searchParams.set("code_challenge", codeChallenge);
          authorize.searchParams.set("code_challenge_method", "S256");
          authorize.searchParams.set("resource", DUNE_OAUTH_RESOURCE);

          const url = authorize.toString();
          return ctx.json({
            url,
            redirect: body.disableRedirect ? false : true,
          });
        },
      ),

      duneCallback: createAuthEndpoint(
        "/dune/callback",
        {
          method: "GET",
          query: CallbackQuerySchema,
        },
        async (ctx) => {
          const raw = await ctx.getSignedCookie(
            STATE_COOKIE,
            ctx.context.secret,
          );
          // Burn the cookie regardless — it's single-use either way.
          ctx.setCookie(STATE_COOKIE, "", { maxAge: 0, path: "/" });

          const errorBase = `${ctx.context.baseURL}/`;
          if (!raw) {
            throw ctx.redirect(
              `${errorBase}?dune_error=state_missing`,
            );
          }

          let parsed: {
            state: string;
            codeVerifier: string;
            userId: string;
            callbackURL: string;
            errorCallbackURL: string;
          };
          try {
            parsed = JSON.parse(raw);
          } catch {
            throw ctx.redirect(`${errorBase}?dune_error=state_invalid`);
          }

          const query = ctx.query;
          if (query.error) {
            throw ctx.redirect(
              `${parsed.errorCallbackURL}?dune_error=${encodeURIComponent(query.error)}`,
            );
          }
          if (!query.code || !query.state || query.state !== parsed.state) {
            throw ctx.redirect(
              `${parsed.errorCallbackURL}?dune_error=state_mismatch`,
            );
          }

          const clientId = await resolveClientId(ctx.context.adapter);

          const tokenBody = new URLSearchParams({
            grant_type: "authorization_code",
            code: query.code,
            redirect_uri: redirectURI,
            client_id: clientId,
            code_verifier: parsed.codeVerifier,
          });
          const tokenResponse = await fetch(DUNE_OAUTH_TOKEN_ENDPOINT, {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: tokenBody.toString(),
          });
          if (!tokenResponse.ok) {
            const text = await tokenResponse.text().catch(() => "");
            ctx.context.logger.error("Dune token exchange failed", {
              status: tokenResponse.status,
              body: text,
            });
            throw ctx.redirect(
              `${parsed.errorCallbackURL}?dune_error=token_exchange_failed`,
            );
          }

          const tokens = (await tokenResponse.json().catch(() => null)) as
            | {
                access_token?: unknown;
                refresh_token?: unknown;
                expires_in?: unknown;
              }
            | null;
          if (
            !tokens ||
            typeof tokens.access_token !== "string" ||
            typeof tokens.refresh_token !== "string" ||
            typeof tokens.expires_in !== "number"
          ) {
            throw ctx.redirect(
              `${parsed.errorCallbackURL}?dune_error=bad_token_response`,
            );
          }

          const accessTokenExpiresAt = new Date(
            Date.now() + tokens.expires_in * 1_000,
          );

          // Dune has no stable per-user identifier (no userinfo endpoint), so
          // we key the account row on the Better Auth user id. That's unique
          // across users within our `providerId: "dune"` namespace, which is
          // all Better Auth needs.
          const accountId = parsed.userId;
          const existing = await ctx.context.internalAdapter.findAccountByProviderId(
            accountId,
            DUNE_PROVIDER_ID,
          );

          const accountData = {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            accessTokenExpiresAt,
            scope: scopes.join(","),
          };

          if (existing) {
            if (existing.userId !== parsed.userId) {
              throw ctx.redirect(
                `${parsed.errorCallbackURL}?dune_error=account_linked_elsewhere`,
              );
            }
            await ctx.context.internalAdapter.updateAccount(
              existing.id,
              accountData,
            );
          } else {
            await ctx.context.internalAdapter.createAccount({
              userId: parsed.userId,
              providerId: DUNE_PROVIDER_ID,
              accountId,
              ...accountData,
            });
          }

          throw ctx.redirect(parsed.callbackURL);
        },
      ),

      duneUnlink: createAuthEndpoint(
        "/dune/unlink",
        {
          method: "POST",
          use: [sessionMiddleware],
        },
        async (ctx) => {
          const session = ctx.context.session;
          if (!session?.user?.id) {
            throw new APIError("UNAUTHORIZED", {
              message: "Sign in before disconnecting Dune.",
            });
          }
          const existing = await ctx.context.internalAdapter.findAccountByProviderId(
            session.user.id,
            DUNE_PROVIDER_ID,
          );
          if (!existing || existing.userId !== session.user.id) {
            return ctx.json({ ok: true, unlinked: false });
          }
          await ctx.context.internalAdapter.deleteAccount(existing.id);
          return ctx.json({ ok: true, unlinked: true });
        },
      ),

      duneStatus: createAuthEndpoint(
        "/dune/status",
        { method: "GET" },
        async (ctx) => {
          const session = await getSessionFromCtx(ctx);
          if (!session?.user?.id) {
            return ctx.json({ connected: false });
          }
          const account = await ctx.context.internalAdapter.findAccountByProviderId(
            session.user.id,
            DUNE_PROVIDER_ID,
          );
          return ctx.json({
            connected: Boolean(account),
            context: account ? (account.accountId ?? undefined) : undefined,
          });
        },
      ),
    },
  };
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
