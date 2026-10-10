"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageIntro } from "../../../components/command-ui";

type BenchmarkMetric = {
  model: string;
  precision: number;
  recall: number;
  f1: number;
  false_positive_rate: number;
};

type BenchmarkReport = {
  run_id: string;
  seed: number;
  scenario_count: number;
  events_evaluated: number;
  generated_at: string;
  provenance: string;
  metrics: BenchmarkMetric[];
};

const placeholderModels = ["Rules only", "Behaviour model", "Nche hybrid"];

function percent(value: number | undefined) {
  return value === undefined ? "—" : `${(value * 100).toFixed(1)}%`;
}

export default function EvaluationPage() {
  const [report, setReport] = useState<BenchmarkReport | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const hybrid = useMemo(() => report?.metrics.find((metric) => metric.model === "Nche hybrid"), [report]);

  async function runBenchmark() {
    setRunning(true);
    setError("");
    try {
      const response = await fetch("/api/evaluation/benchmark", { method: "POST", cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as BenchmarkReport | { detail?: string } | null;
      if (!response.ok) throw new Error(payload && "detail" in payload ? payload.detail : "The benchmark could not run.");
      setReport(payload as BenchmarkReport);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The benchmark could not run.");
    } finally {
      setRunning(false);
    }
  }

  const lastRun = report ? new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(report.generated_at)) : "—";

  return (
    <div className="dashboard-page">
      <PageIntro eyebrow="Nche Command / Evaluation" title="Model evaluation" description="Run the reproducible synthetic holdout before presenting model performance as a result." action={<div className="page-intro-actions"><Link className="outline-control" href="/evaluation/new">New transfer analysis <span aria-hidden="true">→</span></Link><button className="outline-control" type="button" onClick={runBenchmark} disabled={running}>{running ? "Running benchmark…" : "Run benchmark"} <span aria-hidden="true">↗</span></button></div>} />
      <div className="eval-banner"><div><span className="eyebrow">Evaluation configuration</span><strong>Unseen attack sequence families</strong><p>Train: new device → password reset → beneficiary → transfer<br />Test: deterministic takeover and legitimate-action holdouts</p></div><span className={`eval-badge ${report ? "is-complete" : ""}`}>{report ? `RUN COMPLETE · SEED ${report.seed}` : "AWAITING RUN · SEED 42"}</span></div>
      {error && <p className="inline-error" role="alert">{error}</p>}
      <section className="metric-grid eval-metrics"><article className="metric-card metric-cyan"><span className="metric-label">Hybrid recall</span><strong>{percent(hybrid?.recall)}</strong><span className="metric-detail">{report ? "Synthetic holdout" : "Run benchmark to measure"}</span></article><article className="metric-card"><span className="metric-label">False-positive rate</span><strong>{percent(hybrid?.false_positive_rate)}</strong><span className="metric-detail">{report ? "Synthetic holdout" : "Run benchmark to measure"}</span></article><article className="metric-card"><span className="metric-label">Events evaluated</span><strong>{report?.events_evaluated ?? 0}</strong><span className="metric-detail">{report ? `${report.scenario_count} scenarios` : "No benchmark run yet"}</span></article><article className="metric-card"><span className="metric-label">Last run</span><strong>{report ? "Ready" : "—"}</strong><span className="metric-detail">{lastRun}</span></article></section>
      <section className="panel eval-table-panel"><div className="panel-heading"><div><p className="eyebrow">Baseline comparison</p><h2>{report ? "Measured synthetic results" : "Harness-ready results"}</h2></div><span className="muted">{report ? `${report.provenance} · ${report.run_id}` : "No benchmark result is shown until an automated run completes."}</span></div><table className="eval-table"><thead><tr><th>Engine</th><th>Precision</th><th>Recall</th><th>F1</th><th>False positive</th></tr></thead><tbody>{placeholderModels.map((name) => { const metric = report?.metrics.find((item) => item.model === name); return <tr className={name === "Nche hybrid" ? "best-row" : ""} key={name}><td><strong>{name}</strong>{name === "Nche hybrid" && <span className="best-pill">HYBRID</span>}</td><td>{percent(metric?.precision)}</td><td>{percent(metric?.recall)}</td><td>{percent(metric?.f1)}</td><td>{percent(metric?.false_positive_rate)}</td></tr>; })}</tbody></table><p className="table-note">Synthetic validation is controlled and reproducible. Validate on institution-approved, held-out data before using these metrics for a live decision policy.</p></section>
    </div>
  );
}
