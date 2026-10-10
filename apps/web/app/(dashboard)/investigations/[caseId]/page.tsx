"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { EventTimeline } from "@nche/ui";
import type { AuditEntry, CaseStatus, EvaluationCase, RiskEvaluateResponse } from "@nche/types";
import { EvaluationEvidencePanel } from "../../../../components/evaluation-evidence";
import { InvestigationHero } from "../../../../components/command-ui";

const LEGACY_DEMO_EVALUATION: RiskEvaluateResponse = {
  evaluation_id: "case_4b19",
  decision: "BLOCK",
  risk_score: 90,
  risk_level: "critical",
  recommended_action: "block",
  policy_rule: "ATO_CRITICAL_001",
  primary_reason: "account_takeover_sequence",
  evidence: [
    { event: "new_device_login", seconds_after_previous: 0, observed: "First seen device", interpretation: "New device for this customer" },
    { event: "password_reset", seconds_after_previous: 53, observed: "Credential changed", interpretation: "Credential reset followed login" },
    { event: "beneficiary_created", seconds_after_previous: 18, observed: "First-time recipient", interpretation: "New beneficiary added" },
    { event: "transfer_initiated", seconds_after_previous: 43, amount_vs_customer_median: 18.4, observed: "₦650,000", interpretation: "Amount is far above customer median" },
  ],
  model_version: "nche-risk-v0.2.0",
  created_at: new Date(0).toISOString(),
  mode: "Enforce",
  enforced: true,
  idempotent_replay: false,
  latency_ms: 18,
};

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function timelineFor(evaluation: RiskEvaluateResponse) {
  let elapsed = 0;
  return evaluation.evidence.map((item) => {
    elapsed += item.seconds_after_previous ?? 0;
    const transfer = item.event === "transfer_initiated";
    const warning = item.event === "password_reset" || item.event === "pin_change" || item.event === "beneficiary_created";
    return {
      time: `+${elapsed}s`,
      channel: evaluation.institution_ref?.toUpperCase() ?? "API",
      event: label(item.event),
      detail: item.interpretation ?? item.observed ?? "Observed by the risk engine",
      tone: transfer || (evaluation.risk_level === "critical" && item === evaluation.evidence.at(-1)) ? "critical" as const : warning ? "warning" as const : "neutral" as const,
    };
  });
}

