import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildCorsHeaders, isAllowedCorsOrigin } from "@/lib/utils/cors";
import {
  hashPassword,
  validatePassword,
  validateEmail,
  generateCode,
  getCodeExpiry,
} from "@/lib/auth-credentials";
import { sendVerificationEmail } from "@/lib/email";

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
 * Signup with email/password for Tauri desktop app
 * Same logic as web signup, but with CORS support
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

    // Validate email format
    if (!email || !validateEmail(email)) {
      return NextResponse.json(
        { error: "Adresse email invalide" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password || "");
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.errors[0] },
        { status: 400, headers: corsHeaders }
      );
    }

    const normalizedEmail = email.toLowerCase();

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { accounts: true },
    });

    if (existingUser) {
      // Check if user has Google OAuth account
      const hasGoogleAccount = existingUser.accounts.some(
        (a) => a.provider === "google"
      );

      if (hasGoogleAccount) {
        return NextResponse.json(
          {
            error:
              "Cet email est déjà associé à un compte Google. Veuillez vous connecter avec Google.",
            code: "USE_GOOGLE",
          },
          { status: 400, headers: corsHeaders }
        );
      }

      // User already exists with password
      if (existingUser.password) {
        return NextResponse.json(
          { error: "Email déjà utilisé", code: "EMAIL_EXISTS" },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create or update user
    const user = existingUser
      ? await prisma.user.update({
          where: { email: normalizedEmail },
          data: { password: hashedPassword },
        })
      : await prisma.user.create({
          data: {
            email: normalizedEmail,
            password: hashedPassword,
            emailVerified: null,
          },
        });

    // Delete any existing verification tokens for this email
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: normalizedEmail,
        type: "email",
      },
    });

    // Generate verification code
    const code = generateCode();
    const expires = getCodeExpiry();

    // Save verification token
    await prisma.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token: code,
        expires,
        type: "email",
      },
    });

    // Send verification email
    await sendVerificationEmail(normalizedEmail, code);

    return NextResponse.json(
      {
        success: true,
        message: "Vérifiez votre email",
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("Error in Tauri signup:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500, headers: corsHeaders }
    );
  }
}
