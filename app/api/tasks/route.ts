import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorizedUser } from "@/lib/auth-tauri-server";
import { z } from "zod";

// Schema for task creation/update
const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  status: z.enum(["backlog", "planned", "done"]).optional(),
  type: z.enum(["normal", "highlight"]).optional(),
  scheduledDate: z.string().datetime().optional(),
  deadlineType: z.enum(["next_3_days", "next_week", "next_month", "next_quarter", "next_year", "no_date"]).optional(),
  deadlineSetAt: z.string().datetime().optional(),
  duration: z.number().int().min(1).optional(), // Duration in minutes
  tagId: z.string().nullable().optional(),
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

// GET /api/tasks - Fetch all tasks for authenticated user
export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthorizedUser(request);
    const userId = authResult?.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const scheduledDate = searchParams.get("scheduledDate");

    const where: any = {
      userId,
    };

    if (status) {
      where.status = status;
    }

    if (scheduledDate) {
      const date = new Date(scheduledDate);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      where.scheduledDate = {
        gte: date,
        lt: nextDay,
      };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        tag: true,
        calendarEvents: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            source: true,
          },
        },
      },
      orderBy: [
        { order: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthorizedUser(request);
    const userId = authResult?.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const json = await request.json();
    const body = taskSchema.parse(json);

    const scheduledDate = body.scheduledDate ? new Date(body.scheduledDate) : null;

    // Automatically determine status based on scheduledDate
    // Unless explicitly set to "done" by the client
    const status = determineTaskStatus(scheduledDate, body.status);

    // Extract tagId separately - use undefined instead of null for Prisma optional relations
    const { tagId, ...restBody } = body;

    const createData = {
      title: restBody.title,
      description: restBody.description || null,
      status,
      type: restBody.type || "normal",
      userId,
      scheduledDate,
      deadlineType: restBody.deadlineType || null,
      deadlineSetAt: body.deadlineSetAt ? new Date(body.deadlineSetAt) : body.deadlineType ? new Date() : null,
      duration: restBody.duration || null,
      // Only set tagId if it's a valid non-empty string
      ...(tagId && typeof tagId === 'string' && tagId.length > 0 ? { tagId } : {}),
    };

    console.log("Creating task with data:", JSON.stringify(createData, null, 2));

    // Verify user exists
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      console.error("User not found in database:", userId);
      return NextResponse.json({ error: "User not found - please log out and log back in" }, { status: 401 });
    }

    const task = await prisma.task.create({
      data: createData,
      include: {
        tag: true,
        calendarEvents: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            source: true,
          },
        },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error creating task:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// PATCH /api/tasks/:id - Update a task
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await getAuthorizedUser(request);
    const userId = authResult?.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const { id, deleteEventIds, ...updates } = json;

    if (!id) {
      return NextResponse.json({ error: "Task ID required" }, { status: 400 });
    }

    // Verify task belongs to user
    const existingTask = await prisma.task.findFirst({
      where: { id, userId },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Prepare update data, handling null values correctly
    const { tagId, ...taskData } = updates;
    const updateData: any = { ...taskData };

    // Handle tagId - only include if explicitly provided in updates
    // null means "remove tag", undefined/missing means "don't change"
    if ('tagId' in updates) {
      updateData.tagId = tagId || null; // Convert empty string to null as well
    }
    
    // Handle scheduledDate - convert to Date if string, keep null if null
    if ('scheduledDate' in updates) {
      updateData.scheduledDate = updates.scheduledDate ? new Date(updates.scheduledDate) : null;
    }
    
    // Automatically determine status based on scheduledDate and current status
    // This ensures tasks are automatically moved between backlog/planned/done
    const newScheduledDate = 'scheduledDate' in updates 
      ? updateData.scheduledDate 
      : existingTask.scheduledDate;
    const newStatus = 'status' in updates ? updates.status : existingTask.status;
    
    // Special case: if status is explicitly set to empty string, null, or undefined when task is "done",
    // treat it as "uncompleting" the task
    const isExplicitlyUncheckingDoneTask = 
      existingTask.status === "done" && 
      'status' in updates && 
      (updates.status === "" || updates.status === null || updates.status === undefined);
    
    // Auto-determine status in these cases:
    // 1. Status is not explicitly being set AND task is not currently "done"
    // 2. Status is not explicitly being set BUT scheduledDate IS being changed (even if currently "done")
    // 3. Task is being explicitly "unchecked" from done status
    const shouldAutoDetermineStatus = (!('status' in updates) && (
      existingTask.status !== "done" || 'scheduledDate' in updates
    )) || isExplicitlyUncheckingDoneTask;
    
    if (shouldAutoDetermineStatus) {
      // When auto-determining, don't pass current status if it's "done" - let it be redetermined
      const statusForDetermination = (existingTask.status === "done" || isExplicitlyUncheckingDoneTask) ? undefined : newStatus;
      updateData.status = determineTaskStatus(newScheduledDate, statusForDetermination);
    }
    
    // Handle completedAt based on final status (either explicitly set or auto-determined)
    const finalStatus = updateData.status || ('status' in updates ? updates.status : existingTask.status);
    const isBeingMarkedAsDone = finalStatus === "done" && existingTask.status !== "done";

    if (finalStatus === "done" && !existingTask.completedAt) {
      // Task is being marked as done - set completedAt
      // Note: We keep the original scheduledDate even if it's in the past,
      // so that uncompleting the task returns it to its original overdue state
      updateData.completedAt = new Date();
    } else if (finalStatus !== "done" && existingTask.completedAt) {
      // Task is being unmarked as done - clear completedAt
      updateData.completedAt = null;
    }

    // When task is being marked as done, update the last miniorg event for today
    if (isBeingMarkedAsDone) {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);

      // Get all miniorg events for this task scheduled for today
      const todayMiniorgEvents = await prisma.calendarEvent.findMany({
        where: {
          taskId: id,
          userId,
          source: "miniorg",
          startTime: {
            gte: todayStart,
            lt: todayEnd,
          },
        },
        orderBy: { endTime: "desc" },
      });

      if (todayMiniorgEvents.length > 0) {
        const lastEvent = todayMiniorgEvents[0];
        const originalDuration = new Date(lastEvent.endTime).getTime() - new Date(lastEvent.startTime).getTime();

        // Round current time to nearest 5 minutes
        const roundedNow = new Date(Math.round(now.getTime() / (5 * 60 * 1000)) * (5 * 60 * 1000));

        // Calculate new start time to keep the same duration
        const newStartTime = new Date(roundedNow.getTime() - originalDuration);

        // Update the event
        await prisma.calendarEvent.update({
          where: { id: lastEvent.id },
          data: {
            startTime: newStartTime,
            endTime: roundedNow,
          },
        });
      }
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        tag: true,
        calendarEvents: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            source: true,
          },
        },
      },
    });

    // Delete calendar events if requested (when rescheduling task)
    if (deleteEventIds && Array.isArray(deleteEventIds) && deleteEventIds.length > 0) {
      await prisma.calendarEvent.deleteMany({
        where: {
          id: { in: deleteEventIds },
          source: "miniorg", // Safety: only delete user-created events, not external ones
          userId,
        },
      });

      // Filter out deleted events from the response
      task.calendarEvents = task.calendarEvents.filter(
        (event) => !deleteEventIds.includes(event.id)
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/tasks/:id - Delete a task
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
      return NextResponse.json({ error: "Task ID required" }, { status: 400 });
    }

    // Verify task belongs to user
    const existingTask = await prisma.task.findFirst({
      where: { id, userId },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
