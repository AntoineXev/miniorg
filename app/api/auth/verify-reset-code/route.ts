import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateEmail } from "@/lib/auth-credentials";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code } = body;

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

    // Find verification token (don't delete it yet)
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
      return NextResponse.json(
        { error: "Code expiré", code: "CODE_EXPIRED" },
        { status: 400 }
      );
    }

    // Code is valid
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in verify-reset-code:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}
