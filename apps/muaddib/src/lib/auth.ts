import { duneConnection } from "@arrakis/fremen";
import { betterAuth } from "better-auth";

import { db } from "./db";

const baseURL =
  process.env.BETTER_AUTH_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

// Build-time pages need to import `auth` without a runtime secret; warn
// loudly but don't throw so `next build` can collect page data. At request
// time Better Auth will fail fast if the secret is missing.
const secret =
  process.env.BETTER_AUTH_SECRET ?? "dev-only-insecure-secret-please-change";
if (
  process.env.NODE_ENV === "production" &&
  !process.env.BETTER_AUTH_SECRET &&
  process.env.NEXT_PHASE !== "phase-production-build"
) {
  console.warn(
    "[muaddib] BETTER_AUTH_SECRET is not set in production — sessions will not survive restarts.",
  );
}

export const auth = betterAuth({
  baseURL,
  secret,
  database: db,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  plugins: [
    duneConnection({
      appName: "Muaddib (Arrakis demo)",
      baseURL,
    }),
  ],
});
