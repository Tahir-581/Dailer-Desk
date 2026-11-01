import { NextRequest, NextResponse } from "next/server";
import { db, assistants } from "@/lib/db";
import { eq } from "drizzle-orm";


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [assistant] = await db
      .select({ systemPrompt: assistants.systemPrompt })
      .from(assistants)
      .where(eq(assistants.id, params.id))
      .limit(1);

    if (!assistant) {
      return NextResponse.json(
        { error: "Assistant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        assistantId: params.id,
        systemPrompt: assistant.systemPrompt || null,
        updatedAt: new Date().toISOString()
      },
      { 
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error) {
    console.error("Error fetching system prompt:", error);
    return NextResponse.json(
      { error: "Failed to fetch system prompt" },
      { status: 500 }
    );
  }
}

