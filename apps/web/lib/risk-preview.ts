export const DEMO_CUSTOMER_MEDIAN_AMOUNT = 35326;

export function parseAmount(value: string) {
  const amount = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

/** Keep the transfer preview aligned with the API's amount anomaly calculation. */
export function amountRiskPoints(amount: number, customerMedian = DEMO_CUSTOMER_MEDIAN_AMOUNT) {
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(customerMedian) || customerMedian <= 0) return 0;

  const ratio = amount / customerMedian;
  return Math.min(35, Math.max(0, Math.round((ratio - 1) * 2)));
}

export function previewTransferRisk(amount: number) {
  const amountPoints = amountRiskPoints(amount);
  const score = Math.min(100, 21 + amountPoints);

  if (score < 30) return { score, amountPoints, level: "low", decision: "allowed so far" } as const;
  if (score < 60) return { score, amountPoints, level: "medium", decision: "challenge recommended" } as const;
  if (score < 80) return { score, amountPoints, level: "high", decision: "review recommended" } as const;
  return { score, amountPoints, level: "critical", decision: "block recommended" } as const;
}
