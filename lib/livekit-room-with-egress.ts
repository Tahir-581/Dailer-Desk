import { RoomServiceClient, EgressClient, AccessToken, Room } from 'livekit-server-sdk';
import { RoomEgress, AutoTrackEgress, S3Upload, EncodedFileType, RoomCompositeEgressRequest, EncodedFileOutput, SegmentedFileOutput } from '@livekit/protocol';

const trackEgressStarted = new Set<string>();

export interface SupabaseS3Config {
  access_key: string;
  secret: string;
  bucket: string;
  region: string;
  endpoint: string;
  force_path_style?: boolean;
}

export interface EgressConfig {
  recordTracks: boolean;
  recordComposite: boolean;
  outputFormat: 'mp4' | 'hls' | 'both';
}

export async function createRoomWithEgress(
  roomName: string,
  egressConfig: EgressConfig,
  s3Config: SupabaseS3Config,
  agentName?: string
) {
  const livekitUrl = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!livekitUrl || !apiKey || !apiSecret) {
    throw new Error('LiveKit credentials are not configured');
  }

  const roomClient = new RoomServiceClient(livekitUrl, apiKey, apiSecret);

  const s3ConfigObj: any = {
    access_key: s3Config.access_key,
    secret: s3Config.secret,
    bucket: s3Config.bucket,
    force_path_style: s3Config.force_path_style ?? true,
  };

  if (s3Config.endpoint && s3Config.endpoint.trim() !== '') {
    const endpoint = s3Config.endpoint.trim();
    if (!endpoint.startsWith('https://')) {
      throw new Error(`S3 endpoint must start with https://, got: ${endpoint}`);
    }
    s3ConfigObj.endpoint = endpoint;
    s3ConfigObj.region = '';
  } else {
    s3ConfigObj.region = s3Config.region || 'us-east-1';
  }

  const createRoomOptions: any = {
    name: roomName,
  };

  if (agentName) {
    createRoomOptions.agents = [{ agentName }];
  }

  if (egressConfig.recordTracks || egressConfig.recordComposite) {
    if (egressConfig.recordTracks) {
      const region = (s3ConfigObj.region ?? s3Config.region) || 'us-east-1';
      const endpoint = s3ConfigObj.endpoint ?? '';
      const s3Upload = new S3Upload({
        accessKey: s3Config.access_key,
        secret: s3Config.secret,
        bucket: s3Config.bucket,
        region,
        endpoint,
        forcePathStyle: s3Config.force_path_style ?? true,
      });
      const autoTrackEgress = new AutoTrackEgress({
        filepath: `recordings/tracks/{room_name}-{publisher_identity}-{time}`,
        output: { case: 's3', value: s3Upload },
      });
      createRoomOptions.egress = new RoomEgress({ tracks: autoTrackEgress });
    }

    if (egressConfig.recordComposite) {
      const s3Upload = new S3Upload({
        accessKey: s3Config.access_key,
        secret: s3Config.secret,
        bucket: s3Config.bucket,
        region: s3ConfigObj.region ?? s3Config.region ?? 'us-east-1',
        endpoint: s3ConfigObj.endpoint ?? '',
        forcePathStyle: s3Config.force_path_style ?? true,
      });

      const fileOutputs: InstanceType<typeof EncodedFileOutput>[] = [];
      if (egressConfig.outputFormat === 'mp4' || egressConfig.outputFormat === 'both') {
        fileOutputs.push(
          new EncodedFileOutput({
            fileType: EncodedFileType.MP4,
            filepath: `recordings/composites/${roomName}-{time}.mp4`,
            output: { case: 's3', value: s3Upload },
          })
        );
      }

      const segmentOutputs: InstanceType<typeof SegmentedFileOutput>[] = [];
      if (egressConfig.outputFormat === 'hls' || egressConfig.outputFormat === 'both') {
        segmentOutputs.push(
          new SegmentedFileOutput({
            filenamePrefix: `recordings/composites/${roomName}`,
            playlistName: `${roomName}.m3u8`,
            segmentDuration: 2,
            output: { case: 's3', value: s3Upload },
          })
        );
      }

      const roomComposite = new RoomCompositeEgressRequest({
        roomName,
        audioOnly: true,
        audioMixing: 0,
        fileOutputs,
        ...(segmentOutputs.length > 0 && { segmentOutputs }),
      });

      if (createRoomOptions.egress) {
        (createRoomOptions.egress as RoomEgress).room = roomComposite;
      } else {
        createRoomOptions.egress = new RoomEgress({ room: roomComposite });
      }
    }



    try {
      let room: InstanceType<typeof Room>;
      if (createRoomOptions.egress && createRoomOptions.egress.tracks) {
        const baseUrl = livekitUrl.replace(/^ws/, 'http');
        const createRoomBody: Record<string, unknown> = {
          name: roomName,
          egress: {
            tracks: {
              filepath: `recordings/tracks/{room_name}-{publisher_identity}-{time}`,
              s3: {
                accessKey: s3Config.access_key,
                secret: s3Config.secret,
                bucket: s3Config.bucket,
                region: (s3ConfigObj.region ?? s3Config.region) || 'us-east-1',
                endpoint: s3ConfigObj.endpoint ?? '',
                forcePathStyle: s3Config.force_path_style ?? true,
              },
            },
          },
        };
        if (egressConfig.recordComposite && createRoomOptions.egress.room) {
          (createRoomBody.egress as Record<string, unknown>).room = createRoomOptions.egress.room;
        }
        if (agentName) {
          createRoomBody.agents = [{ agentName }];
        }
        const at = new AccessToken(apiKey, apiSecret, { ttl: '10m' });
        at.addGrant({ roomCreate: true });
        const authHeader = { Authorization: `Bearer ${await at.toJwt()}` };
        const res = await fetch(`${baseUrl}/twirp/livekit.RoomService/CreateRoom`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json;charset=UTF-8', ...authHeader },
          body: JSON.stringify(createRoomBody),
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({})) as { msg?: string };
          throw new Error(errBody.msg || res.statusText);
        }
        const data = await res.json() as Record<string, unknown>;
        room = Room.fromJson(data as Parameters<typeof Room.fromJson>[0], { ignoreUnknownFields: true });
      } else {
        room = await roomClient.createRoom(createRoomOptions);
      }
      return room;
    } catch (error) {
      console.error('[createRoomWithEgress] Failed to create room with auto-egress:', error);
      try {
        const room = await roomClient.createRoom({ name: roomName });
        console.warn('[createRoomWithEgress] Room created WITHOUT egress (fallback). Recording will not be available.');
        return room;
      } catch (fallbackError) {
        console.error('[createRoomWithEgress] Fallback room creation also failed:', fallbackError);
        throw fallbackError;
      }
    }
  }
}

