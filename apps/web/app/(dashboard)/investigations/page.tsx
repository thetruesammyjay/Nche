"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { EvaluationSummary } from "@nche/types";
import { PageIntro } from "../../../components/command-ui";

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function age(createdAt: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(createdAt).getTime()) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function InvestigationsPage() {
  const [evaluations, setEvaluations] = useState<EvaluationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadEvaluations() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/evaluations?limit=50", { cache: "no-store" });
      const body = (await response.json().catch(() => null)) as EvaluationSummary[] | { detail?: string } | null;
      if (!response.ok) throw new Error(body && "detail" in body ? body.detail : "The evaluation queue is unavailable.");
      setEvaluations(body as EvaluationSummary[]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The evaluation queue is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadEvaluations(); }, []);

  const investigations = useMemo(() => evaluations.filter((item) => item.risk_score >= 30 && item.case_status !== "RESOLVED"), [evaluations]);
  const criticalCount = investigations.filter((item) => item.risk_score >= 80).length;
  const reviewCount = investigations.filter((item) => item.decision === "REVIEW").length;

  return (
    <div className="dashboard-page">
      <PageIntro eyebrow="Nche Command / Investigations" title="Investigations" description="Cases where the evidence needs a human reading." action={<Link className="cyan-button" href="/evaluation/new">New investigation <span aria-hidden="true">+</span></Link>} />
      <div className="queue-summary"><span><i className="dot block" /> {criticalCount} critical</span><span><i className="dot review" /> {reviewCount} awaiting review</span><span className="summary-spacer" /><span className="muted">{loading ? "Loading evaluations" : "Persisted decision queue"}</span></div>
      {error && <div className="inline-error" role="alert"><span>{error}</span><button className="outline-control small-control" type="button" onClick={() => void loadEvaluations()}>Retry</button></div>}
      <section className="panel case-list">
        <div className="list-heading"><span>Open cases <b>{investigations.length}</b></span><span className="muted">Sorted by newest decision</span></div>
        {loading && <div className="empty-state" aria-live="polite"><span>…</span><h3>Loading decisions</h3><p>Fetching persisted evaluations from Nche.</p></div>}
        {!loading && investigations.length === 0 && <div className="empty-state"><span>✓</span><h3>No open investigations</h3><p>Run a transfer analysis to create an explainable case.</p><Link className="cyan-button" href="/evaluation/new">Run transfer analysis <span aria-hidden="true">→</span></Link></div>}
        {!loading && investigations.map((item) => <Link className="case-list-row" href={`/investigations/${encodeURIComponent(item.evaluation_id)}`} key={item.evaluation_id}><span className="case-severity">{item.risk_score}</span><span className="case-list-copy"><strong>{label(item.primary_reason)}</strong><small className="mono">{item.customer_ref} · {item.evaluation_id}</small></span><span className={`decision-text decision-${item.decision.toLowerCase()}`}>{item.case_status === "IN_REVIEW" ? "IN REVIEW" : item.decision}</span><span className="muted">{age(item.created_at)}</span><span className="row-arrow" aria-hidden="true">→</span></Link>)}
      </section>
    </div>
  );
}
