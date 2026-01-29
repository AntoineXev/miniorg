import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  validatePassword,
  validateEmail,
  generateCode,
  getCodeExpiry,
} from "@/lib/auth-credentials";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Validate email format
    if (!email || !validateEmail(email)) {
      return NextResponse.json(
        { error: "Adresse email invalide" },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password || "");
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.errors[0] },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
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
          { status: 400 }
        );
      }

      // User already exists with password
      if (existingUser.password) {
        return NextResponse.json(
          { error: "Email déjà utilisé", code: "EMAIL_EXISTS" },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create or update user
    const user = existingUser
      ? await prisma.user.update({
          where: { email: email.toLowerCase() },
          data: { password: hashedPassword },
        })
      : await prisma.user.create({
          data: {
            email: email.toLowerCase(),
            password: hashedPassword,
            emailVerified: null,
          },
        });

    // Delete any existing verification tokens for this email
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: email.toLowerCase(),
        type: "email",
      },
    });

    // Generate verification code
    const code = generateCode();
    const expires = getCodeExpiry();

    // Save verification token
    await prisma.verificationToken.create({
      data: {
        identifier: email.toLowerCase(),
        token: code,
        expires,
        type: "email",
      },
    });

    // Send verification email
    await sendVerificationEmail(email.toLowerCase(), code);

    return NextResponse.json({
      success: true,
      message: "Vérifiez votre email",
    });
  } catch (error: any) {
    console.error("Error in signup:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}
