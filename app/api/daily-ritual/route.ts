import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorizedUser } from "@/lib/auth-tauri-server";
import { z } from "zod";
import { startOfDay } from "date-fns";

// Schema for daily ritual creation/update
const dailyRitualSchema = z.object({
  date: z.string().optional(), // ISO date string, defaults to today
  highlightId: z.string().optional().nullable(),
  timeline: z.array(z.string()).optional(), // Array of task IDs
});

// GET /api/daily-ritual?date=2024-01-15
// Returns the daily ritual for the given date (or today if not specified)
export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthorizedUser(request);
    const userId = authResult?.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    // Parse date or use today
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const dayStart = startOfDay(targetDate);

    const ritual = await prisma.dailyRitual.findUnique({
      where: {
        userId_date: {
          userId,
          date: dayStart,
        },
      },
      include: {
        highlight: {
          include: {
            tag: true,
          },
        },
      },
    });

    return NextResponse.json(ritual);
  } catch (error) {
    console.error("Error fetching daily ritual:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/daily-ritual
// Creates or updates the daily ritual for the given date
export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthorizedUser(request);
    const userId = authResult?.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const body = dailyRitualSchema.parse(json);

    // Use provided date or default to today
    const targetDate = body.date ? new Date(body.date) : new Date();
    const dayStart = startOfDay(targetDate);

    // Convert timeline array to JSON string
    const timelineJson = body.timeline ? JSON.stringify(body.timeline) : null;

    const ritual = await prisma.dailyRitual.upsert({
      where: {
        userId_date: {
          userId,
          date: dayStart,
        },
      },
      update: {
        highlightId: body.highlightId,
        timeline: timelineJson,
        updatedAt: new Date(),
      },
      create: {
        userId,
        date: dayStart,
        highlightId: body.highlightId,
        timeline: timelineJson,
      },
      include: {
        highlight: {
          include: {
            tag: true,
          },
        },
      },
    });

    return NextResponse.json(ritual);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error upserting daily ritual:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
