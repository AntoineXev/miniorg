import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for task creation/update
const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["backlog", "planned", "done"]).optional(),
  scheduledDate: z.string().datetime().optional(),
  deadlineType: z.enum(["next_3_days", "next_week", "next_month", "next_quarter", "next_year", "no_date"]).optional(),
  deadlineSetAt: z.string().datetime().optional(),
  duration: z.number().int().min(1).optional(), // Duration in minutes
  tagIds: z.array(z.string()).optional(),
});

// GET /api/tasks - Fetch all tasks for authenticated user
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrisma();
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;

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
        tags: true,
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
    const prisma = getPrisma();
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;

    const json = await request.json();
    const body = taskSchema.parse(json);

    const { tagIds, ...taskData } = body;

    const task = await prisma.task.create({
      data: {
        ...taskData,
        userId,
        scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : null,
        deadlineSetAt: body.deadlineSetAt ? new Date(body.deadlineSetAt) : body.deadlineType ? new Date() : null,
        tags: tagIds ? {
          connect: tagIds.map((id) => ({ id })),
        } : undefined,
      },
      include: {
        tags: true,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error creating task:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/tasks/:id - Update a task
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
      return NextResponse.json({ error: "Task ID required" }, { status: 400 });
    }

    // Verify task belongs to user
    const existingTask = await prisma.task.findFirst({
      where: { id, userId },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const { tagIds, ...taskData } = updates;

    // Prepare update data, handling null values correctly
    const updateData: any = { ...taskData };
    
    // Handle scheduledDate - convert to Date if string, keep null if null
    if ('scheduledDate' in updates) {
      updateData.scheduledDate = updates.scheduledDate ? new Date(updates.scheduledDate) : null;
    }
    
    // Handle completedAt based on status
    if ('status' in updates) {
      updateData.completedAt = updates.status === "done" && !existingTask.completedAt ? new Date() : updates.status !== "done" ? null : undefined;
    }
    
    // Handle tags
    if (tagIds) {
      updateData.tags = {
        set: tagIds.map((id: string) => ({ id })),
      };
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        tags: true,
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
    const prisma = getPrisma();
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;

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
