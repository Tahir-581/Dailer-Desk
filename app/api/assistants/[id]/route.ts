import { NextRequest, NextResponse } from "next/server";
import { db, assistants } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [assistant] = await db
      .select()
      .from(assistants)
      .where(eq(assistants.id, params.id));

    if (!assistant) {
      return NextResponse.json(
        { error: "Assistant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(assistant);
  } catch (error) {
    console.error("Error fetching assistant:", error);
    return NextResponse.json(
      { error: "Failed to fetch assistant" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, description, systemPrompt, status, config, workflowEnabled, workflowId } = body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (systemPrompt !== undefined) updateData.systemPrompt = systemPrompt;
    if (status !== undefined) updateData.status = status;
    if (config !== undefined) updateData.config = config;
    if (workflowEnabled !== undefined) updateData.workflowEnabled = workflowEnabled;
    if (workflowId !== undefined) updateData.workflowId = workflowId;

    const [updatedAssistant] = await db
      .update(assistants)
      .set(updateData)
      .where(eq(assistants.id, params.id))
      .returning();

    if (!updatedAssistant) {
      return NextResponse.json(
        { error: "Assistant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedAssistant);
  } catch (error) {
    console.error("Error updating assistant:", error);
    return NextResponse.json(
      { error: "Failed to update assistant" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.delete(assistants).where(eq(assistants.id, params.id));
    return NextResponse.json({ message: "Assistant deleted" });
  } catch (error) {
    console.error("Error deleting assistant:", error);
    return NextResponse.json(
      { error: "Failed to delete assistant" },
      { status: 500 }
    );
  }
}
