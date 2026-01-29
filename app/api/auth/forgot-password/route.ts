import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateCode, getCodeExpiry, validateEmail } from "@/lib/auth-credentials";
import { sendPasswordResetEmail } from "@/lib/email";

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

    // If user doesn't exist or has no password (OAuth only),
    // return success anyway for security (don't reveal if email exists)
    if (!user || !user.password) {
      return NextResponse.json({ success: true });
    }

    // Delete any existing password reset tokens for this email
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: email.toLowerCase(),
        type: "password_reset",
      },
    });

    // Generate reset code
    const code = generateCode();
    const expires = getCodeExpiry();

    // Save verification token
    await prisma.verificationToken.create({
      data: {
        identifier: email.toLowerCase(),
        token: code,
        expires,
        type: "password_reset",
      },
    });

    // Send password reset email
    await sendPasswordResetEmail(email.toLowerCase(), code);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in forgot-password:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}
