"use client";

import { useEffect, useState } from "react";
import type { RiskEvaluateResponse } from "@nche/types";

const FALLBACK_EVALUATION: RiskEvaluateResponse = {
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

export function EvaluationEvidencePanel() {
  const [evaluation, setEvaluation] = useState<RiskEvaluateResponse>(FALLBACK_EVALUATION);

  useEffect(() => {
    const stored = window.sessionStorage.getItem("nche:last-evaluation");
    if (!stored) return;
    try {
      setEvaluation(JSON.parse(stored) as RiskEvaluateResponse);
    } catch {
      window.sessionStorage.removeItem("nche:last-evaluation");
    }
  }, []);

  const fallback = evaluation.fallback === true;
  return (
    <aside className="panel evidence-panel live-evidence-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Live API response</p>
          <h2>Evidence object</h2>
        </div>
        <span className={`provenance-tag ${fallback ? "is-fallback" : "is-live"}`}>{fallback ? "LOCAL FALLBACK" : "LIVE EVALUATION"}</span>
      </div>
      <div className="evidence-rows">
        <div><span>Decision</span><strong className={`decision-text decision-${evaluation.decision.toLowerCase()}`}>{evaluation.decision}</strong></div>
        <div><span>Policy rule</span><strong className="mono">{evaluation.policy_rule}</strong></div>
        <div><span>Mode / enforcement</span><strong>{evaluation.mode} · {evaluation.enforced ? "enforced" : "observed"}</strong></div>
        <div><span>Response latency</span><strong>{evaluation.latency_ms ?? 0}ms</strong></div>
        <div><span>Idempotency</span><strong>{evaluation.idempotent_replay ? "replayed safely" : "new evaluation"}</strong></div>
        <div><span>Model version</span><strong className="mono">{evaluation.model_version}</strong></div>
      </div>
      <div className="live-evidence-note">
        <span className="live-evidence-pulse" aria-hidden="true" />
        <p>{fallback ? "The API timed out, so the transfer continued through local institution policy." : "This panel is hydrated from the most recent evaluate_action response."}</p>
      </div>
    </aside>
  );
}
