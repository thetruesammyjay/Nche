import type {
  EvaluateActionOptions,
  HealthResponse,
  RiskEvaluateRequest,
  RiskEvaluateResponse,
} from "@nche/types";
import type { Institution, InstitutionCreate } from "@nche/types";

const API_URL = process.env.NCHE_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit, timeoutMs = 5000): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const target = path.startsWith("/api/") ? path : `${API_URL}${path}`;
    const response = await fetch(target, {
      ...init,
      signal: controller.signal,
      headers: { "content-type": "application/json", ...init?.headers },
    });
    if (!response.ok) throw new Error(`Nche API request failed: ${response.status}`);
    return response.json() as Promise<T>;
  } finally {
    clearTimeout(timeout);
  }
}

export const apiClient = {
  health: () => request<HealthResponse>("/health"),
  listInstitutions: () => request<Institution[]>("/api/institutions"),
  createInstitution: (payload: InstitutionCreate) => request<Institution>("/api/institutions", { method: "POST", body: JSON.stringify(payload) }),
  evaluateRisk: (payload: RiskEvaluateRequest) => request<RiskEvaluateResponse>("/risk/evaluate", { method: "POST", body: JSON.stringify(payload) }),
  evaluateAction: (payload: RiskEvaluateRequest, options: EvaluateActionOptions = {}) => {
    const headers: Record<string, string> = { "X-Nche-Mode": options.mode ?? "Enforce" };
    if (options.idempotencyKey) headers["Idempotency-Key"] = options.idempotencyKey;
    return request<RiskEvaluateResponse>("/api/risk/evaluate-action", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    }, options.timeoutMs ?? 500);
  },
};

export function failOpenEvaluation(preview?: Pick<RiskEvaluateResponse, "risk_score" | "risk_level">): RiskEvaluateResponse {
  return {
    evaluation_id: `fallback_${Date.now()}`,
    decision: "ALLOW",
    risk_score: preview?.risk_score ?? 0,
    risk_level: preview?.risk_level ?? "low",
    recommended_action: "allow",
    policy_rule: "FAIL_OPEN_LOCAL_RULES",
    primary_reason: "nche_unavailable",
    evidence: [],
    model_version: "local-fallback",
    created_at: new Date().toISOString(),
    mode: "Observe",
    enforced: false,
    idempotent_replay: false,
    latency_ms: 0,
    fallback: true,
  };
}
