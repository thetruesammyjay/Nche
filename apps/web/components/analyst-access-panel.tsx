"use client";

import { FormEvent, useEffect, useState } from "react";

type Analyst = { email: string; name: string; role: string; status: string };

export function AnalystAccessPanel() {
  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  const [form, setForm] = useState({ email: "", name: "", password: "", role: "Analyst" });
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function loadAnalysts() {
    try {
      const response = await fetch("/api/analysts", { cache: "no-store" });
      if (!response.ok) throw new Error("Analyst directory is unavailable.");
      setAnalysts((await response.json()) as Analyst[]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Analyst directory is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAnalysts();
  }, []);

  async function addAnalyst(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/analysts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = (await response.json().catch(() => null)) as Analyst | { detail?: string } | null;
      if (!response.ok) throw new Error(payload && "detail" in payload ? payload.detail : "Could not add analyst.");
      setAnalysts((items) => [...items, payload as Analyst]);
      setForm({ email: "", name: "", password: "", role: "Analyst" });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not add analyst.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="panel analyst-access-panel">
      <div className="panel-heading"><div><p className="eyebrow">Access control</p><h2>Analyst directory</h2></div><span className="provenance-tag is-live">PERSISTENT</span></div>
      <p className="muted">Invite the people who review decisions. Passwords are hashed by the risk service and are never returned to the browser.</p>
      <div className="analyst-list" aria-live="polite">
        {loading ? <p className="muted">Loading analyst access…</p> : analysts.map((analyst) => <div className="analyst-row" key={analyst.email}><span className="workspace-avatar">{analyst.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span><span><strong>{analyst.name}</strong><small>{analyst.email}</small></span><span className="institution-status"><i />{analyst.role}</span></div>)}
      </div>
      <form className="analyst-invite-form" onSubmit={addAnalyst}>
        <p className="eyebrow">Add an analyst</p>
        <div className="analysis-field-grid"><label className="field-label">Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label><label className="field-label">Email<input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" required /></label></div>
        <div className="analysis-field-grid"><label className="field-label">Temporary password<input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} type="password" minLength={8} required /></label><label className="field-label">Role<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}><option>Analyst</option><option>Admin</option></select></label></div>
        {error && <p className="inline-error" role="alert">{error}</p>}
        <button className="outline-control" type="submit" disabled={pending}>{pending ? "Adding analyst…" : "Add analyst"}</button>
      </form>
    </section>
  );
}
