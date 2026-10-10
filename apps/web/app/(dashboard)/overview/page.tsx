"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DecisionBadge, EventTimeline, RiskScore } from "@nche/ui";
import type { EvaluationSummary, RiskEvaluateResponse } from "@nche/types";
import { DecisionLegend, MetricCard } from "../../../components/command-ui";

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function timelineFor(evaluation: RiskEvaluateResponse) {
  let elapsed = 0;
  return evaluation.evidence.map((item) => {
    elapsed += item.seconds_after_previous ?? 0;
    const warning = item.event === "password_reset" || item.event === "pin_change" || item.event === "beneficiary_created";
    return {
      time: `+${elapsed}s`,
      channel: evaluation.institution_ref?.toUpperCase() ?? "API",
      event: label(item.event),
      detail: item.interpretation ?? item.observed ?? "Observed by the risk engine",
      tone: item.event === "transfer_initiated" ? "critical" as const : warning ? "warning" as const : "neutral" as const,
    };
  });
}

export default function OverviewPage() {
  const [evaluations, setEvaluations] = useState<EvaluationSummary[]>([]);
  const [latestDetail, setLatestDetail] = useState<RiskEvaluateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/evaluations?limit=100", { cache: "no-store" })
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as EvaluationSummary[] | { detail?: string } | null;
        if (!response.ok) throw new Error(body && "detail" in body ? body.detail : "The evaluation index is unavailable.");
        return body as EvaluationSummary[];
      })
      .then(async (items) => {
        if (!active) return;
        setEvaluations(items);
        const latest = [...items].sort((left, right) => right.risk_score - left.risk_score)[0];
        if (!latest) return;
        const detail = await fetch(`/api/evaluations/${encodeURIComponent(latest.evaluation_id)}`, { cache: "no-store" });
        if (detail.ok && active) setLatestDetail((await detail.json()) as RiskEvaluateResponse);
      })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "The evaluation index is unavailable."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const latest = useMemo(() => [...evaluations].sort((left, right) => right.risk_score - left.risk_score)[0], [evaluations]);
  const open = evaluations.filter((item) => item.risk_score >= 30).length;
  const critical = evaluations.filter((item) => item.risk_score >= 80).length;
  const decisions = evaluations.reduce<Record<string, number>>((counts, item) => { counts[item.decision] = (counts[item.decision] ?? 0) + 1; return counts; }, {});
  const total = evaluations.length;
  const percent = (decision: string) => total ? `${(((decisions[decision] ?? 0) / total) * 100).toFixed(1)}%` : "—";

  return <div className="dashboard-page">
    <div className="page-intro"><div><p className="eyebrow">Nche Command / Overview</p><h1>Good morning, analyst.</h1><p className="page-description">A live view of persisted Nche evaluations. Run a transfer analysis to populate this workspace.</p></div><div className="page-intro-action"><span className="outline-control">Live evaluation index</span><Link className="cyan-button" href="/evaluation/new">Run analysis <span aria-hidden="true">↗</span></Link></div></div>
    {error && <div className="inline-error" role="alert">{error}</div>}
    <section className="metric-grid"><MetricCard label="Open investigations" value={loading ? "…" : String(open)} detail="Risk score 30+" /><MetricCard label="Decisions indexed" value={loading ? "…" : String(total)} detail="Persisted evaluations" trend={total ? "Live" : undefined} tone="cyan" /><MetricCard label="False-positive estimate" value="—" detail="Needs labelled holdout data" /><MetricCard label="Critical alerts" value={loading ? "…" : String(critical)} detail="Risk score 80+" tone="critical" /></section>
    <section className="dashboard-grid"><article className="panel critical-panel"><div className="panel-heading"><div><p className="eyebrow">Latest high-risk evaluation</p><h2>{latest ? label(latest.primary_reason) : "No evaluations yet"}</h2></div>{latest && <DecisionBadge decision={latest.decision} />}</div>{latest ? <><div className="case-intro"><RiskScore score={latest.risk_score} decision={latest.decision} level={latest.risk_level} /><div><p className="case-copy">{latest.customer_ref} · {latest.institution_ref ?? "Institution not specified"}</p><p className="muted mono">{latest.evaluation_id} · {latest.model_version}</p></div></div>{latestDetail && <EventTimeline events={timelineFor(latestDetail)} />}<div className="panel-footer"><Link className="cyan-button" href={`/investigations/${encodeURIComponent(latest.evaluation_id)}`}>Open investigation <span aria-hidden="true">↗</span></Link><Link className="text-link" href="/alerts">View alert queue <span aria-hidden="true">→</span></Link></div></> : <div className="empty-state"><span aria-hidden="true">→</span><h3>Ready for the first decision</h3><p>Build a transfer analysis to see the evidence sequence here.</p><Link className="cyan-button" href="/evaluation/new">Run transfer analysis <span aria-hidden="true">→</span></Link></div>}</article><aside className="panel distribution-panel"><div className="panel-heading"><div><p className="eyebrow">Decision distribution</p><h2>Indexed evaluations</h2></div><span className="muted mono">{total} total</span></div><div className="distribution-list"><div><span><i className="dot allow" />Allow</span><strong>{decisions.ALLOW ?? 0} <small>{percent("ALLOW")}</small></strong></div><div><span><i className="dot challenge" />Challenge</span><strong>{decisions.CHALLENGE ?? 0} <small>{percent("CHALLENGE")}</small></strong></div><div><span><i className="dot review" />Review</span><strong>{decisions.REVIEW ?? 0} <small>{percent("REVIEW")}</small></strong></div><div><span><i className="dot block" />Block</span><strong>{decisions.BLOCK ?? 0} <small>{percent("BLOCK")}</small></strong></div></div><p className="table-note">Counts are calculated from the persisted evaluation index.</p></aside></section>
    <section className="lower-grid"><article className="panel chart-panel"><div className="panel-heading"><div><p className="eyebrow">Evaluation coverage</p><h2>Decision feed</h2></div><DecisionLegend /></div><div className="chart-empty"><strong>{total ? `${total} persisted evaluations available` : "No persisted evaluations"}</strong><span>{total ? "Use Alerts or Investigations to review each decision." : "The feed starts when the first analysis completes."}</span></div></article><article className="panel system-panel"><div className="panel-heading"><div><p className="eyebrow">System status</p><h2>{error ? "Needs attention" : "Connected"}</h2></div><span className={`operational-dot ${error ? "is-warning" : ""}`} /></div><div className="system-list"><div><span>Risk API</span><strong>{error ? "Unavailable" : "Connected"}</strong></div><div><span>Evaluation index</span><strong>{total} <small>records</small></strong></div><div><span>SIM intelligence</span><strong>SIMULATED <small>provenance</small></strong></div><div><span>Model version</span><strong className="mono">{latest?.model_version ?? "—"}</strong></div></div><Link href="/settings" className="text-link">View system settings <span aria-hidden="true">→</span></Link></article></section>
  </div>;
}
