import { NextRequest, NextResponse } from "next/server";
import { db, tools } from "@/lib/db";
import { eq, and } from "drizzle-orm";



export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get("orgId");
    const type = request.nextUrl.searchParams.get("type");
    const enabled = request.nextUrl.searchParams.get("enabled");
    const name = request.nextUrl.searchParams.get("name");
    


    const conditions = [];

    if (orgId) {
      conditions.push(eq(tools.orgId, orgId));
    }
    if (type) {
      conditions.push(eq(tools.type, type));
    }
    if (enabled !== null && enabled !== undefined) {
      conditions.push(eq(tools.enabled, enabled === "true"));
    }
    if (name) {
      conditions.push(eq(tools.name, name));
    }

    let query = db.select().from(tools);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const allTools = await query;
    return NextResponse.json(allTools);
  } catch (error) {
    console.error("Error fetching tools:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { 
        error: "Failed to fetch tools",
        details: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}



export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, name, type, description, config, enabled, createdBy } = body;

    if (!orgId || !name || !type || !config || !createdBy) {
      return NextResponse.json(
        { error: "orgId, name, type, config, and createdBy are required" },
        { status: 400 }
      );
    }

    const [newTool] = await db
      .insert(tools)
      .values({
        orgId,
        name,
        type,
        description,
        config,
        enabled: enabled !== undefined ? enabled : true,
        createdBy,
      })
      .returning();

    return NextResponse.json(newTool, { status: 201 });
  } catch (error) {
    console.error("Error creating tool:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { 
        error: "Failed to create tool",
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
