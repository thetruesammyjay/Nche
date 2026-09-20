"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { DEMO_ANALYST, isSafeRedirect } from "../../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(DEMO_ANALYST.email);
  const [password, setPassword] = useState(DEMO_ANALYST.password);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(body?.detail ?? "Sign-in failed.");
      }
      const next = searchParams.get("next");
      window.dispatchEvent(new Event("nche:route-start"));
      router.replace(isSafeRedirect(next) ? next : "/overview");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Sign-in failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-orbit auth-orbit-one" aria-hidden="true" />
      <div className="auth-orbit auth-orbit-two" aria-hidden="true" />
      <section className="auth-card" aria-labelledby="login-title">
        <Link href="/" className="auth-brand"><Image src="/Nche.png" width={104} height={36} alt="Nche" /></Link>
        <p className="eyebrow">Nche Command</p>
        <h1 id="login-title">Sign in to your risk workspace.</h1>
        <p className="auth-lead">Review sensitive actions across the institutions you monitor.</p>
        <form className="auth-form" onSubmit={signIn}>
          <label className="field-label">Analyst email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required /></label>
          <label className="field-label">Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required /></label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="cyan-button full-width" type="submit" disabled={pending}>{pending ? "Opening workspace…" : "Open Command →"}</button>
        </form>
        <div className="auth-demo-note"><span className="live-evidence-pulse" aria-hidden="true" /><p>Demo access is prefilled. Set <code>NCHE_ANALYST_EMAIL</code> and <code>NCHE_ANALYST_PASSWORD</code> for a deployment-specific analyst.</p></div>
      </section>
    </main>
  );
}
