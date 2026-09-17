import Link from "next/link";
import { EventTimeline } from "@nche/ui";
import { EvaluationEvidencePanel } from "../../../../components/evaluation-evidence";
import { InvestigationHero } from "../../../../components/command-ui";

const events = [
  { time: "03:12:08", channel: "WEB", event: "Login from new device", detail: "device_81ab · Lagos · first seen", tone: "neutral" as const },
  { time: "03:13:01", channel: "WEB", event: "Password reset", detail: "53 seconds later · credential changed", tone: "warning" as const },
  { time: "03:13:19", channel: "WEB", event: "New beneficiary created", detail: "beneficiary_a37e · first-time recipient", tone: "warning" as const },
  { time: "03:14:02", channel: "WEB", event: "High-value transfer attempted", detail: "₦650,000 · 18.4× customer median", tone: "critical" as const },
];

export default async function InvestigationPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;

  return (
    <div className="dashboard-page">
      <div className="case-breadcrumb"><Link href="/investigations">Investigations</Link><span>/</span><strong>{caseId}</strong></div>
      <InvestigationHero score={90} decision="BLOCK" level="critical" title="Account takeover sequence detected" description="A new device login was followed by a password reset and a new beneficiary within 64 seconds. The transfer is 18.4 times the customer's historical median." />
      <div className="investigation-grid">
        <article className="panel evidence-panel">
          <div className="panel-heading"><div><p className="eyebrow">Observed sequence</p><h2>What changed, in order</h2></div><span className="provenance-tag">SIM Intelligence · SIMULATED</span></div>
          <EventTimeline events={events} />
        </article>
        <EvaluationEvidencePanel />
      </div>
      <div className="case-actions"><button className="cyan-button">Assign to me <span>→</span></button><button className="outline-control">Mark as resolved</button><Link href="/alerts" className="text-link">Back to alert queue <span>←</span></Link></div>
    </div>
  );
}
