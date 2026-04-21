/**
 * Dune's OAuth + MCP endpoints. Lifted straight from the docs at
 * https://docs.dune.com/api-reference/agents/mcp so they're easy to audit
 * against the source of truth.
 */
export const DUNE_PROVIDER_ID = "dune";

export const DUNE_OAUTH_AUTHORIZATION_ENDPOINT = "https://dune.com/oauth/mcp/authorize";
export const DUNE_OAUTH_TOKEN_ENDPOINT = "https://dune.com/oauth/mcp/token";
export const DUNE_OAUTH_REGISTRATION_ENDPOINT = "https://dune.com/oauth/mcp/register";
export const DUNE_OAUTH_DISCOVERY_ENDPOINT =
  "https://dune.com/.well-known/oauth-authorization-server/oauth/mcp";

export const DUNE_OAUTH_SCOPE = "mcp:dune:full";
export const DUNE_OAUTH_RESOURCE = "https://api.dune.com";

export const DUNE_MCP_URL = "https://api.dune.com/mcp/v1";

/**
 * Refresh the stored access token if it's within this many milliseconds of
 * expiring. 30 seconds is comfortably larger than a worst-case network
 * round-trip while well inside the documented 5-minute access-token life.
 */
export const REFRESH_BUFFER_MS = 30_000;

export const DEFAULT_CALLBACK_PATH = "/api/auth/oauth2/callback/dune";
