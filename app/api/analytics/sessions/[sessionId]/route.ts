import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  fetchLiveKitSessionDetails,
  getProjectId,
  normalizeSessionDetails,
} from "@/lib/analytics/livekit-cloud";
import { AnalyticsService } from "@/lib/analytics/service";

export const revalidate = 0;

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
    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    const dbDetails = await AnalyticsService.getSessionDetails(sessionId);
    let livekitDetails = null;
    const projectId = getProjectId();
    if (projectId) {
      try {
        const data = await fetchLiveKitSessionDetails(sessionId);
        livekitDetails = normalizeSessionDetails(data);
      } catch (err) {
        console.warn("Failed to fetch LiveKit details:", err);
      }
    }

    if (!dbDetails && !livekitDetails) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({
        ...dbDetails,
        livekit: livekitDetails
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch session details";
    return NextResponse.json(
      { error: message, code: "API_ERROR" },
      { status: 500 }
    );
  }
}
