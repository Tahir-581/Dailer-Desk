import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { callSessions, assistants } from "@/lib/db/schema";
import { and, eq, gte, lte, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session || !session.session.activeOrganizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orgId = session.session.activeOrganizationId;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const assistantId = searchParams.get("assistantId");

    const conditions = [eq(callSessions.orgId, orgId)];
    if (startDate) conditions.push(gte(callSessions.startTime, new Date(startDate)));
    if (endDate) conditions.push(lte(callSessions.startTime, new Date(endDate)));
    if (assistantId) conditions.push(eq(callSessions.assistantId, assistantId));

    const sessions = await db
      .select({
        id: callSessions.id,
        assistantName: assistants.name,
        callerNumber: callSessions.callerNumber,
        calleeNumber: callSessions.calleeNumber,
        direction: callSessions.direction,
        startTime: callSessions.startTime,
        duration: callSessions.duration,
        outcome: callSessions.outcome,
        sentimentScore: callSessions.sentimentScore,
        recordingUrl: callSessions.recordingUrl,
      })
      .from(callSessions)
      .leftJoin(assistants, eq(callSessions.assistantId, assistants.id))
      .where(and(...conditions))
      .orderBy(desc(callSessions.startTime));

    const headers = [
      "Session ID",
      "Assistant",
      "Caller",
      "Callee",
      "Direction",
      "Start Time",
      "Duration (s)",
      "Outcome",
      "Sentiment",
      "Recording URL"
    ];

    const csvRows = [headers.join(",")];
    
    for (const session of sessions) {
      csvRows.push([
        session.id,
        `"${session.assistantName || ""}"`,
        session.callerNumber || "",
        session.calleeNumber || "",
        session.direction,
        session.startTime.toISOString(),
        session.duration || 0,
        session.outcome || "",
        session.sentimentScore || "",
        session.recordingUrl || ""
      ].join(","));
    }

    const csvContent = csvRows.join("\n");
    
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="call-history-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error) {
    console.error("Export failed:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
