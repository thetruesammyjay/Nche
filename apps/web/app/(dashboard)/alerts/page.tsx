import { AlertQueue } from "../../../components/alert-queue";
import { PageIntro } from "../../../components/command-ui";

export default function AlertsPage() {
  return <div className="dashboard-page"><PageIntro eyebrow="Nche Command / Alerts" title="Alerts" description="Review persisted evaluations that need a decision, ordered by risk and recency." action={<span className="outline-control">Export integration pending</span>} /><div className="queue-summary"><span><i className="dot block" /> Critical and high risk</span><span><i className="dot review" /> Analyst review queue</span><span className="summary-spacer" /><span className="muted">Live evaluation index</span></div><AlertQueue /></div>;
}
