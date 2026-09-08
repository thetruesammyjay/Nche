import type { NcheEvent } from "./events";
import type { RiskEvaluation } from "./risk";

export interface RiskEvaluateRequest {
  customer_ref: string;
  events: NcheEvent[];
  institution_ref?: string;
}

export interface HealthResponse { status: string; service: string; version?: string; }
export type RiskEvaluateResponse = RiskEvaluation;
