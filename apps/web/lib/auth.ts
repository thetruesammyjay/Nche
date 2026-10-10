export const ANALYST_SESSION_COOKIE = "nche_analyst_session";

const isProduction = process.env.NODE_ENV === "production";

export const DEMO_ANALYST = {
  email: process.env.NCHE_ANALYST_EMAIL ?? (isProduction ? "" : "analyst@nche.demo"),
  password: process.env.NCHE_ANALYST_PASSWORD ?? (isProduction ? "" : "demo-analyst"),
  name: "Oluwaseun A.",
  role: "Analyst",
};

export function isSafeRedirect(value: string | null | undefined): value is string {
  return Boolean(value && value.startsWith("/") && !value.startsWith("//"));
}
