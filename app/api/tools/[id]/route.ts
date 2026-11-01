import { NextRequest, NextResponse } from "next/server";
import { db, tools } from "@/lib/db";
import { eq } from "drizzle-orm";



const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(uuid: string): boolean {
  return UUID_REGEX.test(uuid);
}



export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    

    if (!isValidUUID(params.id)) {
      return NextResponse.json(
        { 
          error: "Invalid tool ID format",
          details: "Tool ID must be a valid UUID format (e.g., 7a65108d-bacb-4459-a3a0-63a0ca99d0b5). Use GET /api/tools?orgId=... to find your tool IDs."
        },
        { status: 400 }
      );
    }

    const [tool] = await db
      .select()
      .from(tools)
      .where(eq(tools.id, params.id));

    if (!tool) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }

    return NextResponse.json(tool);
  } catch (error) {
    console.error("Error fetching tool:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { 
        error: "Failed to fetch tool",
        details: errorMessage
      },
      { status: 500 }
    );
  }
}



export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    

    if (!isValidUUID(params.id)) {
      return NextResponse.json(
        { 
          error: "Invalid tool ID format",
          details: "Tool ID must be a valid UUID format (e.g., 7a65108d-bacb-4459-a3a0-63a0ca99d0b5). Use GET /api/tools?orgId=... to find your tool IDs."
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, type, description, config, enabled } = body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (config !== undefined) updateData.config = config;
    if (enabled !== undefined) updateData.enabled = enabled;

    const [updatedTool] = await db
      .update(tools)
      .set(updateData)
      .where(eq(tools.id, params.id))
      .returning();

    if (!updatedTool) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }

    return NextResponse.json(updatedTool);
  } catch (error) {
    console.error("Error updating tool:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { 
        error: "Failed to update tool",
        details: errorMessage
      },
      { status: 500 }
    );
  }
}



export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    

    if (!isValidUUID(params.id)) {
      return NextResponse.json(
        { 
          error: "Invalid tool ID format",
          details: "Tool ID must be a valid UUID format (e.g., 7a65108d-bacb-4459-a3a0-63a0ca99d0b5). Use GET /api/tools?orgId=... to find your tool IDs."
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, type, description, config, enabled } = body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (config !== undefined) updateData.config = config;
    if (enabled !== undefined) updateData.enabled = enabled;

    const [updatedTool] = await db
      .update(tools)
      .set(updateData)
      .where(eq(tools.id, params.id))
      .returning();

    if (!updatedTool) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }

    return NextResponse.json(updatedTool);
  } catch (error) {
    console.error("Error updating tool:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { 
        error: "Failed to update tool",
        details: errorMessage
      },
      { status: 500 }
    );
  }
}



export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    

    if (!isValidUUID(params.id)) {
      return NextResponse.json(
        { 
          error: "Invalid tool ID format",
          details: "Tool ID must be a valid UUID format (e.g., 7a65108d-bacb-4459-a3a0-63a0ca99d0b5). Use GET /api/tools?orgId=... to find your tool IDs."
        },
        { status: 400 }
      );
    }

    await db.delete(tools).where(eq(tools.id, params.id));
    return NextResponse.json({ message: "Tool deleted" });
  } catch (error) {
    console.error("Error deleting tool:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { 
        error: "Failed to delete tool",
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
