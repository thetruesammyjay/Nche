import { NextResponse } from "next/server";
import { ANALYST_SESSION_COOKIE } from "../../../../lib/auth";
import { verifySessionToken } from "../../../../lib/session";

export async function GET(request: Request) {
  const cookie = request.headers.get("cookie")?.split(";").find((part) => part.trim().startsWith(`${ANALYST_SESSION_COOKIE}=`));
  const identity = verifySessionToken(cookie?.split("=").slice(1).join("="));
  if (!identity) return NextResponse.json({ detail: "Analyst sign-in required." }, { status: 401 });
  return NextResponse.json({ analyst: identity });
}
