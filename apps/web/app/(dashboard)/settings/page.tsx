import { AnalystAccessPanel } from "../../../components/analyst-access-panel";
import { InstitutionPolicyPanel } from "../../../components/institution-policy-panel";
import { PageIntro } from "../../../components/command-ui";

export default function SettingsPage() {
  return <div className="dashboard-page"><PageIntro eyebrow="Nche Command / Settings" title="Institution settings" description="Configure institution-owned decision bands and review signal provenance." /><div className="settings-grid"><InstitutionPolicyPanel /><section className="panel settings-panel"><div className="panel-heading"><div><p className="eyebrow">Enrichment</p><h2>Signal provenance</h2></div><span className="provenance-tag">LABELLED</span></div><p className="muted">Every external signal is labelled so analysts can understand its confidence.</p><div className="source-card"><span className="source-icon">⌁</span><div><strong>SIM intelligence</strong><small>SIMULATED · hackathon MVP</small></div><span className="source-status">Connected</span></div><div className="source-card muted-source"><span className="source-icon">+</span><div><strong>NIBSS SIM Swap Service</strong><small>Production adapter</small></div><span className="outline-control small-control">Integration pending</span></div></section></div><AnalystAccessPanel /></div>;
}
