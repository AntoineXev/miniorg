import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SignJWT, jwtVerify } from "jose";
import { buildCorsHeaders, isAllowedCorsOrigin } from "@/lib/utils/cors";
import {
  getTauriJwtSecret,
  getTauriJwtIssuer,
  getTauriJwtAudience,
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
 * Exchange OAuth code for JWT token (Tauri desktop app)
 * 
 * This endpoint is called by the Tauri app after receiving the OAuth callback.
 * It exchanges the authorization code for tokens with Google, creates or finds
 * the user in the database, and returns a JWT for session management.
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
    const { code, redirect_uri, code_verifier, state } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Missing authorization code" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!redirect_uri) {
      return NextResponse.json(
        { error: "Missing redirect_uri" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!code_verifier) {
      return NextResponse.json(
        { error: "Missing code_verifier" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!state) {
      return NextResponse.json(
        { error: "Missing state" },
        { status: 400, headers: corsHeaders }
      );
    }

    let redirectUrl: URL | null = null;
    try {
      redirectUrl = new URL(redirect_uri);
    } catch {
      return NextResponse.json(
        { error: "Invalid redirect_uri" },
        { status: 400, headers: corsHeaders }
      );
    }

    const isLoopback =
      redirectUrl.protocol === "http:" &&
      (redirectUrl.hostname === "127.0.0.1" ||
        redirectUrl.hostname === "localhost") &&
      redirectUrl.pathname === "/callback";

    if (!isLoopback) {
      return NextResponse.json(
        { error: "redirect_uri not allowed" },
        { status: 400, headers: corsHeaders }
      );
    }

    try {
      await jwtVerify(state, getTauriJwtSecret(), {
        issuer: getTauriJwtIssuer(),
        audience: getTauriStateAudience(),
      });
    } catch {
      return NextResponse.json(
        { error: "Invalid OAuth state" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Get Google OAuth credentials for desktop app
    const clientId =
      process.env.GOOGLE_CLIENT_ID_DESKTOP || process.env.GOOGLE_CLIENT_ID;
    const clientSecret =
      process.env.GOOGLE_CLIENT_SECRET_DESKTOP || process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500, headers: corsHeaders }
      );
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri,
        grant_type: "authorization_code",
        code_verifier,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error("Failed to exchange code for tokens:", error);
      return NextResponse.json(
        { error: "Failed to authenticate with Google" },
        { status: 401, headers: corsHeaders }
      );
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, id_token } = tokens;

    // Get user info from Google
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (!userInfoResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch user info" },
        { status: 401, headers: corsHeaders }
      );
    }

    const userInfo = await userInfoResponse.json();
    const { id: googleId, email, name, picture, verified_email, email_verified } =
      userInfo;

    const isEmailVerified = Boolean(verified_email || email_verified);
    if (!email || !isEmailVerified) {
      return NextResponse.json(
        { error: "Unverified email address" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Find or create user in database
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          name,
          image: picture,
          emailVerified: new Date(),
        },
      });
    }

    // Find or create Account (for Google OAuth)
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: "google",
          providerAccountId: googleId,
        },
      },
      update: {
        access_token,
        refresh_token,
        expires_at: tokens.expires_in
          ? Math.floor(Date.now() / 1000) + tokens.expires_in
          : null,
        id_token,
      },
      create: {
        userId: user.id,
        type: "oauth",
        provider: "google",
        providerAccountId: googleId,
        access_token,
        refresh_token,
        expires_at: tokens.expires_in
          ? Math.floor(Date.now() / 1000) + tokens.expires_in
          : null,
        token_type: "Bearer",
        scope: tokens.scope,
        id_token,
      },
    });

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
    console.error("Error in Tauri token exchange:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
