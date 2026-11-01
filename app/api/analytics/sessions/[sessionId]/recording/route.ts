import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AnalyticsService } from "@/lib/analytics/service";

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
    const signedUrl = await AnalyticsService.generateRecordingSignedUrl(sessionId);
    
    if (!signedUrl) {
        return NextResponse.json({ error: "Recording not found" }, { status: 404 });
    }
    
    return NextResponse.json({ url: signedUrl });
  } catch (error) {
    return NextResponse.json({ error: "Failed to get recording" }, { status: 500 });
  }
}
