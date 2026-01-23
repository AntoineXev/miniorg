import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorizedUser } from "@/lib/auth-tauri-server";

// GET /api/tags - Fetch all tags for authenticated user with hierarchy
export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthorizedUser(request);
    const userId = authResult?.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tags = await prisma.tag.findMany({
      where: {
        userId,
      },
      include: {
        children: {
          orderBy: {
            name: "asc",
          },
        },
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

// POST /api/tags - Create a new tag (channel or sub-channel)
export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthorizedUser(request);
    const userId = authResult?.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const { name, color, isPersonal, isDefault, parentId } = json;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // If setting as default, unset other defaults first
    if (isDefault) {
      await prisma.tag.updateMany({
        where: {
          userId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const tag = await prisma.tag.create({
      data: {
        name,
        color: color || "#E17C4F",
        isPersonal: isPersonal || false,
        isDefault: isDefault || false,
        parentId: parentId || null,
        userId,
      },
      include: {
        children: true,
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

// PATCH /api/tags - Update a tag
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await getAuthorizedUser(request);
    const userId = authResult?.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Tag ID is required" }, { status: 400 });
    }

    const json = await request.json();
    const { name, color, isPersonal, isDefault, parentId } = json;

    // Verify tag belongs to user
    const existingTag = await prisma.tag.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingTag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    // If setting as default, unset other defaults first
    if (isDefault && !existingTag.isDefault) {
      await prisma.tag.updateMany({
        where: {
          userId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const tag = await prisma.tag.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(color !== undefined && { color }),
        ...(isPersonal !== undefined && { isPersonal }),
        ...(isDefault !== undefined && { isDefault }),
        ...(parentId !== undefined && { parentId }),
      },
      include: {
        children: true,
      },
    });

    return NextResponse.json(tag);
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Tag name already exists" }, { status: 400 });
    }
    console.error("Error updating tag:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/tags - Delete a tag (cascades to children and unlinks from tasks)
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
      return NextResponse.json({ error: "Tag ID is required" }, { status: 400 });
    }

    // Verify tag belongs to user
    const existingTag = await prisma.tag.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingTag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    await prisma.tag.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tag:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
