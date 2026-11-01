import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AIAnalysisService } from "@/lib/ai-analysis-service";
import { AnalyticsService } from "@/lib/analytics/service";
import { db, orgMemberships } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { sessionId } = await params;
    const body = await req.json();
    const callSession = await AnalyticsService.getSessionDetails(sessionId);
    if (!callSession) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    
    const memberships = await db
      .select({ orgId: orgMemberships.orgId })
      .from(orgMemberships)
      .where(eq(orgMemberships.userId, session.user.id));

    const isMember = memberships.some((m) => m.orgId === callSession.orgId);
    if (!isMember) {
      return NextResponse.json({ error: "Unauthorized for this session" }, { status: 403 });
    }
    const result = await AIAnalysisService.analyzeCall(sessionId, callSession.orgId);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to analyze call" }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await params;
    const analysis = await AnalyticsService.getCallAnalysis(sessionId);
    
    return NextResponse.json(analysis || {});
  } catch (error) {
    return NextResponse.json({ error: "Failed to get analysis" }, { status: 500 });
  }
}
