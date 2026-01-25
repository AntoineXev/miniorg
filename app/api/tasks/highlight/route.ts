import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorizedUser } from "@/lib/auth-tauri-server";
import { z } from "zod";
import { startOfDay, endOfDay, format } from "date-fns";

// Schema for highlight creation/update
const highlightSchema = z.object({
  title: z.string().min(1),
  date: z.string().optional(), // ISO date string, defaults to today
});

// GET /api/tasks/highlight?date=2024-01-15
// Returns the highlight task for the given date (or today if not specified)
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
    const dayEnd = endOfDay(targetDate);

    const highlight = await prisma.task.findFirst({
      where: {
        userId,
        type: "highlight",
        scheduledDate: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      include: {
        tag: true,
        calendarEvents: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    return NextResponse.json(highlight);
  } catch (error) {
    console.error("Error fetching highlight:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/tasks/highlight
// Creates or updates the highlight task for today
// Guarantees only ONE highlight per user per day
export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthorizedUser(request);
    const userId = authResult?.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const body = highlightSchema.parse(json);

    // Use provided date or default to today
    const targetDate = body.date ? new Date(body.date) : new Date();
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);

    // Check if highlight already exists for today
    const existingHighlight = await prisma.task.findFirst({
      where: {
        userId,
        type: "highlight",
        scheduledDate: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    });

    let highlight;

    if (existingHighlight) {
      // Update existing highlight
      highlight = await prisma.task.update({
        where: { id: existingHighlight.id },
        data: {
          title: body.title,
          updatedAt: new Date(),
        },
        include: {
          tag: true,
          calendarEvents: {
            select: {
              id: true,
              startTime: true,
              endTime: true,
            },
          },
        },
      });
    } else {
      // Create new highlight
      highlight = await prisma.task.create({
        data: {
          title: body.title,
          type: "highlight",
          status: "planned",
          scheduledDate: dayStart,
          userId,
        },
        include: {
          tag: true,
          calendarEvents: {
            select: {
              id: true,
              startTime: true,
              endTime: true,
            },
          },
        },
      });
    }

    return NextResponse.json(highlight, { status: existingHighlight ? 200 : 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error upserting highlight:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
