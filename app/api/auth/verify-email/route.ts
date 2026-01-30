import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email et code requis" },
        { status: 400 }
      );
    }

    // Find verification token
    const token = await prisma.verificationToken.findFirst({
      where: {
        identifier: email.toLowerCase(),
        token: code,
        type: "email",
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

    // Update user's emailVerified
    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { emailVerified: new Date() },
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
    console.error("Error in verify-email:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}
