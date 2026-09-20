export const DECISIONS = ["ALLOW", "CHALLENGE", "BLOCK", "REVIEW"] as const;
export type Decision = (typeof DECISIONS)[number];
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type EvaluationMode = "Observe" | "Enforce";

export interface Evidence {
  event: string;
  weight?: number;
  seconds_after_previous?: number;
  amount_vs_customer_median?: number;
  balance_usage_ratio?: number;
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
  institution_ref?: string | null;
  mode: EvaluationMode;
  enforced: boolean;
  idempotent_replay: boolean;
  latency_ms?: number | null;
  fallback?: boolean;
}
