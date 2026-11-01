import { AnalyticsService } from "./analytics/service";
import { StorageService } from "./storage-service";

export interface TranscriptSegment {
  speaker: string;
  text: string;
  startTime: number;
  endTime: number;
  confidence?: number;
  sentiment?: number;
}

export class TranscriptionService {
  static async saveSegment(sessionId: string, segment: TranscriptSegment) {
    // Save single segment to DB
    await AnalyticsService.saveTranscriptSegments(sessionId, [segment]);
  }

  static async finalizeTranscript(sessionId: string): Promise<string> {
    const segments = await AnalyticsService.getTranscriptSegments(sessionId);
    
    // Combine segments into full text
    const transcriptText = segments
      .map(s => `[${Number(s.startTime).toFixed(2)} - ${s.speaker}]: ${s.text}`)
      .join('\n');
      
    // Save full transcript text to DB
    await AnalyticsService.saveTranscript(sessionId, transcriptText);
    
    // Also save to Storage (JSON format)
    await StorageService.uploadTranscript(sessionId, JSON.stringify(segments, null, 2));
    
    return transcriptText;
  }

  static async getTranscript(sessionId: string) {
    const segments = await AnalyticsService.getTranscriptSegments(sessionId);
    const session = await AnalyticsService.getSessionDetails(sessionId);
    
    return {
      text: session?.transcript || "",
      segments
    };
  }
}
