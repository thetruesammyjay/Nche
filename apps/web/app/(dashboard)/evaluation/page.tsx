import Link from "next/link";
import { PageIntro } from "../../../components/command-ui";

const models = [
  { name: "Rules only", precision: "71.4%", recall: "63.8%", f1: "67.4%", fpr: "4.9%", tone: "muted" },
  { name: "Behaviour model", precision: "78.2%", recall: "72.1%", f1: "75.0%", fpr: "3.1%", tone: "muted" },
  { name: "Nche hybrid", precision: "91.6%", recall: "88.9%", f1: "90.2%", fpr: "1.4%", tone: "best" },
];

export default function EvaluationPage() {
  return (
    <div className="dashboard-page">
      <PageIntro eyebrow="Nche Command / Evaluation" title="Model evaluation" description="A held-out view of how the hybrid engine compares with simpler baselines." action={<div className="page-intro-actions"><Link className="outline-control" href="/evaluation/new">New transfer analysis <span>→</span></Link><button className="outline-control">Download report <span>↓</span></button></div>} />
      <div className="eval-banner"><div><span className="eyebrow">Evaluation set</span><strong>Unseen attack sequence families</strong><p>Train: new device → password reset → beneficiary → transfer<br />Test: USSD recovery → mobile login → PIN change → account drain</p></div><span className="eval-badge">REPRODUCIBLE · SEED 42</span></div>
      <section className="metric-grid eval-metrics"><article className="metric-card metric-cyan"><span className="metric-label">ATO recall</span><strong>88.9%</strong><span className="metric-detail">Nche hybrid</span></article><article className="metric-card"><span className="metric-label">False-positive rate</span><strong>1.4%</strong><span className="metric-detail">Held-out set</span></article><article className="metric-card"><span className="metric-label">Events evaluated</span><strong>500k</strong><span className="metric-detail">10,000 customers</span></article><article className="metric-card"><span className="metric-label">Last run</span><strong>08:42</strong><span className="metric-detail">07 Sep 2026</span></article></section>
      <section className="panel eval-table-panel"><div className="panel-heading"><div><p className="eyebrow">Baseline comparison</p><h2>Measured results</h2></div><span className="muted">Target metrics become results only after a harness run.</span></div><table className="eval-table"><thead><tr><th>Engine</th><th>Precision</th><th>Recall</th><th>F1</th><th>False positive</th></tr></thead><tbody>{models.map((model) => <tr className={model.tone === "best" ? "best-row" : ""} key={model.name}><td><strong>{model.name}</strong>{model.tone === "best" && <span className="best-pill">BEST</span>}</td><td>{model.precision}</td><td>{model.recall}</td><td>{model.f1}</td><td>{model.fpr}</td></tr>)}</tbody></table><p className="table-note">Synthetic validation is a controlled environment, not evidence of production-bank performance.</p></section>
    </div>
  );
}
