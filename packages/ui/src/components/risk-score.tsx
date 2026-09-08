import type { Decision, RiskLevel } from "@nche/types";

export function RiskScore({ score, decision, level, compact = false }: { score: number; decision: Decision; level: RiskLevel; compact?: boolean }) {
  return <div className={`risk-score risk-${level} ${compact ? "risk-compact" : ""}`}><div className="risk-number">{score}</div><div><span className="risk-level">{level}</span><span className="risk-decision">{decision}</span></div></div>;
}
