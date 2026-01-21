import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";

/**
 * Exchange OAuth code for JWT token (Tauri desktop app)
 * 
 * This endpoint is called by the Tauri app after receiving the OAuth callback.
 * It exchanges the authorization code for tokens with Google, creates or finds
 * the user in the database, and returns a JWT for session management.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, redirect_uri } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Missing authorization code" },
        { status: 400 }
      );
    }

    // Get Google OAuth credentials for desktop app
    const clientId = process.env.GOOGLE_CLIENT_ID_DESKTOP || process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET_DESKTOP || process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("Missing Google OAuth credentials");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
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
        redirect_uri: redirect_uri || "tauri://localhost",
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error("Failed to exchange code for tokens:", error);
      return NextResponse.json(
        { error: "Failed to authenticate with Google" },
        { status: 401 }
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
        { status: 401 }
      );
    }

    const userInfo = await userInfoResponse.json();
    const { id: googleId, email, name, picture } = userInfo;

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
    const secret = new TextEncoder().encode(
      process.env.AUTH_SECRET || "fallback-secret-key"
    );

    const expiresAt = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days

    const jwt = await new SignJWT({
      sub: user.id,
      email: user.email,
      name: user.name,
      picture: user.image,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(expiresAt)
      .sign(secret);

    return NextResponse.json({
      token: jwt,
      expires_at: expiresAt,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
    });
  } catch (error: any) {
    console.error("Error in Tauri token exchange:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
