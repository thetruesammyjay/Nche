import type { HealthResponse, RiskEvaluateRequest, RiskEvaluateResponse } from "@nche/types";

const API_URL = process.env.NCHE_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { ...init, headers: { "content-type": "application/json", ...init?.headers } });
  if (!response.ok) throw new Error(`Nche API request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export const apiClient = {
  health: () => request<HealthResponse>("/health"),
  evaluateRisk: (payload: RiskEvaluateRequest) => request<RiskEvaluateResponse>("/risk/evaluate", { method: "POST", body: JSON.stringify(payload) }),
};
