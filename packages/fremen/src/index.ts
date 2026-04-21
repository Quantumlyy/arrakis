export {
  duneConnection,
  type DuneConnectionOptions,
  type DuneFremenMeta,
} from "./plugin.js";
export {
  getDuneClient,
  getDuneClientWithStore,
  type GetDuneClientOptions,
  type GetDuneClientWithStoreOptions,
  type AccountStore,
  type BetterAuthLike,
  type DuneConnectedAccount,
} from "./server.js";
export {
  getOrRegisterDuneClient,
  duneClientStoreFromAdapter,
  type DuneClientStore,
  type GetOrRegisterOptions,
} from "./dcr.js";
export {
  refreshIfNeeded,
  type DuneAccountTokens,
  type RefreshIfNeededOptions,
  type RefreshedTokens,
} from "./refresh.js";
export { duneConnectionSchema, type DuneOAuthClientRow } from "./schema.js";
export {
  DuneFremenError,
  DuneNotConnectedError,
  DuneRegistrationError,
  DuneRefreshError,
} from "./errors.js";
export {
  DUNE_PROVIDER_ID,
  DUNE_MCP_URL,
  DUNE_OAUTH_SCOPE,
  DUNE_OAUTH_RESOURCE,
  DUNE_OAUTH_AUTHORIZATION_ENDPOINT,
  DUNE_OAUTH_TOKEN_ENDPOINT,
  DUNE_OAUTH_REGISTRATION_ENDPOINT,
  DUNE_OAUTH_DISCOVERY_ENDPOINT,
  DEFAULT_CALLBACK_PATH,
  REFRESH_BUFFER_MS,
} from "./constants.js";
