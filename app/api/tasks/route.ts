import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for task creation/update
const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  status: z.enum(["backlog", "planned", "done"]).optional(),
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const scheduledDate = searchParams.get("scheduledDate");

    const where: any = {
      userId: session.user.id,
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const json = await request.json();
    const body = taskSchema.parse(json);

    const scheduledDate = body.scheduledDate ? new Date(body.scheduledDate) : null;
    
    // Automatically determine status based on scheduledDate
    // Unless explicitly set to "done" by the client
    const status = determineTaskStatus(scheduledDate, body.status);

    const task = await prisma.task.create({
      data: {
        ...body,
        status,
        userId: session.user.id,
        scheduledDate,
        deadlineSetAt: body.deadlineSetAt ? new Date(body.deadlineSetAt) : body.deadlineType ? new Date() : null,
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const { id, ...updates } = json;

    if (!id) {
      return NextResponse.json({ error: "Task ID required" }, { status: 400 });
    }

    // Verify task belongs to user
    const existingTask = await prisma.task.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const taskData = updates;

    // Prepare update data, handling null values correctly
    const updateData: any = { ...taskData };
    
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
    
    if (finalStatus === "done" && !existingTask.completedAt) {
      // Task is being marked as done - set completedAt
      updateData.completedAt = new Date();
      
      // If task has a scheduled date in the past, update it to today
      const taskScheduledDate = newScheduledDate || existingTask.scheduledDate;
      if (taskScheduledDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const scheduledDate = new Date(taskScheduledDate);
        scheduledDate.setHours(0, 0, 0, 0);
        
        if (scheduledDate < today) {
          // Update scheduled date to today (preserving time if there was one)
          const originalTime = new Date(taskScheduledDate);
          const updatedDate = new Date();
          updatedDate.setHours(originalTime.getHours(), originalTime.getMinutes(), originalTime.getSeconds(), originalTime.getMilliseconds());
          updateData.scheduledDate = updatedDate;
        }
      }
    } else if (finalStatus !== "done" && existingTask.completedAt) {
      // Task is being unmarked as done - clear completedAt
      updateData.completedAt = null;
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
          },
        },
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/tasks/:id - Delete a task
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Task ID required" }, { status: 400 });
    }

    // Verify task belongs to user
    const existingTask = await prisma.task.findFirst({
      where: { id, userId: session.user.id },
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
