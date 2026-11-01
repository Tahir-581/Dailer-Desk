import { NextRequest, NextResponse } from "next/server";
import { db, kb } from "@/lib/db";
import { eq } from "drizzle-orm";



export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [kbItem] = await db
      .select()
      .from(kb)
      .where(eq(kb.id, params.id));

    if (!kbItem) {
      return NextResponse.json(
        { error: "Knowledge base item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(kbItem);
  } catch (error) {
    console.error("Error fetching KB:", error);
    return NextResponse.json(
      { error: "Failed to fetch knowledge base item" },
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
    const { name, description, content, metadata } = body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (content !== undefined) updateData.content = content;
    if (metadata !== undefined) updateData.metadata = metadata;

    const [updatedKb] = await db
      .update(kb)
      .set(updateData)
      .where(eq(kb.id, params.id))
      .returning();

    if (!updatedKb) {
      return NextResponse.json(
        { error: "Knowledge base item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedKb);
  } catch (error) {
    console.error("Error updating KB:", error);
    return NextResponse.json(
      { error: "Failed to update knowledge base item" },
      { status: 500 }
    );
  }
}



export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.delete(kb).where(eq(kb.id, params.id));
    return NextResponse.json({ message: "Knowledge base item deleted" });
  } catch (error) {
    console.error("Error deleting KB:", error);
    return NextResponse.json(
      { error: "Failed to delete knowledge base item" },
      { status: 500 }
    );
  }
}
