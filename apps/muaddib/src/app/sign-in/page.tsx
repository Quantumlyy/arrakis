"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { signIn, signUp } from "@/lib/auth-client";

type Mode = "sign-in" | "sign-up";

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setPending(true);
    try {
      if (mode === "sign-up") {
        const result = await signUp.email({
          email,
          password,
          name: name || email.split("@")[0]!,
        });
        if (result.error) throw new Error(result.error.message ?? "Sign-up failed");
      } else {
        const result = await signIn.email({ email, password });
        if (result.error) throw new Error(result.error.message ?? "Sign-in failed");
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <main>
      <section className="hero">
        <h1>{mode === "sign-in" ? "Sign in" : "Create an account"}</h1>
        <p className="muted">
          Muaddib uses email + password auth; your Dune account connects as an
          optional link afterwards.
        </p>
      </section>

      <form className="card auth-form" onSubmit={handleSubmit}>
        {mode === "sign-up" ? (
          <label className="field">
            <span>Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              disabled={pending}
            />
          </label>
        ) : null}

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            disabled={pending}
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            required
            minLength={8}
            disabled={pending}
          />
        </label>

        {error ? (
          <p className="banner banner--danger" style={{ margin: 0 }}>
            {error}
          </p>
        ) : null}

        <div className="auth-form__actions">
          <button type="submit" className="btn btn--primary" disabled={pending}>
            {pending
              ? "…"
              : mode === "sign-in"
                ? "Sign in"
                : "Create account"}
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
          >
            {mode === "sign-in"
              ? "Need an account? Create one"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </form>
    </main>
  );
}
