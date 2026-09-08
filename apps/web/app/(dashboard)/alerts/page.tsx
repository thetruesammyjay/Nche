import { AlertQueue } from "../../../components/alert-queue";
import { PageIntro } from "../../../components/command-ui";

export default function AlertsPage() {
  return <div className="dashboard-page"><PageIntro eyebrow="Nche Command / Alerts" title="Alerts" description="Review the sequences that need a decision, ordered by risk and recency." action={<button className="outline-control">Export queue <span>↓</span></button>} /><div className="queue-summary"><span><i className="dot block" /> 7 critical</span><span><i className="dot review" /> 11 awaiting review</span><span><i className="dot allow" /> 24 resolved today</span><span className="summary-spacer" /><span className="muted">Updated just now</span></div><AlertQueue /></div>;
}