import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorizedUser } from "@/lib/auth-tauri-server";
import { z } from "zod";

const updateSettingsSchema = z.object({
  ritualMode: z.enum(["separate", "morning", "evening"]).optional(),
});

// GET /api/user/settings
export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthorizedUser(request);
    const userId = authResult?.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        ritualMode: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/user/settings
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await getAuthorizedUser(request);
    const userId = authResult?.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const body = updateSettingsSchema.parse(json);

    const user = await prisma.user.update({
      where: { id: userId },
      data: body,
      select: {
        ritualMode: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error updating user settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
