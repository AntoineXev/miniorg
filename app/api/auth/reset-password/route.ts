import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, validatePassword, validateEmail } from "@/lib/auth-credentials";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code, password } = body;

    if (!email || !validateEmail(email)) {
      return NextResponse.json(
        { error: "Adresse email invalide" },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: "Code requis" },
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

    // Find verification token
    const token = await prisma.verificationToken.findFirst({
      where: {
        identifier: email.toLowerCase(),
        token: code,
        type: "password_reset",
      },
    });

    if (!token) {
      return NextResponse.json(
        { error: "Code invalide", code: "INVALID_CODE" },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (new Date() > token.expires) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: email.toLowerCase(),
            token: code,
          },
        },
      });

      return NextResponse.json(
        { error: "Code expiré", code: "CODE_EXPIRED" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update user's password
    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { password: hashedPassword },
    });

    // Delete used token
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email.toLowerCase(),
          token: code,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in reset-password:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}
