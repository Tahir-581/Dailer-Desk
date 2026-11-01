import { NextResponse } from 'next/server';
import { AccessToken, type AccessTokenOptions, type VideoGrant } from 'livekit-server-sdk';
import { auth } from '@/lib/auth';
import { db, assistants, workflows } from '@/lib/db';
import { eq } from 'drizzle-orm';
import {
  createRoomWithEgress,
  getSupabaseS3Config,
  getEgressConfig,
} from '@/lib/livekit-room-with-egress';

type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
};



const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;



export const revalidate = 0;

export async function POST(req: Request) {
  try {
    if (LIVEKIT_URL === undefined) {
      throw new Error('LIVEKIT_URL is not defined');
    }
    if (API_KEY === undefined) {
      throw new Error('LIVEKIT_API_KEY is not defined');
    }
    if (API_SECRET === undefined) {
      throw new Error('LIVEKIT_API_SECRET is not defined');
    }



    const session = await auth.api.getSession({ headers: req.headers });
    const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'user';
    const userEmail = session?.user?.email || '';
    const userId = session?.user?.id || '';



    const body = await req.json();
    const agentName: string = body?.room_config?.agents?.[0]?.agent_name;
    const assistantId: string | undefined = body?.assistant_id;
    const orgId: string | undefined = body?.orgId;


    if (!agentName) {
      console.warn('[connection-details] agentName is missing — room token will not request an agent. Set NEXT_PUBLIC_LIVEKIT_AGENT_NAME or assistant room_config so the agent is dispatched.');
    }



    let systemPrompt: string | null = null;
    let assistantOrgId: string | null = null;
    let voiceConfig: { name?: string; ttsModel?: string; avatar?: string; voiceId?: string; provider?: string } | null = null;
    let llmModel: string | null = null;
    let workflowEnabled: boolean = false;
    let workflowId: string | null = null;
    if (assistantId) {
      try {
        const [assistant] = await db
          .select({
            systemPrompt: assistants.systemPrompt,
            orgId: assistants.orgId,
            config: assistants.config,
            workflowEnabled: assistants.workflowEnabled,
            workflowId: assistants.workflowId
          })
          .from(assistants)
          .where(eq(assistants.id, assistantId))
          .limit(1);

        if (assistant) {
          systemPrompt = assistant.systemPrompt;
          assistantOrgId = assistant.orgId;
          workflowEnabled = assistant.workflowEnabled ?? false;
          workflowId = assistant.workflowId ?? null;



          if (workflowEnabled && !workflowId) {
            try {
              const [workflow] = await db
                .select({ id: workflows.id })
                .from(workflows)
                .where(eq(workflows.assistantId, assistantId))
                .limit(1);

              if (workflow) {
                workflowId = workflow.id;
              }
            } catch (err) {
              console.error('Error looking up workflow by assistantId:', err);
            }
          }



          let backgroundAudio: { type?: string; volume?: number } | string | null = null;
          let backchanneling:
            | {
                enable_backchannel?: boolean;
                backchannel_frequency?: number;
                backchannel_words?: string[];
                interruption_sensitivity?: number;
              }
            | null = null;
          if (assistant.config && typeof assistant.config === 'object') {
            const config = assistant.config as Record<string, unknown>;
            const voice = config.voice as { name?: string; ttsModel?: string; avatar?: string; voiceId?: string; provider?: string } | undefined;
            if (voice) {
              voiceConfig = {
                name: voice.name,
                ttsModel: voice.ttsModel,
                avatar: voice.avatar,
                voiceId: voice.voiceId,
                provider: voice.provider
              };
            }
            const bgAudio = config.backgroundAudio as { type?: string; volume?: number } | string | undefined;
            if (bgAudio) {
              backgroundAudio = bgAudio;
            }
            const backchannelingConfig = config.backchanneling as
              | {
                  enabled?: boolean;
                  frequency?: number;
                  words?: string[];
                  interruptionSensitivity?: number;
                }
              | undefined;
            if (backchannelingConfig) {
              backchanneling = {
                enable_backchannel: backchannelingConfig.enabled,
                backchannel_frequency: backchannelingConfig.frequency,
                backchannel_words: backchannelingConfig.words,
                interruption_sensitivity: backchannelingConfig.interruptionSensitivity,
              };
            }
            const modelOrLlm = (config.model as string) || (config.llm as string);
            if (modelOrLlm) {
              const normalized = modelOrLlm.toLowerCase();
              if (normalized.includes('gpt-4.1') || normalized.includes('gpt-4.1-mini')) {
                llmModel = 'openai/gpt-4.1-mini';
              } else if (normalized.includes('gpt-4') && !normalized.includes('gpt-3')) {
                llmModel = 'openai/gpt-4';
              } else if (normalized.includes('gpt-3.5')) {
                llmModel = 'openai/gpt-3.5-turbo';
              } else {
                llmModel = modelOrLlm.includes('/') ? modelOrLlm : `openai/${modelOrLlm}`;
              }
            }
          }
          const metadata = JSON.stringify({
            name: userName,
            email: userEmail,
            userId: userId,
            orgId: assistantOrgId,
            assistantId: assistantId || null,
            systemPrompt: systemPrompt || null,
            voice: voiceConfig || null,
            llmModel: llmModel || null,
            workflowEnabled: workflowEnabled,
            workflowId: workflowId,
            backgroundAudio: backgroundAudio || null,
            backchanneling: backchanneling || null,
          });
          const participantName = userName;
          const participantIdentity = userId ? `user_${userId}` : `voice_assistant_user_${Math.floor(Math.random() * 10_000)}`;
          const roomName = `voice_assistant_room_${Math.floor(Math.random() * 10_000)}`;
          const participantToken = await createParticipantToken(
            {
              identity: participantIdentity,
              name: participantName,
              metadata: metadata,
            },
            roomName,
            agentName
          );
          const data: ConnectionDetails = {
            serverUrl: LIVEKIT_URL!,
            roomName,
            participantToken: participantToken,
            participantName,
          };
          const headers = new Headers({
            'Cache-Control': 'no-store',
          });
          return NextResponse.json(data, { headers });
        }
      } catch (error) {
        console.error('Error fetching assistant data:', error);


      }
    }



    const finalOrgId = orgId || assistantOrgId || null;



    const participantName = userName;
    const participantIdentity = userId ? `user_${userId}` : `voice_assistant_user_${Math.floor(Math.random() * 10_000)}`;
    const roomName = `voice_assistant_room_${Math.floor(Math.random() * 10_000)}`;

    if (process.env.LIVEKIT_EGRESS_ENABLED === 'true') {
      try {
        const s3Config = getSupabaseS3Config();
        const egressConfig = getEgressConfig();

        if (!egressConfig.recordTracks && !egressConfig.recordComposite) {
          console.warn(
            `[connection-details] Egress is enabled but both recordTracks and recordComposite are false. ` +
            `Skipping egress. Set LIVEKIT_EGRESS_RECORD_TRACKS=true or LIVEKIT_EGRESS_RECORD_COMPOSITE=true to enable recording.`
          );
        } else {
          await createRoomWithEgress(roomName, egressConfig, s3Config, agentName);
        }
      } catch (egressError) {
        console.error('[connection-details] Failed to create room with egress:', egressError);
      }
    }

    const metadata = JSON.stringify({
      name: userName,
      email: userEmail,
      userId: userId,
      orgId: finalOrgId,
      assistantId: assistantId || null,
      systemPrompt: systemPrompt || null,
      voice: voiceConfig || null,
      llmModel: llmModel || null,
      workflowEnabled: workflowEnabled,
      workflowId: workflowId,
      backchanneling: null,
    });

    const participantToken = await createParticipantToken(
      {
        identity: participantIdentity,
        name: participantName,
        metadata: metadata,
      },
      roomName,
      agentName
    );



    const data: ConnectionDetails = {
      serverUrl: LIVEKIT_URL,
      roomName,
      participantToken: participantToken,
      participantName,
    };
    const headers = new Headers({
      'Cache-Control': 'no-store',
    });
    return NextResponse.json(data, { headers });
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      return new NextResponse(error.message, { status: 500 });
    }
  }
}

function createParticipantToken(
  userInfo: AccessTokenOptions,
  roomName: string,
  agentName?: string
): Promise<string> {
  const at = new AccessToken(API_KEY, API_SECRET, {
    ...userInfo,
    ttl: '15m',
  });
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  };
  at.addGrant(grant);

  if (agentName) {
    at.roomConfig = {
      agents: [{ agentName: agentName }],
    };
  } else {
    console.warn('[createParticipantToken] No agentName provided - agent will not be dispatched');
  }

  return at.toJwt();
}
