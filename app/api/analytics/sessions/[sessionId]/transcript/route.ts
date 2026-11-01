import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { TranscriptionService } from "@/lib/transcription-service";

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
    if (body.segments) {
        for (const segment of body.segments) {
            await TranscriptionService.saveSegment(sessionId, segment);
        }
    }
    
    if (body.finalize) {
        await TranscriptionService.finalizeTranscript(sessionId);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save transcript" }, { status: 500 });
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
    const transcript = await TranscriptionService.getTranscript(sessionId);
    
    return NextResponse.json(transcript);
  } catch (error) {
    return NextResponse.json({ error: "Failed to get transcript" }, { status: 500 });
  }
}
