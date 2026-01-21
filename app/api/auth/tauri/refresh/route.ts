import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { buildCorsHeaders, isAllowedCorsOrigin } from "@/lib/utils/cors";
import {
  getTauriJwtSecret,
  getTauriJwtIssuer,
  getTauriJwtAudience,
  verifyTauriJwt,
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
 * Refresh a valid Tauri JWT and return a new token.
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
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
    }

    const token = authHeader.slice("Bearer ".length).trim();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
    }

    const payload = await verifyTauriJwt(token);
    const subject = payload.sub as string | undefined;
    if (!subject) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
    }

    const secret = getTauriJwtSecret();
    const issuer = getTauriJwtIssuer();
    const audience = getTauriJwtAudience();
    const expiresAt = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;

    const refreshedToken = await new SignJWT({
      sub: subject,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(expiresAt)
      .setIssuer(issuer)
      .setAudience(audience)
      .sign(secret);

    return NextResponse.json(
      { token: refreshedToken, expires_at: expiresAt },
      { headers }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to refresh token" },
      { status: 500, headers }
    );
  }
}