export default function InvestigationPage({ params }: { params: Promise<{ caseId: string }> }) {
  const [evaluation, setEvaluation] = useState<RiskEvaluateResponse | null>(null);
  const [caseState, setCaseState] = useState<EvaluationCase | null>(null);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [analystEmail, setAnalystEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [caseLoading, setCaseLoading] = useState(false);
  const [caseSaving, setCaseSaving] = useState(false);
  const [caseMessage, setCaseMessage] = useState("");
  const [error, setError] = useState("");
  const { caseId } = use(params);

  useEffect(() => {
    let active = true;
    fetch(`/api/evaluations/${encodeURIComponent(caseId)}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(response.status === 404 ? "This evaluation is no longer available." : "The evaluation service is unavailable.");
        return (await response.json()) as RiskEvaluateResponse;
      })
      .then((result) => { if (active) setEvaluation(result); })
      .catch((reason) => {
        if (!active) return;
        if (caseId === LEGACY_DEMO_EVALUATION.evaluation_id) setEvaluation(LEGACY_DEMO_EVALUATION);
        else setError(reason instanceof Error ? reason.message : "The evaluation service is unavailable.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [caseId]);

  useEffect(() => {
    if (!evaluation) return;
    let active = true;
    setCaseLoading(true);
    Promise.all([
      fetch("/api/auth/session", { cache: "no-store" }).then((response) => response.ok ? response.json() : null),
      fetch(`/api/evaluations/${encodeURIComponent(evaluation.evaluation_id)}/case`, { cache: "no-store" }).then(async (response) => {
        if (!response.ok) throw new Error("Case state is unavailable.");
        return (await response.json()) as EvaluationCase;
      }),
      fetch(`/api/evaluations/${encodeURIComponent(evaluation.evaluation_id)}/audit`, { cache: "no-store" }).then(async (response) => {
        if (!response.ok) return [] as AuditEntry[];
        return (await response.json()) as AuditEntry[];
      }).catch(() => [] as AuditEntry[]),
    ])
      .then(([session, state, audit]) => {
        if (!active) return;
        setAnalystEmail(session?.analyst?.email ?? "");
        setCaseState(state);
        setAuditEntries(audit);
      })
      .catch(() => {
        if (!active) return;
        setCaseState({ evaluation_id: evaluation.evaluation_id, status: "NEW", updated_at: evaluation.created_at });
        setAuditEntries([]);
        setCaseMessage("Case workflow is unavailable. The evaluation remains viewable.");
      })
      .finally(() => { if (active) setCaseLoading(false); });
    return () => { active = false; };
  }, [evaluation]);

  async function updateCase(status: CaseStatus) {
    if (!evaluation || caseSaving) return;
    setCaseSaving(true);
    setCaseMessage("");
    const assignedTo = status === "NEW" ? null : ((caseState?.assigned_to ?? analystEmail) || null);
    try {
      const response = await fetch(`/api/evaluations/${encodeURIComponent(evaluation.evaluation_id)}/case`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status, assigned_to: assignedTo }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail ?? "Could not update this case.");
      setCaseState(payload as EvaluationCase);
      setAuditEntries((entries) => [{
        id: Date.now(),
        action: "case_updated",
        actor_ref: analystEmail || null,
        institution_ref: evaluation.institution_ref,
        evaluation_id: evaluation.evaluation_id,
        request_id: null,
        occurred_at: new Date().toISOString(),
        metadata: { status, assigned_to: assignedTo },
      }, ...entries]);
      setCaseMessage(status === "RESOLVED" ? "Case marked as resolved." : "Case assigned to you.");
    } catch (reason) {
      setCaseMessage(reason instanceof Error ? reason.message : "Could not update this case.");
    } finally {
      setCaseSaving(false);
    }
  }

  const timeline = useMemo(() => (evaluation ? timelineFor(evaluation) : []), [evaluation]);

  if (loading) {
    return <div className="dashboard-page"><div className="panel analysis-empty" aria-live="polite" aria-busy="true"><span className="analysis-empty-mark">…</span><h2>Loading evaluation evidence</h2><p>Fetching the persisted decision from Nche.</p></div></div>;
  }

  if (!evaluation) {
    return <div className="dashboard-page"><div className="panel analysis-empty"><span className="analysis-empty-mark">!</span><h2>Evaluation unavailable</h2><p>{error || "This evaluation could not be loaded."}</p><Link href="/investigations" className="cyan-button">Back to investigations <span aria-hidden="true">→</span></Link></div></div>;
  }

  const title = evaluation.primary_reason === "account_takeover_sequence" ? "Account takeover sequence detected" : `${label(evaluation.primary_reason)} detected`;
  const description = evaluation.primary_reason === "account_takeover_sequence"
    ? "Nche connected the event sequence before the institution completed the sensitive action."
    : `Nche returned a ${evaluation.risk_level} recommendation with ${evaluation.evidence.length} supporting signals.`;

  return (
    <div className="dashboard-page">
      <div className="case-breadcrumb"><Link href="/investigations">Investigations</Link><span>/</span><strong>{evaluation.evaluation_id}</strong></div>
      <InvestigationHero score={evaluation.risk_score} decision={evaluation.decision} level={evaluation.risk_level} title={title} description={description} evaluationId={evaluation.evaluation_id} modelVersion={evaluation.model_version} primaryReason={evaluation.primary_reason} institutionRef={evaluation.institution_ref} />
      <div className="investigation-grid">
        <article className="panel evidence-panel">
          <div className="panel-heading"><div><p className="eyebrow">Observed sequence</p><h2>What changed, in order</h2></div><span className={`provenance-tag ${evaluation.fallback ? "is-fallback" : "is-live"}`}>{evaluation.fallback ? "LOCAL RULES" : "PERSISTED EVALUATION"}</span></div>
          <EventTimeline events={timeline} />
        </article>
        <EvaluationEvidencePanel initialEvaluation={evaluation} />
      </div>
      <section className="panel case-audit-panel">
        <div className="panel-heading"><div><p className="eyebrow">Traceability</p><h2>Decision activity</h2></div><span className="muted">{auditEntries.length} recorded events</span></div>
        {auditEntries.length === 0 ? <p className="empty-inline">No audit events are available for this evaluation yet.</p> : <div className="case-audit-list">{auditEntries.map((entry) => <div className="case-audit-row" key={`${entry.id}-${entry.occurred_at}`}><span className="audit-dot" /><span><strong>{label(entry.action)}</strong><small>{entry.actor_ref ?? "System"} · {new Date(entry.occurred_at).toLocaleString()}</small></span><span className="mono audit-request">{entry.request_id ?? "local trace"}</span></div>)}</div>}
      </section>
      <div className="case-actions">
        <div className="case-state" aria-live="polite">
          <span className={`case-status case-status-${(caseState?.status ?? "NEW").toLowerCase()}`}>{caseLoading ? "Loading case" : label(caseState?.status ?? "NEW")}</span>
          <span>{caseState?.assigned_to ? `Assigned to ${caseState.assigned_to}` : "Unassigned"}</span>
          {caseMessage && <span className="case-message">{caseMessage}</span>}
        </div>
        <div className="case-action-buttons">
          <button type="button" className="outline-control" disabled={caseLoading || caseSaving || caseState?.status === "IN_REVIEW" || caseState?.status === "RESOLVED"} onClick={() => updateCase("IN_REVIEW")}>{caseSaving ? "Saving…" : "Assign to me"}</button>
          <button type="button" className="outline-control" disabled={caseLoading || caseSaving || caseState?.status === "RESOLVED"} onClick={() => updateCase("RESOLVED")}>Mark as resolved</button>
        </div>
        <Link href="/alerts" className="text-link">Back to alert queue <span aria-hidden="true">←</span></Link>
      </div>
    </div>
  );
}
