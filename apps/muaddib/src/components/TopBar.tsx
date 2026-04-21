"use client";

import { ConnectDune, DuneConnectionStatus } from "@arrakis/fremen/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useSession, signOut } from "@/lib/auth-client";

export function TopBar() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.refresh();
  };

  return (
    <header className="topbar">
      <Link className="topbar__brand" href="/">
        Muaddib
      </Link>

      <div className="topbar__spacer" />

      {isPending ? (
        <span className="muted">…</span>
      ) : session?.user ? (
        <div className="topbar__user">
          <DuneConnectionStatus />
          <ConnectDune variant="outline" />
          <span className="muted">
            signed in as <strong>{session.user.email}</strong>
          </span>
          <button
            type="button"
            className="topbar__signout"
            onClick={handleSignOut}
          >
            sign out
          </button>
        </div>
      ) : (
        <Link href="/sign-in" className="topbar__signin">
          sign in
        </Link>
      )}
    </header>
  );
}
