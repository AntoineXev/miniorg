import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorizedUser } from "@/lib/auth-tauri-server";
import { z } from "zod";
import { startOfDay, addDays } from "date-fns";

// Schema for rollover request
const rolloverSchema = z.object({
  taskIds: z.array(z.string()).min(1),
  targetDate: z.string().optional(), // ISO date string, defaults to tomorrow
});

// POST /api/tasks/rollover
// Rolls over tasks to a new date (default: tomorrow) and increments rollupCount
export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthorizedUser(request);
    const userId = authResult?.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const body = rolloverSchema.parse(json);

    // Default to tomorrow if no target date provided
    const targetDate = body.targetDate
      ? startOfDay(new Date(body.targetDate))
      : startOfDay(addDays(new Date(), 1));

    // Update all tasks in a transaction
    const updatedTasks = await prisma.$transaction(
      body.taskIds.map((taskId) =>
        prisma.task.update({
          where: {
            id: taskId,
            userId, // Ensure user owns the task
          },
          data: {
            scheduledDate: targetDate,
            rollupCount: {
              increment: 1,
            },
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
        })
      )
    );

    return NextResponse.json({
      success: true,
      count: updatedTasks.length,
      tasks: updatedTasks,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error rolling over tasks:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
