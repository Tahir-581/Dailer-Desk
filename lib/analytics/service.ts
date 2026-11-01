import { db } from "@/lib/db";
import { 
  callSessions, 
  assistants, 
  callAnalysis, 
  transcriptSegments, 
  analysisDefinitions 
} from "@/lib/db/schema";
import { and, eq, gte, lte, sql, desc, count, avg, sum } from "drizzle-orm";
import { StorageService } from "@/lib/storage-service";

export interface AnalyticsFilters {
  orgId: string;
  startDate?: Date;
  endDate?: Date;
  assistantId?: string;
}

export interface CallMetrics {
  totalCalls: number;
  answeredCalls: number;
  missedCalls: number;
  abandonedCalls: number;
  averageDuration: number;
  totalDuration: number;
  transferRate: number;
  completionRate: number;
  averageSentiment: number;
}

export interface TimeSeriesData {
  date: string;
  calls: number;
  answered: number;
  missed: number;
  abandoned: number;
  duration: number; // total duration
  avgDuration: number;
  avgLatency: number;
  transfers: number;
  sentiment: number;
  completed: number; // successful
}

export interface OutcomeBreakdown {
  outcome: string;
  count: number;
  percentage: number;
}

export interface AssistantPerformance {
  assistantId: string;
  assistantName: string;
  totalCalls: number;
  answeredCalls: number;
  averageDuration: number;
  transferRate: number;
  averageSentiment: number;
}

export interface DirectionBreakdown {
  direction: 'inbound' | 'outbound';
  count: number;
  percentage: number;
}

export interface HourlyActivity {
  hour: number;
  calls: number;
  answered: number;
  missed: number;
  abandoned: number;
}

export interface DurationBucket {
  bucket: string;
  count: number;
  percentage: number;
}

export interface SentimentBucket {
  bucket: string;
  count: number;
  percentage: number;
}