export function getSupabaseS3Config(): SupabaseS3Config {
  const accessKey = process.env.SUPABASE_S3_ACCESS_KEY_ID;
  const secret = process.env.SUPABASE_S3_SECRET_ACCESS_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET_NAME;
  const region = process.env.SUPABASE_S3_REGION || 'us-east-1';
  const endpoint = process.env.SUPABASE_S3_ENDPOINT;

  const missing: string[] = [];
  if (!accessKey) missing.push('SUPABASE_S3_ACCESS_KEY_ID');
  if (!secret) missing.push('SUPABASE_S3_SECRET_ACCESS_KEY');
  if (!bucket) missing.push('SUPABASE_STORAGE_BUCKET_NAME');
  if (!endpoint) missing.push('SUPABASE_S3_ENDPOINT');

  if (missing.length > 0) {
    throw new Error(
      `Supabase S3 configuration is incomplete. Missing environment variables: ${missing.join(', ')}\n` +
      `Please add these to your Dailer-Desk/.env.local file.\n` +
      `Get S3 credentials from: Supabase Dashboard > Settings > API > S3 Credentials\n` +
      `S3 endpoint format: https://{project-ref}.storage.supabase.co/storage/v1/s3`
    );
  }

  return {
    access_key: accessKey!,
    secret: secret!,
    bucket: bucket!,
    region: region!,
    endpoint: endpoint!,
    force_path_style: true,
  };
}

