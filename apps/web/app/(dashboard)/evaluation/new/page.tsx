"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { EventChannel, Institution, RiskEvaluateResponse, RiskEvaluateRequest } from "@nche/types";
import { EvaluationDecision } from "../../../../components/evaluation-decision";
import { PageIntro } from "../../../../components/command-ui";
import { apiClient, failOpenEvaluation } from "../../../../lib/api-client";

const steps = [
  { event_name: "new_device_login" as const, label: "New device login", detail: "First device seen for the customer", offset: 0 },
  { event_name: "password_reset" as const, label: "Password reset", detail: "Credential changed after access", offset: 53 },
  { event_name: "beneficiary_created" as const, label: "New beneficiary", detail: "First-time recipient added", offset: 71 },
  { event_name: "transfer_initiated" as const, label: "Transfer initiated", detail: "Sensitive action submitted", offset: 114 },
];

export default function NewEvaluationPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [institutionRef, setInstitutionRef] = useState("");
  const [customerRef, setCustomerRef] = useState("customer_demo");
  const [amount, setAmount] = useState("650000");
  const [median, setMedian] = useState("35326");
  const [balance, setBalance] = useState("1284500");
  const [channel, setChannel] = useState<EventChannel>("web");
  const [mode, setMode] = useState<"Observe" | "Enforce">("Enforce");
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => Object.fromEntries(steps.map((step) => [step.event_name, true])));
  const [evaluation, setEvaluation] = useState<RiskEvaluateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiClient.listInstitutions().then((items) => { setInstitutions(items); setInstitutionRef(items[0]?.institution_ref ?? ""); }).catch(() => setError("The institution directory is unavailable. Start the API and try again.")).finally(() => setLoading(false));
  }, []);

  const selectedInstitution = useMemo(() => institutions.find((item) => item.institution_ref === institutionRef), [institutions, institutionRef]);
  const selectedSteps = steps.filter((step) => enabled[step.event_name]);

  function buildRequest(): RiskEvaluateRequest {
    const start = Date.now();
    const numericAmount = Number(amount) || 0;
    return {
      customer_ref: customerRef.trim() || "customer_demo",
      institution_ref: institutionRef,
      events: selectedSteps.map((step, index) => ({
        event_id: `analysis-${start}-${index + 1}`,
        customer_ref: customerRef.trim() || "customer_demo",
        event_name: step.event_name,
        channel,
        occurred_at: new Date(start + step.offset * 1000).toISOString(),
        device_ref: step.event_name === "new_device_login" ? "device_analysis" : undefined,
        beneficiary_ref: step.event_name === "beneficiary_created" ? "beneficiary_analysis" : undefined,
        amount: step.event_name === "transfer_initiated" ? numericAmount : undefined,
        metadata: step.event_name === "transfer_initiated" ? { customer_median_amount: Number(median) || 0, account_balance: Number(balance) || 0 } : undefined,
      })),
    };
  }

  async function runAnalysis() {
    if (!institutionRef || selectedSteps.length === 0) {
      setError("Choose an institution and at least one signal before running the analysis.");
      return;
    }
    setRunning(true);
    setEvaluation(null);
    setError("");
    try {
      const result = await apiClient.evaluateAction(buildRequest(), { mode, idempotencyKey: `analysis-${Date.now()}`, timeoutMs: 500 });
      window.sessionStorage.setItem("nche:last-evaluation", JSON.stringify(result));
      setEvaluation(result);
    } catch {
      const localResult = failOpenEvaluation();
      window.sessionStorage.setItem("nche:last-evaluation", JSON.stringify(localResult));
      setEvaluation(localResult);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="dashboard-page">
      <PageIntro eyebrow="Nche Command / New analysis" title="Run one transfer analysis" description="Start with a customer, choose the institution, and send a complete event sequence through the live risk path." action={<Link className="outline-control" href="/institutions">Manage institutions <span aria-hidden="true">→</span></Link>} />
      <div className="analysis-context-bar"><span className="analysis-context-pulse" /><div><span>Analysis workspace</span><strong>{selectedInstitution?.name ?? (loading ? "Loading institutions…" : "Choose an institution")}</strong></div><small>{mode} mode · {selectedSteps.length} signals</small></div>
      <div className="analysis-layout">
        <section className="panel analysis-form-panel">
          <div className="panel-heading"><div><p className="eyebrow">Action context</p><h2>Build the request</h2></div><span className="provenance-tag">LIVE API</span></div>
          <div className="analysis-form">
            <label className="field-label">Institution<select value={institutionRef} onChange={(event) => setInstitutionRef(event.target.value)} disabled={loading || institutions.length === 0}><option value="">Select an institution</option>{institutions.map((institution) => <option value={institution.institution_ref} key={institution.institution_ref}>{institution.name}</option>)}</select></label>
            <label className="field-label">Customer reference<input value={customerRef} onChange={(event) => setCustomerRef(event.target.value)} placeholder="customer_demo" /></label>
            <div className="analysis-field-grid"><label className="field-label">Transfer amount<input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="numeric" /></label><label className="field-label">Customer median<input value={median} onChange={(event) => setMedian(event.target.value)} inputMode="numeric" /></label></div>
            <div className="analysis-field-grid"><label className="field-label">Available balance<input value={balance} onChange={(event) => setBalance(event.target.value)} inputMode="numeric" /></label><span className="field-help">Nche raises risk when a transfer consumes most of the available balance.</span></div>
            <div className="analysis-field-grid"><label className="field-label">Channel<select value={channel} onChange={(event) => setChannel(event.target.value as EventChannel)}><option value="web">Web</option><option value="mobile">Mobile</option><option value="ussd">USSD</option><option value="api">API</option></select></label><label className="field-label">Decision mode<select value={mode} onChange={(event) => setMode(event.target.value as "Observe" | "Enforce")}><option value="Enforce">Enforce</option><option value="Observe">Observe</option></select></label></div>
          </div>
          <div className="sequence-builder"><div className="sequence-builder-heading"><div><p className="eyebrow">Signals in this request</p><h2>Choose the sequence</h2></div><span>{selectedSteps.length} selected</span></div>{steps.map((step) => <label className={`sequence-toggle ${enabled[step.event_name] ? "selected" : ""}`} key={step.event_name}><input type="checkbox" checked={enabled[step.event_name]} onChange={(event) => setEnabled({ ...enabled, [step.event_name]: event.target.checked })} /><span className="sequence-check" /><span><strong>{step.label}</strong><small>{step.detail} · +{step.offset}s</small></span></label>)}</div>
          {error && <p className="analysis-error" role="alert">{error}</p>}
          <button className="cyan-button full-width" type="button" onClick={runAnalysis} disabled={running || loading || institutions.length === 0}>{running ? "Running risk analysis…" : "Run transfer analysis →"}</button>
        </section>
        <section className="analysis-result-column"><div className="panel analysis-result-panel"><div className="panel-heading"><div><p className="eyebrow">Decision output</p><h2>{running ? "Evaluating now" : evaluation ? "Analysis complete" : "Ready when you are"}</h2></div><span className="provenance-tag">{evaluation?.fallback ? "LOCAL RULES" : "Nche API"}</span></div>{!evaluation && !running && <div className="analysis-empty"><span className="analysis-empty-mark">→</span><h3>One action, one explainable result.</h3><p>Run the request to see the score, policy rule, evidence, latency, and enforcement mode returned by Nche.</p></div>}{(running || evaluation) && <EvaluationDecision evaluation={evaluation} loading={running} />}</div>{evaluation && !evaluation.fallback && <Link className="analysis-investigation-link" href={`/investigations/${evaluation.evaluation_id}`}>Open this evaluation in investigations <span aria-hidden="true">→</span></Link>}</section>
      </div>
    </div>
  );
}
