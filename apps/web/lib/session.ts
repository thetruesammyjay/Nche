import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export type SessionIdentity = {
  email: string;
  name: string;
  role: string;
};

const SESSION_TTL_SECONDS = 60 * 60 * 8;
const DEV_SESSION_SECRET = "nche-development-session-secret";

function secret() {
  const value = process.env.NCHE_SESSION_SECRET;
  if (process.env.NODE_ENV === "production" && !value) {
    throw new Error("NCHE_SESSION_SECRET must be configured in production");
  }
  return value ?? DEV_SESSION_SECRET;
}

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signature(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken(identity: SessionIdentity) {
  const payload = encode(JSON.stringify({
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    nonce: randomBytes(16).toString("base64url"),
    ...identity,
  }));
  return `${payload}.${signature(payload)}`;
}

export function verifySessionToken(token: string | undefined): SessionIdentity | null {
  if (!token) return null;
  const [payload, providedSignature] = token.split(".");
  if (!payload || !providedSignature) return null;
  const expected = signature(payload);
  const provided = Buffer.from(providedSignature, "base64url");
  const expectedBytes = Buffer.from(expected, "base64url");
  if (provided.length !== expectedBytes.length || !timingSafeEqual(provided, expectedBytes)) return null;

  try {
    const parsed = JSON.parse(decode(payload)) as Partial<SessionIdentity> & { exp?: number; nonce?: string };
    if (!parsed.exp || !Number.isFinite(parsed.exp) || parsed.exp <= Math.floor(Date.now() / 1000) || !parsed.nonce) return null;
    if (!parsed.email || !parsed.name || !parsed.role) return null;
    return { email: parsed.email, name: parsed.name, role: parsed.role };
  } catch {
    return null;
  }
}

export { SESSION_TTL_SECONDS };
