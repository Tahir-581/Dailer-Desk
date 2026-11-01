import { NextRequest, NextResponse } from "next/server";
import { db, logs } from "@/lib/db";
import { eq } from "drizzle-orm";



export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [log] = await db
      .select()
      .from(logs)
      .where(eq(logs.id, params.id));

    if (!log) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 });
    }

    return NextResponse.json(log);
  } catch (error) {
    console.error("Error fetching log:", error);
    return NextResponse.json(
      { error: "Failed to fetch log" },
      { status: 500 }
    );
  }
}



export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.delete(logs).where(eq(logs.id, params.id));
    return NextResponse.json({ message: "Log deleted" });
  } catch (error) {
    console.error("Error deleting log:", error);
    return NextResponse.json(
      { error: "Failed to delete log" },
      { status: 500 }
    );
  }
}
