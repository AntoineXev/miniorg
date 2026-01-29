import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyTauriJwt } from "@/lib/tauri-jwt";

async function getUserEmail(req: NextRequest): Promise<string | null> {
  // Try NextAuth session first (web)
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    return session.user.email;
  }

  // Try Tauri JWT (desktop)
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();
    try {
      const payload = await verifyTauriJwt(token);
      if (payload.email && typeof payload.email === "string") {
        return payload.email;
      }
    } catch {
      // Invalid token
    }
  }

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const email = await getUserEmail(req);

    if (!email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const hasGoogleAccount = user.accounts.some((a) => a.provider === "google");
    const hasPassword = !!user.password;

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      authMethod: hasGoogleAccount ? "google" : hasPassword ? "credentials" : "unknown",
      hasGoogleAccount,
      hasPassword,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}
