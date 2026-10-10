import type { NcheEvent } from "./events";
import type { Decision, EvaluationMode, RiskEvaluation, RiskLevel } from "./risk";

export interface RiskEvaluateRequest {
  customer_ref: string;
  events: NcheEvent[];
  institution_ref?: string;
}

export interface EvaluateActionOptions {
  mode?: EvaluationMode;
  idempotencyKey?: string;
  timeoutMs?: number;
}

export interface HealthResponse { status: string; service: string; version?: string; }
export type RiskEvaluateResponse = RiskEvaluation;
export interface EvaluationSummary {
  evaluation_id: string;
  customer_ref: string;
  institution_ref?: string | null;
  decision: Decision;
  risk_score: number;
  risk_level: RiskLevel;
  recommended_action: string;
  policy_rule: string;
  primary_reason: string;
  model_version: string;
  created_at: string;
  mode: EvaluationMode;
  enforced: boolean;
  case_status: CaseStatus;
  assigned_to?: string | null;
}

export type CaseStatus = "NEW" | "IN_REVIEW" | "RESOLVED";

export interface EvaluationCase {
  evaluation_id: string;
  status: CaseStatus;
  assigned_to?: string | null;
  updated_at: string;
}

export interface AuditEntry {
  id: number;
  action: string;
  actor_ref?: string | null;
  institution_ref?: string | null;
  evaluation_id?: string | null;
  request_id?: string | null;
  occurred_at: string;
  metadata: Record<string, unknown>;
}
