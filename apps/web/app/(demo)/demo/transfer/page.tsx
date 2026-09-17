"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { RiskEvaluateResponse } from "@nche/types";
import { EvaluationDecision } from "../../../../components/evaluation-decision";
import { apiClient, failOpenEvaluation } from "../../../../lib/api-client";

function takeoverEvents() {
  const start = Date.now();
  return [
    ["new_device_login", 0],
    ["password_reset", 53],
    ["beneficiary_created", 71],
    ["transfer_initiated", 114],
  ].map(([event_name, offset], index) => ({
    event_id: `demo-transfer-${index + 1}`,
    customer_ref: "customer_demo",
    event_name: event_name as "new_device_login" | "password_reset" | "beneficiary_created" | "transfer_initiated",
    channel: "web" as const,
    occurred_at: new Date(start + Number(offset) * 1000).toISOString(),
    amount: event_name === "transfer_initiated" ? 650000 : undefined,
    metadata: event_name === "transfer_initiated" ? { customer_median_amount: 35326 } : undefined,
  }));
}

export default function TransferPage() {
  const [submitted, setSubmitted] = useState(false);
  const [evaluation, setEvaluation] = useState<RiskEvaluateResponse | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const fallback = evaluation?.fallback === true;

  async function submitTransfer() {
    setEvaluating(true);
    setSubmitted(true);
    try {
      const result = await apiClient.evaluateAction(
        { customer_ref: "customer_demo", institution_ref: "apex_mfb", events: takeoverEvents() },
        { mode: "Enforce", idempotencyKey: `demo-transfer-${Date.now()}`, timeoutMs: 50 },
      );
      window.sessionStorage.setItem("nche:last-evaluation", JSON.stringify(result));
      setEvaluation(result);
    } catch {
      const localResult = failOpenEvaluation();
      window.sessionStorage.setItem("nche:last-evaluation", JSON.stringify(localResult));
      setEvaluation(localResult);
    } finally {
      setEvaluating(false);
    }
  }

  return (
    <main className="demo-shell">
      <header className="demo-header">
        <Link href="/demo" className="demo-brand">
          <Image src="/Nche.png" width={104} height={36} alt="Nche" />
          <small>DEMO FINANCIAL APP</small>
        </Link>
        <div className="demo-header-actions">
          <span className="secure-label"><i /> Demo environment</span>
          <Link className="outline-control" href="/overview">Open Command <span aria-hidden="true">↗</span></Link>
        </div>
      </header>

      <div className="transfer-layout">
        <section className="transfer-card">
          <div className="transfer-back"><Link href="/demo">← Back to account</Link><span>1 of 2</span></div>
          {submitted ? (
            <div className="result-state">
              <div className={`result-icon ${fallback ? "is-fallback" : ""}`} aria-hidden="true">{fallback ? "↗" : "!"}</div>
              <p className="eyebrow">{fallback ? "Institution rules active" : "Verification required"}</p>
              <h1>{fallback ? "Your institution can continue this transfer." : "We need to check this transfer."}</h1>
              <p>{fallback ? "Nche did not respond within 50ms, so the transfer was passed to your institution's local rules. No Nche block was applied." : "Nche noticed a new device, a password reset, a first-time recipient, and an unusual amount in one short sequence. Your institution has not submitted the payment."}</p>
              {evaluating ? <EvaluationDecision evaluation={null} loading /> : <EvaluationDecision evaluation={evaluation} />}
              {!evaluating && !fallback && <div className="result-actions"><Link className="cyan-button" href="/investigations/case_4b19">View Nche decision <span aria-hidden="true">↗</span></Link><Link className="text-link" href="/demo">Return to account <span aria-hidden="true">→</span></Link></div>}
              {fallback && <div className="result-actions"><Link className="text-link" href="/demo">Return to account <span aria-hidden="true">→</span></Link></div>}
            </div>
          ) : (
            <>
              <div className="transfer-heading"><p className="eyebrow">Send money</p><h1>New transfer</h1><p className="muted">Tell us who you are paying and how much.</p></div>
              <div className="recipient-card"><span className="recipient-avatar">SO</span><div><strong>Seyi Okafor</strong><small>₦ · Zenith Bank · •••• 1024</small></div><button type="button">Change</button></div>
              <label className="field-label">Amount<input className="amount-input" defaultValue="650000" inputMode="numeric" /><span className="currency-prefix">₦</span></label>
              <label className="field-label">Payment note <span className="optional">Optional</span><input placeholder="What is this for?" /></label>
              <button className="cyan-button full-width" onClick={submitTransfer} disabled={evaluating}>{evaluating ? "Checking transfer…" : "Continue transfer →"}</button>
              <p className="form-note"><span aria-hidden="true">⌁</span> Nche evaluates sensitive actions before your institution completes them.</p>
            </>
          )}
        </section>

        <aside className="transfer-aside">
          <p className="eyebrow">Nche is watching</p>
          <div className="watch-score"><span>Current risk</span><strong>{evaluation?.risk_score ?? 21}</strong><small>{evaluating ? "Evaluating · pending" : fallback ? "Fallback · local rules" : submitted ? `${evaluation?.risk_level ?? "critical"} · ${evaluation?.decision.toLowerCase() ?? "blocked"}` : "Low · allowed so far"}</small></div>
          <div className="watch-line"><span className="watch-dot done" /><span>Login authenticated</span><small>03:12:08</small></div>
          <div className="watch-line"><span className={`watch-dot ${evaluating ? "pending" : submitted ? (fallback ? "pending" : "critical") : "pending"}`} /><span>{evaluating ? "Sending event sequence to policy" : fallback ? "Passed to local institution rules" : submitted ? "Takeover sequence detected" : "Waiting for transfer"}</span><small>{submitted ? (evaluating ? "checking" : "now") : "next event"}</small></div>
          <div className="watch-foot">Decision support by <strong>Nche</strong></div>
        </aside>
      </div>
    </main>
  );
}
