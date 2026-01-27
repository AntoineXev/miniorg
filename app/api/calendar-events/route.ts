import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CalendarService } from "@/lib/calendar/calendar-service";
import { getAuthorizedUser } from "@/lib/auth-tauri-server";

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

// Helper function to update a task's duration based on the sum of all linked events
async function updateTaskDurationFromEvents(taskId: string, userId: string) {
  // Get all events linked to this task
  const events = await prisma.calendarEvent.findMany({
    where: { taskId, userId },
    select: { startTime: true, endTime: true },
  });

  if (events.length === 0) {
    // No events, keep the task's existing duration (don't reset to null)
    return;
  }

  // Calculate total duration in minutes
  const totalDuration = events.reduce((sum, event) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    return sum + durationMinutes;
  }, 0);

  // Update the task's duration
  await prisma.task.update({
    where: { id: taskId, userId },
    data: { duration: totalDuration },
  });
}

// GET /api/calendar-events - Fetch all calendar events for authenticated user
export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthorizedUser(request);
    const userId = authResult?.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const taskId = searchParams.get("taskId");

    const where: any = {
      userId,
      // Exclude events where user responded "declined"
      // Note: Must use OR with explicit null check because SQL NULL comparisons don't work with NOT
      OR: [
        { responseStatus: { equals: null } },
        { responseStatus: 'accepted' },
        { responseStatus: 'tentative' },
        { responseStatus: 'needsAction' },
      ],
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
            tag: true,
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
    const authResult = await getAuthorizedUser(request);
    const userId = authResult?.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const body = calendarEventSchema.parse(json);

    const startTime = new Date(body.startTime);
    const endTime = new Date(body.endTime);

    // If taskId is provided, update the task's scheduledDate and auto-determine status
    if (body.taskId) {
      const task = await prisma.task.findUnique({ where: { id: body.taskId, userId } });
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
        userId,
      },
      include: {
        task: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Update task duration based on all linked events
    if (body.taskId) {
      await updateTaskDurationFromEvents(body.taskId, userId);
    }

    // Check if there's an export target connection and export the event
    const exportConnection = await prisma.calendarConnection.findFirst({
      where: {
        userId,
        isExportTarget: true,
        isActive: true,
      },
    });

    if (exportConnection) {
      try {
        const calendarService = new CalendarService();
        await calendarService.exportEvent(exportConnection.id, event.id);
        
        // Refetch the event to get the updated externalId and sync status
        const updatedEvent = await prisma.calendarEvent.findUnique({
          where: { id: event.id },
          include: {
            task: {
              include: {
                tag: true,
              },
            },
          },
        });
        
        return NextResponse.json(updatedEvent || event, { status: 201 });
      } catch (exportError) {
        console.error("Failed to export event to external calendar:", exportError);
        // Update sync status to error but don't fail the request
        await prisma.calendarEvent.update({
          where: { id: event.id },
          data: {
            syncStatus: 'error',
            syncError: exportError instanceof Error ? exportError.message : 'Unknown error',
          },
        });
        // Return the event anyway, it was created locally
        return NextResponse.json(event, { status: 201 });
      }
    }

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
    const authResult = await getAuthorizedUser(request);
    const userId = authResult?.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const { id, ...updates } = json;

    if (!id) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    // Verify event belongs to user
    const existingEvent = await prisma.calendarEvent.findFirst({
      where: { id, userId },
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
              userId,
            },
          });

          // Link the event to the new task
          updateData.taskId = newTask.id;
        } else {
          // Event already has a task, mark it as done
          await prisma.task.update({
            where: { id: existingEvent.taskId, userId },
            data: { status: "done" },
          });
        }
      } else if (isUncompleting && existingEvent.taskId) {
        // If event is being uncompleted and has a task, update task status
        const task = await prisma.task.findUnique({
          where: { id: existingEvent.taskId, userId },
        });
        if (task) {
          // Set status based on whether it has a scheduledDate
          await prisma.task.update({
            where: { id: existingEvent.taskId, userId },
            data: {
              status: task.scheduledDate ? "planned" : "backlog",
            },
          });
        }
      }
    }

    // If startTime is being updated and event is linked to a task, update task's scheduledDate and status
    if (updateData.startTime && existingEvent.taskId) {
      const task = await prisma.task.findUnique({
        where: { id: existingEvent.taskId, userId },
      });
      if (task) {
        await prisma.task.update({
          where: { id: existingEvent.taskId, userId },
          data: {
            scheduledDate: updateData.startTime,
            status: determineTaskStatus(updateData.startTime, task.status),
          },
        });
      }
    }

    // If taskId is being linked (from null to a taskId), update the task
    if ('taskId' in updates && updates.taskId && !existingEvent.taskId) {
      const task = await prisma.task.findUnique({
        where: { id: updates.taskId, userId },
      });
      if (task) {
        const newScheduledDate = updateData.startTime || existingEvent.startTime;
        await prisma.task.update({
          where: { id: updates.taskId, userId },
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
      where: { id, userId },
      data: updateData,
      include: {
        task: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Update task duration if event times changed or taskId changed
    const timesChanged = 'startTime' in updates || 'endTime' in updates;
    const taskIdChanged = 'taskId' in updates;

    if (timesChanged || taskIdChanged) {
      // Update the new task's duration (if any)
      if (event.taskId) {
        await updateTaskDurationFromEvents(event.taskId, userId);
      }
      // Update the old task's duration if taskId was changed
      if (taskIdChanged && existingEvent.taskId && existingEvent.taskId !== event.taskId) {
        await updateTaskDurationFromEvents(existingEvent.taskId, userId);
      }
    }

    // If event is from external calendar (Google, etc.), sync back to provider
    if (existingEvent.externalId && existingEvent.connectionId) {
      console.log("[Calendar Sync] Syncing event to external calendar:", {
        eventId: id,
        externalId: existingEvent.externalId,
        connectionId: existingEvent.connectionId,
      });
      try {
        const calendarService = new CalendarService();
        await calendarService.updateExportedEvent(id);
        console.log("[Calendar Sync] Successfully synced event to external calendar");
      } catch (syncError) {
        console.error("[Calendar Sync] Failed to sync event to external calendar:", syncError);
        // Update sync status to error but don't fail the request
        await prisma.calendarEvent.update({
          where: { id },
          data: {
            syncStatus: 'error',
            syncError: syncError instanceof Error ? syncError.message : 'Unknown error',
          },
        });
      }
    } else {
      console.log("[Calendar Sync] Event not synced (no externalId or connectionId):", {
        eventId: id,
        hasExternalId: !!existingEvent.externalId,
        hasConnectionId: !!existingEvent.connectionId,
      });
    }

    // Refetch the event to get the latest syncStatus
    const finalEvent = await prisma.calendarEvent.findUnique({
      where: { id, userId },
      include: {
        task: {
          include: {
            tag: true,
          },
        },
      },
    });

    return NextResponse.json(finalEvent || event);
  } catch (error) {
    console.error("Error updating calendar event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/calendar-events - Delete a calendar event
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await getAuthorizedUser(request);
    const userId = authResult?.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    // Verify event belongs to user
    const existingEvent = await prisma.calendarEvent.findFirst({
      where: { id, userId },
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

    // Store taskId before deletion
    const linkedTaskId = existingEvent.taskId;

    await prisma.calendarEvent.delete({
      where: { id },
    });

    // If event was linked to a task, update task duration and check if scheduledDate should be cleared
    if (linkedTaskId && existingEvent.task) {
      // Check if there are remaining events for this task
      const remainingEvents = await prisma.calendarEvent.findMany({
        where: { taskId: linkedTaskId, userId },
        select: { startTime: true, endTime: true },
        orderBy: { startTime: 'asc' },
      });

      if (remainingEvents.length === 0) {
        // No more events, clear scheduledDate and update status
        await prisma.task.update({
          where: { id: linkedTaskId, userId },
          data: {
            scheduledDate: null,
            status: determineTaskStatus(null, existingEvent.task.status),
          },
        });
      } else {
        // Recalculate total duration from remaining events
        const totalDuration = remainingEvents.reduce((sum, event) => {
          const start = new Date(event.startTime);
          const end = new Date(event.endTime);
          const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
          return sum + durationMinutes;
        }, 0);

        // Update scheduledDate to earliest remaining event
        await prisma.task.update({
          where: { id: linkedTaskId, userId },
          data: {
            duration: totalDuration,
            scheduledDate: remainingEvents[0].startTime,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