export class AnalyticsService {
  static async getCallMetrics(filters: AnalyticsFilters): Promise<CallMetrics> {
    const conditions = [
      eq(callSessions.orgId, filters.orgId),
    ];

    if (filters.startDate) {
      conditions.push(gte(callSessions.startTime, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(callSessions.startTime, filters.endDate));
    }
    if (filters.assistantId) {
      conditions.push(eq(callSessions.assistantId, filters.assistantId));
    }

    const [metrics] = await db
      .select({
        totalCalls: count(callSessions.id),
        answeredCalls: sql<number>`count(case when ${callSessions.outcome} = 'completed' then 1 end)`,
        missedCalls: sql<number>`count(case when ${callSessions.outcome} = 'busy' then 1 end)`,
        abandonedCalls: sql<number>`count(case when ${callSessions.outcome} = 'abandoned' then 1 end)`,
        averageDuration: avg(callSessions.duration),
        totalDuration: sum(callSessions.duration),
        transferRate: sql<number>`count(case when ${callSessions.transferTarget} is not null then 1 end) * 100.0 / nullif(count(${callSessions.id}), 0)`,
        completionRate: sql<number>`count(case when ${callSessions.outcome} = 'completed' then 1 end) * 100.0 / nullif(count(${callSessions.id}), 0)`,
        averageSentiment: avg(callSessions.sentimentScore),
      })
      .from(callSessions)
      .where(and(...conditions));

    return {
      totalCalls: metrics.totalCalls || 0,
      answeredCalls: metrics.answeredCalls || 0,
      missedCalls: metrics.missedCalls || 0,
      abandonedCalls: metrics.abandonedCalls || 0,
      averageDuration: Math.round(Number(metrics.averageDuration) || 0),
      totalDuration: Number(metrics.totalDuration) || 0,
      transferRate: Math.round((Number(metrics.transferRate) || 0) * 100) / 100,
      completionRate: Math.round((Number(metrics.completionRate) || 0) * 100) / 100,
      averageSentiment: Math.round((Number(metrics.averageSentiment) || 0) * 100) / 100,
    };
  }

  static async getTimeSeriesData(filters: AnalyticsFilters): Promise<TimeSeriesData[]> {
    const conditions = [
      eq(callSessions.orgId, filters.orgId),
    ];

    if (filters.startDate) {
      conditions.push(gte(callSessions.startTime, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(callSessions.startTime, filters.endDate));
    }
    if (filters.assistantId) {
      conditions.push(eq(callSessions.assistantId, filters.assistantId));
    }

    const data = await db
      .select({
        date: sql<string>`to_char(${callSessions.startTime}, 'YYYY-MM-DD')`,
        calls: count(callSessions.id),
        answered: sql<number>`count(case when ${callSessions.outcome} = 'completed' then 1 end)`,
        missed: sql<number>`count(case when ${callSessions.outcome} = 'busy' then 1 end)`,
        abandoned: sql<number>`count(case when ${callSessions.outcome} = 'abandoned' then 1 end)`,
        completed: sql<number>`count(case when ${callSessions.outcome} = 'completed' then 1 end)`,
        duration: sql<number>`coalesce(sum(${callSessions.duration}), 0)`,
        avgDuration: sql<number>`coalesce(avg(${callSessions.duration}), 0)`,
        avgLatency: sql<number>`coalesce(avg(${callSessions.latency}), 0)`,
        transfers: sql<number>`count(case when ${callSessions.transferTarget} is not null then 1 end)`,
        sentiment: sql<number>`coalesce(avg(${callSessions.sentimentScore}), 0)`,
      })
      .from(callSessions)
      .where(and(...conditions))
      .groupBy(sql`to_char(${callSessions.startTime}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${callSessions.startTime}, 'YYYY-MM-DD')`);

    return data.map(row => ({
      date: row.date,
      calls: row.calls,
      answered: row.answered,
      missed: row.missed,
      abandoned: row.abandoned,
      duration: row.duration,
      avgDuration: Math.round(row.avgDuration),
      avgLatency: Math.round(row.avgLatency),
      completed: row.completed,
      transfers: row.transfers,
      sentiment: Math.round(row.sentiment * 100) / 100,
    }));
  }

  static async getOutcomeBreakdown(filters: AnalyticsFilters): Promise<OutcomeBreakdown[]> {
    const conditions = [
      eq(callSessions.orgId, filters.orgId),
    ];

    if (filters.startDate) {
      conditions.push(gte(callSessions.startTime, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(callSessions.startTime, filters.endDate));
    }
    if (filters.assistantId) {
      conditions.push(eq(callSessions.assistantId, filters.assistantId));
    }

    const totalResult = await db
      .select({
        total: count(callSessions.id),
      })
      .from(callSessions)
      .where(and(...conditions));

    const total = totalResult[0]?.total || 1;

    const breakdown = await db
      .select({
        outcome: callSessions.outcome,
        count: count(callSessions.id),
      })
      .from(callSessions)
      .where(and(...conditions))
      .groupBy(callSessions.outcome)
      .orderBy(desc(count(callSessions.id)));

    return breakdown.map(row => ({
      outcome: row.outcome || 'unknown',
      count: row.count,
      percentage: Math.round((row.count / total) * 100 * 100) / 100,
    }));
  }

  static async getAssistantPerformance(filters: AnalyticsFilters): Promise<AssistantPerformance[]> {
    const conditions = [
      eq(callSessions.orgId, filters.orgId),
      eq(assistants.status, 'active'),
    ];

    if (filters.startDate) {
      conditions.push(gte(callSessions.startTime, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(callSessions.startTime, filters.endDate));
    }
    if (filters.assistantId) {
      conditions.push(eq(callSessions.assistantId, filters.assistantId));
    }

    const performance = await db
      .select({
        assistantId: assistants.id,
        assistantName: assistants.name,
        totalCalls: count(callSessions.id),
        answeredCalls: sql<number>`count(case when ${callSessions.outcome} = 'completed' then 1 end)`,
        averageDuration: avg(callSessions.duration),
        transferRate: sql<number>`count(case when ${callSessions.transferTarget} is not null then 1 end) * 100.0 / nullif(count(${callSessions.id}), 0)`,
        averageSentiment: avg(callSessions.sentimentScore),
      })
      .from(callSessions)
      .innerJoin(assistants, eq(callSessions.assistantId, assistants.id))
      .where(and(...conditions))
      .groupBy(assistants.id, assistants.name)
      .orderBy(desc(count(callSessions.id)));

    return performance.map(row => ({
      assistantId: row.assistantId,
      assistantName: row.assistantName,
      totalCalls: row.totalCalls,
      answeredCalls: row.answeredCalls,
      averageDuration: Math.round(Number(row.averageDuration) || 0),
      transferRate: Math.round((Number(row.transferRate) || 0) * 100) / 100,
      averageSentiment: Math.round((Number(row.averageSentiment) || 0) * 100) / 100,
    }));
  }

  static async getDirectionBreakdown(filters: AnalyticsFilters): Promise<DirectionBreakdown[]> {
    const conditions = [
      eq(callSessions.orgId, filters.orgId),
    ];
    if (filters.startDate) {
      conditions.push(gte(callSessions.startTime, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(callSessions.startTime, filters.endDate));
    }
    if (filters.assistantId) {
      conditions.push(eq(callSessions.assistantId, filters.assistantId));
    }

    const totalResult = await db
      .select({ total: count(callSessions.id) })
      .from(callSessions)
      .where(and(...conditions));
    const total = totalResult[0]?.total || 1;

    const breakdown = await db
      .select({
        direction: callSessions.direction,
        count: count(callSessions.id),
      })
      .from(callSessions)
      .where(and(...conditions))
      .groupBy(callSessions.direction);

    return breakdown.map((row) => ({
      direction: row.direction,
      count: row.count,
      percentage: Math.round((row.count / total) * 100 * 100) / 100,
    }));
  }

  static async getHourlyActivity(filters: AnalyticsFilters): Promise<HourlyActivity[]> {
    const conditions = [eq(callSessions.orgId, filters.orgId)];
    if (filters.startDate) {
      conditions.push(gte(callSessions.startTime, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(callSessions.startTime, filters.endDate));
    }
    if (filters.assistantId) {
      conditions.push(eq(callSessions.assistantId, filters.assistantId));
    }

    const rows = await db
      .select({
        hour: sql<number>`cast(to_char(${callSessions.startTime}, 'HH24') as integer)`,
        calls: count(callSessions.id),
        answered: sql<number>`count(case when ${callSessions.outcome} = 'completed' then 1 end)`,
        missed: sql<number>`count(case when ${callSessions.outcome} = 'busy' then 1 end)`,
        abandoned: sql<number>`count(case when ${callSessions.outcome} = 'abandoned' then 1 end)`,
      })
      .from(callSessions)
      .where(and(...conditions))
      .groupBy(sql`to_char(${callSessions.startTime}, 'HH24')`)
      .orderBy(sql`to_char(${callSessions.startTime}, 'HH24')`);

    return rows.map((r) => ({
      hour: r.hour,
      calls: r.calls,
      answered: r.answered,
      missed: r.missed,
      abandoned: r.abandoned,
    }));
  }

  static async getDurationDistribution(filters: AnalyticsFilters): Promise<DurationBucket[]> {
    const conditions = [eq(callSessions.orgId, filters.orgId)];
    if (filters.startDate) {
      conditions.push(gte(callSessions.startTime, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(callSessions.startTime, filters.endDate));
    }
    if (filters.assistantId) {
      conditions.push(eq(callSessions.assistantId, filters.assistantId));
    }

    const totalResult = await db
      .select({ total: count(callSessions.id) })
      .from(callSessions)
      .where(and(...conditions));
    const total = totalResult[0]?.total || 1;

    const rows = await db
      .select({
        bucket: sql<string>`
          case
            when ${callSessions.duration} is null then 'unknown'
            when ${callSessions.duration} < 30 then '0-30s'
            when ${callSessions.duration} < 60 then '30-60s'
            when ${callSessions.duration} < 180 then '1-3m'
            when ${callSessions.duration} < 600 then '3-10m'
            else '10m+'
          end
        `,
        count: count(callSessions.id),
      })
      .from(callSessions)
      .where(and(...conditions))
      .groupBy(sql`case
        when ${callSessions.duration} is null then 'unknown'
        when ${callSessions.duration} < 30 then '0-30s'
        when ${callSessions.duration} < 60 then '30-60s'
        when ${callSessions.duration} < 180 then '1-3m'
        when ${callSessions.duration} < 600 then '3-10m'
        else '10m+'
      end`)
      .orderBy(desc(count(callSessions.id)));

    return rows.map((row) => ({
      bucket: row.bucket,
      count: row.count,
      percentage: Math.round((row.count / total) * 100 * 100) / 100,
    }));
  }

  static async getSentimentDistribution(filters: AnalyticsFilters): Promise<SentimentBucket[]> {
    const conditions = [eq(callSessions.orgId, filters.orgId)];
    if (filters.startDate) {
      conditions.push(gte(callSessions.startTime, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(callSessions.startTime, filters.endDate));
    }
    if (filters.assistantId) {
      conditions.push(eq(callSessions.assistantId, filters.assistantId));
    }

    const totalResult = await db
      .select({ total: count(callSessions.id) })
      .from(callSessions)
      .where(and(...conditions));
    const total = totalResult[0]?.total || 1;

    const rows = await db
      .select({
        bucket: sql<string>`
          case
            when ${callSessions.sentimentScore} is null then 'unknown'
            when ${callSessions.sentimentScore} < -0.5 then '[-1,-0.5)'
            when ${callSessions.sentimentScore} < 0 then '[-0.5,0)'
            when ${callSessions.sentimentScore} < 0.5 then '[0,0.5)'
            else '[0.5,1]'
          end
        `,
        count: count(callSessions.id),
      })
      .from(callSessions)
      .where(and(...conditions))
      .groupBy(sql`case
        when ${callSessions.sentimentScore} is null then 'unknown'
        when ${callSessions.sentimentScore} < -0.5 then '[-1,-0.5)'
        when ${callSessions.sentimentScore} < 0 then '[-0.5,0)'
        when ${callSessions.sentimentScore} < 0.5 then '[0,0.5)'
        else '[0.5,1]'
      end`)
      .orderBy(desc(count(callSessions.id)));

    return rows.map((row) => ({
      bucket: row.bucket,
      count: row.count,
      percentage: Math.round((row.count / total) * 100 * 100) / 100,
    }));
  }

  static async recordCallSession(data: {
    orgId: string;
    assistantId?: string;
    phoneNumberId?: string;
    direction: 'inbound' | 'outbound';
    callerNumber?: string;
    calleeNumber?: string;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    outcome?: 'completed' | 'abandoned' | 'voicemail' | 'busy' | 'failed' | 'transferred';
    recordingUrl?: string;
    transferTarget?: string;
    sentimentScore?: number;
    metadata?: Record<string, unknown>;
  }) {
    const [session] = await db
      .insert(callSessions)
      .values({
        ...data,
        duration: data.duration || (data.endTime && data.startTime 
          ? Math.floor((data.endTime.getTime() - data.startTime.getTime()) / 1000)
          : undefined),
      })
      .returning();

    return session;
  }

  static async updateCallSession(sessionId: string, data: {
    endTime?: Date;
    duration?: number;
    outcome?: 'completed' | 'abandoned' | 'voicemail' | 'busy' | 'failed' | 'transferred';
    recordingUrl?: string;
    recordingFileUrl?: string;
    recordingSignedUrl?: string;
    transferTarget?: string;
    sentimentScore?: number;
    metadata?: Record<string, unknown>;
    transcript?: string;
    transcriptUrl?: string;
  }) {
    const [session] = await db
      .update(callSessions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(callSessions.id, sessionId))
      .returning();

    return session;
  }

  // New methods
  static async getSessionDetails(sessionId: string) {
    const session = await db.query.callSessions.findFirst({
      where: eq(callSessions.id, sessionId),
      with: {
        analysis: true,
        transcriptSegments: true,
      },
    });
    
    if (session?.recordingFileUrl && !session.recordingSignedUrl) {
      // Generate signed URL if missing or expired (expiration logic needed)
      // For now, always generate fresh if file exists
      try {
        const signedUrl = await StorageService.generateSignedUrl(session.recordingFileUrl);
        session.recordingSignedUrl = signedUrl;
      } catch (e) {
        console.error("Failed to generate signed URL", e);
      }
    }
    
    return session;
  }

  static async saveTranscript(sessionId: string, transcript: string) {
    await db.update(callSessions)
      .set({ transcript })
      .where(eq(callSessions.id, sessionId));
  }

  static async saveTranscriptSegments(sessionId: string, segments: any[]) {
    await db.insert(transcriptSegments)
      .values(segments.map(s => ({
        ...s,
        callSessionId: sessionId
      })));
  }

  static async getTranscriptSegments(sessionId: string) {
    return await db.select()
      .from(transcriptSegments)
      .where(eq(transcriptSegments.callSessionId, sessionId))
      .orderBy(transcriptSegments.startTime);
  }

  static async saveCallAnalysis(sessionId: string, orgId: string, analysis: any) {
    await db.insert(callAnalysis)
      .values({
        callSessionId: sessionId,
        orgId,
        ...analysis
      });
  }

  static async getCallAnalysis(sessionId: string) {
    return await db.query.callAnalysis.findFirst({
      where: eq(callAnalysis.callSessionId, sessionId)
    });
  }

  static async getAnalysisDefinitions(orgId: string) {
    return await db.select()
      .from(analysisDefinitions)
      .where(eq(analysisDefinitions.orgId, orgId));
  }

  static async createAnalysisDefinition(data: any) {
    return await db.insert(analysisDefinitions)
      .values(data)
      .returning();
  }
  
  static async generateRecordingSignedUrl(sessionId: string) {
    const session = await db.query.callSessions.findFirst({
      where: eq(callSessions.id, sessionId),
      columns: { recordingFileUrl: true }
    });
    
    if (!session?.recordingFileUrl) return null;
    
    return await StorageService.generateSignedUrl(session.recordingFileUrl);
  }
}
