import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for calendar event creation/update
const calendarEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  taskId: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  isCompleted: z.boolean().optional(),
  source: z.enum(["miniorg", "google", "outlook"]).optional(),
});

// GET /api/calendar-events - Fetch all calendar events for authenticated user
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrisma();
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const taskId = searchParams.get("taskId");

    const where: any = {
      userId,
    };

    // Filter by date range
    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.startTime = {
        gte: new Date(startDate),
      };
    }

    // Filter by task
    if (taskId) {
      where.taskId = taskId;
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        task: {
          include: {
            tags: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/calendar-events - Create a new calendar event
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrisma();
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;

    const json = await request.json();
    const body = calendarEventSchema.parse(json);

    const event = await prisma.calendarEvent.create({
      data: {
        ...body,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        userId,
      },
      include: {
        task: {
          include: {
            tags: true,
          },
        },
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error creating calendar event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/calendar-events - Update a calendar event
export async function PATCH(request: NextRequest) {
  try {
    const prisma = getPrisma();
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;

    const json = await request.json();
    const { id, ...updates } = json;

    if (!id) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    // Verify event belongs to user
    const existingEvent = await prisma.calendarEvent.findFirst({
      where: { id, userId },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = { ...updates };
    
    // Handle datetime conversions
    if ('startTime' in updates && updates.startTime) {
      updateData.startTime = new Date(updates.startTime);
    }
    
    if ('endTime' in updates && updates.endTime) {
      updateData.endTime = new Date(updates.endTime);
    }

    const event = await prisma.calendarEvent.update({
      where: { id },
      data: updateData,
      include: {
        task: {
          include: {
            tags: true,
          },
        },
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error updating calendar event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/calendar-events - Delete a calendar event
export async function DELETE(request: NextRequest) {
  try {
    const prisma = getPrisma();
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    // Verify event belongs to user
    const existingEvent = await prisma.calendarEvent.findFirst({
      where: { id, userId },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    await prisma.calendarEvent.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
