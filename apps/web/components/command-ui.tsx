import type { Decision, RiskLevel } from "@nche/types";
import { DecisionBadge, RiskScore } from "@nche/ui";

export function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: React.ReactNode }) {
  return <div className="page-intro"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p className="page-description">{description}</p>}</div>{action && <div className="page-intro-action">{action}</div>}</div>;
}

export function MetricCard({ label, value, detail, trend, tone = "default" }: { label: string; value: string; detail: string; trend?: string; tone?: "default" | "critical" | "cyan" }) {
  return <article className={`metric-card metric-${tone}`}><span className="metric-label">{label}</span><strong>{value}</strong><span className={`metric-detail ${trend?.startsWith("↑") ? "positive" : ""}`}>{trend ?? detail}</span>{trend && <small>{detail}</small>}</article>;
}

export function DecisionLegend() {
  return <div className="decision-legend"><span><i className="dot allow" />Allow</span><span><i className="dot challenge" />Challenge</span><span><i className="dot review" />Review</span><span><i className="dot block" />Block</span></div>;
}

export function InvestigationHero({ score, decision, level, title, description }: { score: number; decision: Decision; level: RiskLevel; title: string; description: string }) {
  return <div className="investigation-hero"><div className="hero-status"><RiskScore score={score} decision={decision} level={level} /><DecisionBadge decision={decision} /></div><div className="hero-copy"><p className="eyebrow">Primary reason · Account takeover sequence</p><h2>{title}</h2><p>{description}</p></div><div className="hero-meta"><span>Evaluation</span><strong className="mono">evaluation_4b19</strong><span>Model version</span><strong className="mono">nche-risk-v0.2.0</strong></div></div>;
}
