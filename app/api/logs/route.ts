import { NextRequest, NextResponse } from "next/server";
import { db, logs } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";



export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get("orgId");
    const assistantId = request.nextUrl.searchParams.get("assistantId");
    const level = request.nextUrl.searchParams.get("level");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "100");

    let query = db.select().from(logs);

    const conditions = [];

    if (orgId) {
      conditions.push(eq(logs.orgId, orgId));
    }
    if (assistantId) {
      conditions.push(eq(logs.assistantId, assistantId));
    }
    if (level) {
      conditions.push(eq(logs.level, level as any));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query.orderBy(desc(logs.createdAt)).limit(limit);

    const allLogs = await query;
    return NextResponse.json(allLogs);
  } catch (error) {
    console.error("Error fetching logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}



export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, assistantId, level, message, metadata } = body;

    if (!orgId || !message) {
      return NextResponse.json(
        { error: "orgId and message are required" },
        { status: 400 }
      );
    }

    const [newLog] = await db
      .insert(logs)
      .values({
        orgId,
        assistantId,
        level: level || "info",
        message,
        metadata: metadata || {},
      })
      .returning();

    return NextResponse.json(newLog, { status: 201 });
  } catch (error) {
    console.error("Error creating log:", error);
    return NextResponse.json(
      { error: "Failed to create log" },
      { status: 500 }
    );
  }
}
