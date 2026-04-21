/**
 * Better Auth schema fragment shipped with the plugin. When the host runs
 * `better-auth migrate` (or equivalent), this becomes a `duneOAuthClient`
 * table storing DCR results keyed by `redirectUri`.
 *
 * The schema uses Better Auth's `AuthPluginSchema` shape so the host's
 * Drizzle / Prisma / Kysely adapter generates the right migration.
 */
export const duneConnectionSchema = {
  duneOAuthClient: {
    fields: {
      clientId: { type: "string", required: true, unique: true },
      redirectUri: { type: "string", required: true, unique: true },
      appName: { type: "string", required: true },
      createdAt: { type: "date", required: true },
    },
  },
} as const;

export type DuneOAuthClientRow = {
  id: string;
  clientId: string;
  redirectUri: string;
  appName: string;
  createdAt: Date;
};
