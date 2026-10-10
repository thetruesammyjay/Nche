"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Decision, EvaluationSummary } from "@nche/types";
import { DecisionBadge, RiskScore } from "@nche/ui";

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function age(createdAt: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(createdAt).getTime()) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`;
}

export function AlertQueue() {
  const [evaluations, setEvaluations] = useState<EvaluationSummary[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | Decision>("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAlerts() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/evaluations?limit=100", { cache: "no-store" });
      const body = (await response.json().catch(() => null)) as EvaluationSummary[] | { detail?: string } | null;
      if (!response.ok) throw new Error(body && "detail" in body ? body.detail : "The alert queue is unavailable.");
      setEvaluations((body as EvaluationSummary[]).filter((item) => item.risk_score >= 30));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The alert queue is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadAlerts(); }, []);

  const filtered = useMemo(() => evaluations.filter((alert) => (
    (filter === "All" || alert.decision === filter) &&
    `${alert.customer_ref} ${alert.primary_reason} ${alert.evaluation_id}`.toLowerCase().includes(query.toLowerCase())
  )), [evaluations, filter, query]);

  return <div className="alert-queue">
    <div className="queue-toolbar"><div className="search-field"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search alerts, customers, or IDs" /></div><div className="filter-pills">{(["All", "BLOCK", "REVIEW", "CHALLENGE"] as const).map((item) => <button className={filter === item ? "selected" : ""} key={item} type="button" onClick={() => setFilter(item)}>{item === "All" ? "All alerts" : item}</button>)}</div></div>
    {error && <div className="inline-error" role="alert"><span>{error}</span><button className="outline-control small-control" type="button" onClick={() => void loadAlerts()}>Retry</button></div>}
    <div className="alert-table-wrap"><table className="alert-table"><thead><tr><th>Evaluation</th><th>Customer</th><th>Channel</th><th>Risk</th><th>Decision</th><th>Primary reason</th><th>Age</th><th>Status</th></tr></thead><tbody>{filtered.map((alert) => <tr key={alert.evaluation_id}><td><Link href={`/investigations/${encodeURIComponent(alert.evaluation_id)}`} className="table-link mono">{alert.evaluation_id}</Link></td><td className="mono customer-ref">{alert.customer_ref}</td><td><span className="channel-chip">API</span></td><td><RiskScore score={alert.risk_score} decision={alert.decision} level={alert.risk_level} compact /></td><td><DecisionBadge decision={alert.decision} /></td><td>{label(alert.primary_reason)}</td><td className="muted">{age(alert.created_at)}</td><td><span className={`status-label status-${alert.case_status.toLowerCase()}`}>{label(alert.case_status)}</span></td></tr>)}</tbody></table>{!loading && filtered.length === 0 && <div className="empty-state"><span aria-hidden="true">⌕</span><h3>No alerts found</h3><p>{evaluations.length === 0 ? "Run a transfer analysis to create an alert." : "Try a different customer reference, reason, or decision filter."}</p></div>}{loading && <div className="empty-state" aria-live="polite"><span>…</span><h3>Loading alerts</h3><p>Fetching persisted evaluations from Nche.</p></div>}</div><div className="queue-footer"><span>Showing {filtered.length} of {evaluations.length} alerts</span><Link className="ghost-button" href="/evaluation/new">Run new analysis →</Link></div>
  </div>;
}
