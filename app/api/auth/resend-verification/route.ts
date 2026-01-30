import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateCode, getCodeExpiry, validateEmail } from "@/lib/auth-credentials";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || !validateEmail(email)) {
      return NextResponse.json(
        { error: "Adresse email invalide" },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Return success anyway for security (don't reveal if email exists)
      return NextResponse.json({ success: true });
    }

    // Check user has password (not OAuth-only)
    if (!user.password) {
      return NextResponse.json({ success: true });
    }

    // Check email is not already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email déjà vérifié" },
        { status: 400 }
      );
    }

    // Delete any existing verification tokens for this email
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: email.toLowerCase(),
        type: "email",
      },
    });

    // Generate new verification code
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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in resend-verification:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}
