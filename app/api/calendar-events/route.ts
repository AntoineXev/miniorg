import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CalendarService } from "@/lib/calendar/calendar-service";

// Schema for calendar event creation/update
const calendarEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  taskId: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  isCompleted: z.boolean().optional(),
  source: z.enum(["miniorg", "google", "outlook"]).optional(),
});

// Helper function to automatically determine task status based on scheduledDate
// This ensures consistent status management across the application
function determineTaskStatus(scheduledDate: Date | null | undefined, currentStatus?: string): string {
  // If explicitly set to "done", keep it
  if (currentStatus === "done") {
    return "done";
  }
  
  // If task has a scheduled date, it's planned
  if (scheduledDate) {
    return "planned";
  }
  
  // Otherwise, it's in the backlog
  return "backlog";
}

// GET /api/calendar-events - Fetch all calendar events for authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const taskId = searchParams.get("taskId");

    const where: any = {
      userId: session.user.id,
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const body = calendarEventSchema.parse(json);

    const startTime = new Date(body.startTime);
    const endTime = new Date(body.endTime);

    // If taskId is provided, update the task's scheduledDate and auto-determine status
    if (body.taskId) {
      const task = await prisma.task.findUnique({ where: { id: body.taskId } });
      if (task) {
        await prisma.task.update({
          where: { id: body.taskId },
          data: {
            scheduledDate: startTime,
            status: determineTaskStatus(startTime, task.status),
          },
        });
      }
    }

    const event = await prisma.calendarEvent.create({
      data: {
        ...body,
        startTime,
        endTime,
        userId: session.user.id,
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const { id, ...updates } = json;

    if (!id) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    // Verify event belongs to user
    const existingEvent = await prisma.calendarEvent.findFirst({
      where: { id, userId: session.user.id },
      include: { connection: true },
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

    // Handle isCompleted logic: auto-import and sync task status
    if ('isCompleted' in updates) {
      const isCompleting = updates.isCompleted === true;
      const isUncompleting = updates.isCompleted === false;

      if (isCompleting) {
        // If event is being completed and has no task, auto-import it
        if (!existingEvent.taskId) {
          // Calculate duration
          const startTime = updateData.startTime || existingEvent.startTime;
          const endTime = updateData.endTime || existingEvent.endTime;
          const durationMinutes = Math.round(
            (endTime.getTime() - startTime.getTime()) / (1000 * 60)
          );

          // Create a new task
          const newTask = await prisma.task.create({
            data: {
              title: existingEvent.title,
              description: existingEvent.description,
              scheduledDate: startTime,
              duration: durationMinutes,
              status: "done", // Mark as done since we're completing the event
              userId: session.user.id,
            },
          });

          // Link the event to the new task
          updateData.taskId = newTask.id;
        } else {
          // Event already has a task, mark it as done
          await prisma.task.update({
            where: { id: existingEvent.taskId },
            data: { status: "done" },
          });
        }
      } else if (isUncompleting && existingEvent.taskId) {
        // If event is being uncompleted and has a task, update task status
        const task = await prisma.task.findUnique({ where: { id: existingEvent.taskId } });
        if (task) {
          // Set status based on whether it has a scheduledDate
          await prisma.task.update({
            where: { id: existingEvent.taskId },
            data: {
              status: task.scheduledDate ? "planned" : "backlog",
            },
          });
        }
      }
    }

    // If startTime is being updated and event is linked to a task, update task's scheduledDate and status
    if (updateData.startTime && existingEvent.taskId) {
      const task = await prisma.task.findUnique({ where: { id: existingEvent.taskId } });
      if (task) {
        await prisma.task.update({
          where: { id: existingEvent.taskId },
          data: {
            scheduledDate: updateData.startTime,
            status: determineTaskStatus(updateData.startTime, task.status),
          },
        });
      }
    }

    // If taskId is being linked (from null to a taskId), update the task
    if ('taskId' in updates && updates.taskId && !existingEvent.taskId) {
      const task = await prisma.task.findUnique({ where: { id: updates.taskId } });
      if (task) {
        const newScheduledDate = updateData.startTime || existingEvent.startTime;
        await prisma.task.update({
          where: { id: updates.taskId },
          data: {
            scheduledDate: newScheduledDate,
            status: determineTaskStatus(newScheduledDate, task.status),
          },
        });
      }
    }

    // Mark as pending sync if it's an external event (will be synced next)
    if (existingEvent.externalId && existingEvent.connectionId) {
      updateData.syncStatus = 'pending';
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

    // If event is from external calendar (Google, etc.), sync back to provider
    if (existingEvent.externalId && existingEvent.connectionId) {
      try {
        const calendarService = new CalendarService();
        await calendarService.updateExportedEvent(id);
      } catch (syncError) {
        console.error("Failed to sync event to external calendar:", syncError);
        // Update sync status to error but don't fail the request
        await prisma.calendarEvent.update({
          where: { id },
          data: {
            syncStatus: 'error',
            syncError: syncError instanceof Error ? syncError.message : 'Unknown error',
          },
        });
      }
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error updating calendar event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/calendar-events - Delete a calendar event
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    // Verify event belongs to user
    const existingEvent = await prisma.calendarEvent.findFirst({
      where: { id, userId: session.user.id },
      include: { task: true, connection: true },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // If event is from external calendar (Google, etc.), delete from provider first
    if (existingEvent.externalId && existingEvent.connectionId) {
      try {
        const calendarService = new CalendarService();
        await calendarService.deleteExportedEvent(id);
      } catch (syncError) {
        console.error("Failed to delete event from external calendar:", syncError);
        // Continue with local deletion even if external deletion fails
      }
    }

    // If event is linked to a task, clear scheduledDate and auto-determine status
    if (existingEvent.taskId && existingEvent.task) {
      await prisma.task.update({
        where: { id: existingEvent.taskId },
        data: {
          scheduledDate: null,
          status: determineTaskStatus(null, existingEvent.task.status),
        },
      });
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
