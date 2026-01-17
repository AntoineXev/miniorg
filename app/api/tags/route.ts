import { NextRequest, NextResponse } from "next/server";
import { getSession, getUserFromSession } from "@/lib/auth-better";
import { getPrisma } from "@/lib/prisma";

// Enable Edge Runtime for Cloudflare Workers
export const runtime = 'edge';

// GET /api/tags - Fetch all tags for authenticated user
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrisma();
    const session = await getSession(request);
    const user = getUserFromSession(session);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tags = await prisma.tag.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/tags - Create a new tag
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrisma();
    const session = await getSession(request);
    const user = getUserFromSession(session);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const { name, color } = json;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const tag = await prisma.tag.create({
      data: {
        name,
        color: color || "#E17C4F",
        userId: user.id,
      },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Tag already exists" }, { status: 400 });
    }
    console.error("Error creating tag:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
