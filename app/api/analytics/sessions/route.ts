import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AnalyticsService } from "@/lib/analytics/service";
import { db, orgMemberships, callSessions } from "@/lib/db";
import { eq, and, gte, lte, desc, count } from "drizzle-orm";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    const currentOrgId = cookieStore.get("current_org_id")?.value;
    const memberships = await db
      .select({ orgId: orgMemberships.orgId })
      .from(orgMemberships)
      .where(eq(orgMemberships.userId, session.user.id));
    const orgId = (currentOrgId && memberships.some((m) => m.orgId === currentOrgId))
      ? currentOrgId
      : memberships[0]?.orgId;
    if (!orgId) {
      return NextResponse.json(
        { error: "No organization selected" },
        { status: 400 }
      );
    }
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get("page") || "0");
    const limit = parseInt(searchParams.get("limit") || "50");
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const assistantId = searchParams.get("assistantId");
    
    const startDate = start ? new Date(start) : undefined;
    const endDate = end ? new Date(end) : undefined;
    
    const conditions = [
      eq(callSessions.orgId, orgId),
    ];

    if (startDate) {
      conditions.push(gte(callSessions.startTime, startDate));
    }
    if (endDate) {
      conditions.push(lte(callSessions.startTime, endDate));
    }
    if (assistantId) {
      conditions.push(eq(callSessions.assistantId, assistantId));
    }

    const [totalResult] = await db
      .select({
        total: count(callSessions.id),
      })
      .from(callSessions)
      .where(and(...conditions));

    const total = totalResult.total;

    const sessions = await db
      .select({
        id: callSessions.id,
        direction: callSessions.direction,
        callerNumber: callSessions.callerNumber,
        calleeNumber: callSessions.calleeNumber,
        startTime: callSessions.startTime,
        endTime: callSessions.endTime,
        duration: callSessions.duration,
        outcome: callSessions.outcome,
        recordingUrl: callSessions.recordingUrl,
        transferTarget: callSessions.transferTarget,
        sentimentScore: callSessions.sentimentScore,
        assistantId: callSessions.assistantId,
        createdAt: callSessions.createdAt,
      })
      .from(callSessions)
      .where(and(...conditions))
      .orderBy(desc(callSessions.startTime))
      .limit(limit)
      .offset(page * limit);

    return NextResponse.json({
      sessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      filters: {
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        assistantId,
      },
    });
  } catch (error) {
    console.error("Call sessions API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch call sessions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    const currentOrgId = cookieStore.get("current_org_id")?.value;
    const memberships = await db
      .select({ orgId: orgMemberships.orgId })
      .from(orgMemberships)
      .where(eq(orgMemberships.userId, session.user.id));
    const orgId = (currentOrgId && memberships.some((m) => m.orgId === currentOrgId))
      ? currentOrgId
      : memberships[0]?.orgId;
    if (!orgId) {
      return NextResponse.json(
        { error: "No organization selected" },
        { status: 400 }
      );
    }
    const body = await request.json();

    const startTime = body.startTime ? new Date(body.startTime) : undefined;
    const endTime = body.endTime ? new Date(body.endTime) : undefined;

    const callSession = await AnalyticsService.recordCallSession({
      ...body,
      orgId,
      startTime,
      endTime,
    });

    return NextResponse.json({
      session: callSession,
    });
  } catch (error) {
    console.error("Call sessions API error:", error);
    return NextResponse.json(
      { error: "Failed to create call session" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const sessionId = body.sessionId as string | undefined;
    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    const endTime = body.endTime ? new Date(body.endTime) : undefined;

    const updated = await AnalyticsService.updateCallSession(sessionId, {
      endTime,
      duration: body.duration,
      outcome: body.outcome,
      recordingUrl: body.recordingUrl,
      transferTarget: body.transferTarget,
      sentimentScore: body.sentimentScore,
      metadata: body.metadata,
    });

    return NextResponse.json({ session: updated });
  } catch (error) {
    console.error("Call sessions API error:", error);
    return NextResponse.json(
      { error: "Failed to update call session" },
      { status: 500 }
    );
  }
}
