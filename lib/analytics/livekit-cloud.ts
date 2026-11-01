/**
 * LiveKit Cloud Analytics API – types and server-side fetch helpers.
 * @see https://docs.livekit.io/deploy/admin/analytics-api/
 */

import { AccessToken } from "livekit-server-sdk";

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const PROJECT_ID = process.env.LIVEKIT_PROJECT_ID;
const CLOUD_API_BASE = "https://cloud-api.livekit.io";

/** Protobuf-style timestamp from API */
export type ProtoTimestamp =
  | string
  | { seconds?: string | number; nanos?: number };

export interface LiveKitConnectionCounts {
  attempts?: number;
  success?: number;
}

export interface LiveKitSessionListItem {
  sessionId: string;
  roomName: string;
  createdAt?: ProtoTimestamp;
  endedAt?: ProtoTimestamp;
  lastActive?: ProtoTimestamp;
  bandwidthIn?: number;
  bandwidthOut?: number;
  egress?: number;
  numParticipants?: number;
  numActiveParticipants?: number;
  connectionCounts?: LiveKitConnectionCounts;
}

export interface LiveKitListSessionsResponse {
  sessions?: LiveKitSessionListItem[];
}

export interface LiveKitQualityPoint {
  timestamp?: ProtoTimestamp;
  value?: number;
}

export interface LiveKitPublishedSources {
  cameraTrack?: boolean;
  microphoneTrack?: boolean;
  screenShareTrack?: boolean;
  screenShareAudio?: boolean;
}

export interface LiveKitParticipantSession {
  participantId?: string;
  joinedAt?: ProtoTimestamp;
  leftAt?: ProtoTimestamp;
}

export interface LiveKitSessionParticipant {
  participantIdentity?: string;
  participantName?: string;
  roomId?: string;
  joinedAt?: ProtoTimestamp;
  leftAt?: ProtoTimestamp;
  location?: string;
  region?: string;
  connectionType?: string;
  connectionTimeMs?: number;
  deviceModel?: string;
  os?: string;
  browser?: string;
  sdkVersion?: string;
  publishedSources?: LiveKitPublishedSources;
  sessions?: LiveKitParticipantSession[];
}

export interface LiveKitSessionDetailsResponse {
  roomId?: string;
  roomName?: string;
  bandwidth?: number;
  startTime?: ProtoTimestamp;
  endTime?: ProtoTimestamp;
  numParticipants?: number;
  connectionMinutes?: number;
  quality?: LiveKitQualityPoint[];
  publishBps?: LiveKitQualityPoint[];
  participants?: LiveKitSessionParticipant[];
}

function normalizeTimestamp(ts: ProtoTimestamp | undefined): string | null {
  if (ts == null) return null;
  if (typeof ts === "string") return ts;
  if (typeof ts === "object" && "seconds" in ts) {
    const s = Number(ts.seconds ?? 0);
    const ns = Number(ts.nanos ?? 0) / 1e9;
    const date = new Date((s + ns) * 1000);
    return date.toISOString();
  }
  return null;
}

/** Normalize timestamps in a session list item for display */
export function normalizeSessionListItem(
  item: LiveKitSessionListItem
): LiveKitSessionListItem & {
  createdAtDisplay?: string | null;
  endedAtDisplay?: string | null;
  lastActiveDisplay?: string | null;
} {
  return {
    ...item,
    createdAtDisplay: normalizeTimestamp(item.createdAt),
    endedAtDisplay: normalizeTimestamp(item.endedAt),
    lastActiveDisplay: normalizeTimestamp(item.lastActive),
  };
}

