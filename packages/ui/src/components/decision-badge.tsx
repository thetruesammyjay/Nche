import type { Decision } from "@nche/types";

export function DecisionBadge({ decision }: { decision: Decision }) {
  return <span className={`decision-badge decision-${decision.toLowerCase()}`}><span className="decision-dot" />{decision}</span>;
}
