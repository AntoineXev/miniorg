import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import {
  buildCorsHeaders,
  isAllowedCorsOrigin,
} from "@/lib/utils/cors";
import {
  getTauriJwtSecret,
  getTauriJwtIssuer,
  getTauriStateAudience,
} from "@/lib/tauri-jwt";

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!isAllowedCorsOrigin(origin)) {
    const headers = buildCorsHeaders(origin, { allowCredentials: false });
    return new NextResponse(null, { status: 403, headers });
  }
  const headers = buildCorsHeaders(origin, { allowCredentials: true });
  return new NextResponse(null, { status: 204, headers });
}

/**
 * Issue a short-lived signed state token for the Tauri OAuth flow.
 */
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!isAllowedCorsOrigin(origin)) {
    const headers = buildCorsHeaders(origin, { allowCredentials: false });
    return NextResponse.json(
      { error: "CORS origin not allowed" },
      { status: 403, headers }
    );
  }

  const headers = buildCorsHeaders(origin, { allowCredentials: true });

  try {
    const secret = getTauriJwtSecret();
    const issuer = getTauriJwtIssuer();
    const audience = getTauriStateAudience();
    const expiresInSeconds = 5 * 60;

    const state = await new SignJWT({
      nonce: crypto.randomUUID(),
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + expiresInSeconds)
      .setIssuer(issuer)
      .setAudience(audience)
      .sign(secret);

    return NextResponse.json({ state }, { headers });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create state" },
      { status: 500, headers }
    );
  }
}