/** Normalize session details for display (timestamps as ISO strings) */
export function normalizeSessionDetails(
  data: LiveKitSessionDetailsResponse
): LiveKitSessionDetailsResponse & {
  startTimeDisplay?: string | null;
  endTimeDisplay?: string | null;
  qualityNormalized?: { timestamp: string; value: number }[];
  publishBpsNormalized?: { timestamp: string; value: number }[];
  participantsNormalized?: (LiveKitSessionParticipant & {
    joinedAtDisplay?: string | null;
    leftAtDisplay?: string | null;
  })[];
} {
  const startTimeDisplay = normalizeTimestamp(data.startTime);
  const endTimeDisplay = normalizeTimestamp(data.endTime);
  const qualityNormalized =
    data.quality?.map((q) => ({
      timestamp: normalizeTimestamp(q.timestamp) ?? "",
      value: q.value ?? 0,
    })) ?? [];
  const publishBpsNormalized =
    data.publishBps?.map((p) => ({
      timestamp: normalizeTimestamp(p.timestamp) ?? "",
      value: p.value ?? 0,
    })) ?? [];
  const participantsNormalized =
    data.participants?.map((p) => ({
      ...p,
      joinedAtDisplay: normalizeTimestamp(p.joinedAt),
      leftAtDisplay: normalizeTimestamp(p.leftAt),
    })) ?? [];

  return {
    ...data,
    startTimeDisplay,
    endTimeDisplay,
    qualityNormalized,
    publishBpsNormalized,
    participantsNormalized,
  };
}

async function getAnalyticsToken(): Promise<string> {
  if (!API_KEY || !API_SECRET) {
    throw new Error("LIVEKIT_API_KEY and LIVEKIT_API_SECRET are required for Analytics");
  }
  const at = new AccessToken(API_KEY, API_SECRET, { ttl: 60 * 60 * 24 });
  at.addGrant({ roomList: true });
  return await at.toJwt();
}

export function getProjectId(): string | null {
  return PROJECT_ID?.trim() || null;
}

export async function fetchLiveKitSessions(params: {
  start: string;
  end: string;
  page: number;
  limit: number;
}): Promise<LiveKitListSessionsResponse> {
  const projectId = getProjectId();
  if (!projectId) {
    throw new Error("LIVEKIT_PROJECT_ID is not set. Get it from your LiveKit Cloud project URL (the part after /projects/).");
  }
  const token = await getAnalyticsToken();
  const url = new URL(
    `${CLOUD_API_BASE}/api/project/${encodeURIComponent(projectId)}/sessions`
  );
  url.searchParams.set("start", params.start);
  url.searchParams.set("end", params.end);
  url.searchParams.set("page", String(params.page));
  url.searchParams.set("limit", String(params.limit));

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (res.status === 403) {
    const text = await res.text();
    throw new Error(
      "Analytics API requires a LiveKit Cloud Scale plan or higher. " +
      (text || "Access denied.")
    );
  }
  if (res.status === 404) {
    throw new Error("LiveKit project not found or Analytics not available.");
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LiveKit Analytics API error: ${res.status} ${text}`);
  }

  return (await res.json()) as LiveKitListSessionsResponse;
}

export async function fetchLiveKitSessionDetails(
  sessionId: string
): Promise<LiveKitSessionDetailsResponse> {
  const projectId = getProjectId();
  if (!projectId) {
    throw new Error("LIVEKIT_PROJECT_ID is not set.");
  }
  const token = await getAnalyticsToken();
  const url = `${CLOUD_API_BASE}/api/project/${encodeURIComponent(projectId)}/sessions/${encodeURIComponent(sessionId)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (res.status === 403) {
    const text = await res.text();
    throw new Error(
      "Analytics API requires a LiveKit Cloud Scale plan or higher. " +
      (text || "Access denied.")
    );
  }
  if (res.status === 404) {
    throw new Error("Session not found.");
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LiveKit Analytics API error: ${res.status} ${text}`);
  }

  return (await res.json()) as LiveKitSessionDetailsResponse;
}

/** Start date must be within 7 days of current date (per LiveKit docs). */
export function isStartDateWithinRange(start: string): boolean {
  const startDate = new Date(start);
  startDate.setHours(0, 0, 0, 0);

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0); // Include the full 7th day ago

  const futureLimit = new Date(now);
  futureLimit.setHours(23, 59, 59, 999);

  return startDate >= sevenDaysAgo && startDate <= futureLimit;
}
