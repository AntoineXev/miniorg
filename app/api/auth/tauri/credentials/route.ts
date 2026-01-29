import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";
import { buildCorsHeaders, isAllowedCorsOrigin } from "@/lib/utils/cors";
import {
  getTauriJwtSecret,
  getTauriJwtIssuer,
  getTauriJwtAudience,
} from "@/lib/tauri-jwt";
import { verifyPassword } from "@/lib/auth-credentials";

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
 * Login with email/password for Tauri desktop app
 * Returns JWT token on success
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
  const corsHeaders = buildCorsHeaders(origin, { allowCredentials: true });

  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis", code: "INVALID_CREDENTIALS" },
        { status: 400, headers: corsHeaders }
      );
    }

    const normalizedEmail = email.toLowerCase();

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { accounts: true },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect", code: "INVALID_CREDENTIALS" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Check if has Google account but no password
    const hasGoogleAccount = user.accounts.some((a) => a.provider === "google");
    if (hasGoogleAccount && !user.password) {
      return NextResponse.json(
        {
          error: "Cet email est associé à un compte Google. Veuillez vous connecter avec Google.",
          code: "USE_GOOGLE",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Email non vérifié", code: "EMAIL_NOT_VERIFIED" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Verify password
    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect", code: "INVALID_CREDENTIALS" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Generate JWT for Tauri app
    const secret = getTauriJwtSecret();
    const issuer = getTauriJwtIssuer();
    const audience = getTauriJwtAudience();
    const expiresAt = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days

    const jwt = await new SignJWT({
      sub: user.id,
      email: user.email,
      name: user.name,
      picture: user.image,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(expiresAt)
      .setIssuer(issuer)
      .setAudience(audience)
      .sign(secret);

    const res = NextResponse.json(
      {
        token: jwt,
        expires_at: expiresAt,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        },
      },
      { headers: corsHeaders }
    );

    const isSecure = req.nextUrl.protocol === "https:";
    res.cookies.set({
      name: "tauri-session",
      value: jwt,
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (error: any) {
    console.error("Error in Tauri credentials login:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
