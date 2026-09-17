"use client";

import type { RiskEvaluateResponse } from "@nche/types";

type EvaluationDecisionProps = {
  evaluation: RiskEvaluateResponse | null;
  loading?: boolean;
};

function formatEvidenceValue(value: number | undefined) {
  return value === undefined ? null : `${value.toFixed(value >= 10 ? 1 : 2)}× median`;
}

export function EvaluationDecision({ evaluation, loading = false }: EvaluationDecisionProps) {
  if (loading) {
    return (
      <section className="evaluation-decision evaluation-loading" aria-live="polite" aria-busy="true">
        <div className="decision-pulse" aria-hidden="true" />
        <div>
          <p className="eyebrow">Nche decision rail</p>
          <strong>Checking the action against live risk policy</strong>
          <p>Waiting for the 50ms evaluation window to complete.</p>
        </div>
      </section>
    );
  }

  if (!evaluation) return null;

  const fallback = evaluation.fallback === true;
  const decisionClass = evaluation.decision.toLowerCase();
  const statusLabel = fallback ? "Local rules" : evaluation.enforced ? "Enforced" : "Observed";

  return (
    <section className={`evaluation-decision decision-${decisionClass} ${fallback ? "is-fallback" : ""}`} aria-live="polite">
      <div className="evaluation-decision-head">
        <div>
          <p className="eyebrow">Nche decision rail</p>
          <h2>{fallback ? "Institution rules continue" : `${evaluation.decision} action`}</h2>
          <p className="evaluation-summary">
            {fallback
              ? "Nche did not answer inside the decision window. The action was passed to local institution rules."
              : evaluation.primary_reason.replaceAll("_", " ")}
          </p>
        </div>
        <div className="evaluation-score" aria-label={`Risk score ${evaluation.risk_score} out of 100`}>
          <strong>{evaluation.risk_score}</strong>
          <span>{evaluation.risk_level}</span>
        </div>
      </div>

      <div className="evaluation-meta" aria-label="Evaluation metadata">
        <span className="evaluation-status">{statusLabel}</span>
        <span>{evaluation.mode} mode</span>
        <span>{evaluation.latency_ms ?? 0}ms response</span>
        {evaluation.idempotent_replay && <span className="evaluation-replay">Idempotent replay</span>}
      </div>

      {evaluation.evidence.length > 0 && (
        <div className="evaluation-evidence">
          <div className="evaluation-evidence-heading">
            <span>Evidence received</span>
            <small>{evaluation.model_version}</small>
          </div>
          {evaluation.evidence.map((item, index) => (
            <div className="evaluation-evidence-row" key={`${item.event}-${index}`}>
              <span className="evaluation-evidence-index">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{item.event.replaceAll("_", " ")}</strong>
                <small>{item.interpretation ?? item.observed ?? "Observed by the risk engine"}</small>
              </div>
              <span className="evaluation-evidence-value">
                {formatEvidenceValue(item.amount_vs_customer_median) ??
                  (item.seconds_after_previous === undefined ? "Signal" : `+${item.seconds_after_previous}s`)}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