export async function waitForAgentAudioTrack(
  roomName: string,
  agentName: string,
  timeoutMs: number = 15000,
  pollIntervalMs: number = 500
): Promise<string> {
  const livekitUrl = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!livekitUrl || !apiKey || !apiSecret) {
    throw new Error('LiveKit credentials are not configured');
  }

  const roomClient = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const participants = await roomClient.listParticipants(roomName);
      const agentParticipant = participants.find(p => p.identity === agentName);

      if (agentParticipant) {
        const tracks = (agentParticipant as any).tracks;

        if (tracks) {
          if (tracks instanceof Map) {
            for (const [trackSid, trackPub] of Array.from(tracks.entries())) {
              const track = trackPub as any;
              const kind = track.kind || track.source;
              if (kind === 'audio' || kind === 'microphone' || kind === 1 || kind === 'AUDIO') {
                return trackSid;
              }
            }
          }
          else if (typeof tracks === 'object') {
            for (const [trackSid, trackPub] of Object.entries(tracks)) {
              const track = trackPub as any;
              const kind = track.kind || track.source || track.track?.kind || track.track?.source;
              if (kind === 'audio' || kind === 'microphone' || kind === 1 || kind === 'AUDIO') {
                return trackSid;
              }
            }
          }
          else if (Array.isArray(tracks)) {
            for (const trackPub of tracks) {
              const track = trackPub as any;
              const trackSid = track.sid || track.trackSid || track.track?.sid;
              const kind = track.kind || track.source || track.track?.kind || track.track?.source;
              if (trackSid && (kind === 'audio' || kind === 'microphone' || kind === 1 || kind === 'AUDIO')) {
                return trackSid;
              }
            }
          }
        }
      }

      const elapsed = Date.now() - startTime;
      const remaining = timeoutMs - elapsed;
      if (remaining > 0) {

        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      }
    } catch (error) {
      console.error(`[waitForAgentAudioTrack] Error checking participants:`, error);
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }
  }

  throw new Error(
    `Timeout waiting for agent "${agentName}" audio track in room "${roomName}" ` +
    `after ${timeoutMs}ms`
  );
}

export async function startTrackEgressForAgent(
  roomName: string,
  agentName: string,
  s3Config: SupabaseS3Config,
  timeoutMs: number = 15000
) {
  const egressKey = `${roomName}:${agentName}`;
  if (trackEgressStarted.has(egressKey)) {
    console.warn(
      `[startTrackEgressForAgent] Track egress already started for room "${roomName}" agent "${agentName}". Skipping.`
    );
    return null;
  }

  const livekitUrl = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!livekitUrl || !apiKey || !apiSecret) {
    throw new Error('LiveKit credentials are not configured');
  }

  const egressClient = new EgressClient(livekitUrl, apiKey, apiSecret);
  const trackId = await waitForAgentAudioTrack(roomName, agentName, timeoutMs);
  const filepath = `recordings/tracks/${roomName}-{track_id}-{time}.mp4`;

  try {
    const egressInfo = await (egressClient.startTrackEgress as any)(
      roomName,
      {
        filepath: filepath,
        s3: {
          accessKey: s3Config.access_key,
          secret: s3Config.secret,
          bucket: s3Config.bucket,
          region: s3Config.region,
          endpoint: s3Config.endpoint,
          forcePathStyle: s3Config.force_path_style ?? true,
        },
      },
      {
        trackId: trackId,
      }
    );
    trackEgressStarted.add(egressKey);

    return egressInfo;
  } catch (error) {
    console.error('[startTrackEgressForAgent] Failed to start track egress:', error);
    throw error;
  }
}

export function getEgressConfig(): EgressConfig {
  const recordComposite = process.env.LIVEKIT_EGRESS_RECORD_COMPOSITE === 'true';
  const recordTracks = process.env.LIVEKIT_EGRESS_RECORD_TRACKS !== 'false' && !recordComposite;
  return {
    recordTracks,
    recordComposite,
    outputFormat: (process.env.LIVEKIT_EGRESS_OUTPUT_FORMAT || 'mp4') as 'mp4' | 'hls' | 'both',
  };
}

