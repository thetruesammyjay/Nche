export const DEMO_CUSTOMER_MEDIAN_AMOUNT = 35326;
export const DEMO_ACCOUNT_BALANCE = 1_284_500;

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

export function balanceRiskPoints(amount: number, accountBalance = DEMO_ACCOUNT_BALANCE) {
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(accountBalance) || accountBalance <= 0) return 0;

  const ratio = amount / accountBalance;
  if (ratio < 0.5) return 0;
  if (ratio < 0.75) return 4;
  if (ratio < 0.9) return 10;
  if (ratio <= 1) return 18;
  return 25;
}

export function previewTransferRisk(amount: number, accountBalance = DEMO_ACCOUNT_BALANCE) {
  const amountPoints = amountRiskPoints(amount);
  const balancePoints = balanceRiskPoints(amount, accountBalance);
  const score = Math.min(100, 21 + amountPoints + balancePoints);

  if (score < 30) return { score, amountPoints, balancePoints, level: "low", decision: "allowed so far" } as const;
  if (score < 60) return { score, amountPoints, balancePoints, level: "medium", decision: "challenge recommended" } as const;
  if (score < 80) return { score, amountPoints, balancePoints, level: "high", decision: "review recommended" } as const;
  return { score, amountPoints, balancePoints, level: "critical", decision: "block recommended" } as const;
}
