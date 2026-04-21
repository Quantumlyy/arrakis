"use client";

import { DuneConnectionProvider } from "@arrakis/fremen/react";
import type { ReactNode } from "react";

import { authClient } from "@/lib/auth-client";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <DuneConnectionProvider authClient={authClient}>{children}</DuneConnectionProvider>
  );
}
