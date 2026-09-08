export const DECISIONS = ["ALLOW", "CHALLENGE", "BLOCK", "REVIEW"] as const;
export type Decision = (typeof DECISIONS)[number];
export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface Evidence {
  event: string;
  weight?: number;
  seconds_after_previous?: number;
  amount_vs_customer_median?: number;
  observed?: string;
  interpretation?: string;
}

export interface RiskEvaluation {
  evaluation_id: string;
  decision: Decision;
  risk_score: number;
  risk_level: RiskLevel;
  recommended_action: Lowercase<Decision>;
  policy_rule: string;
  primary_reason: string;
  evidence: Evidence[];
  model_version: string;
  created_at: string;
}
