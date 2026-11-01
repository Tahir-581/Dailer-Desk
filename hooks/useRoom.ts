import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Room, RoomEvent, TokenSource } from 'livekit-client';
import { AppConfig } from '@/app-config';
import { toastAlert } from '@/components/assistants/config/livekit/alert-toast';

export function useRoom(appConfig: AppConfig) {
  const aborted = useRef(false);
  const room = useMemo(() => new Room(), []);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const sessionIdRef = useRef<string | null>(null);
  const sessionStartRef = useRef<Date | null>(null);
  const sessionEndedRef = useRef(false);

  const createCallSession = useCallback(
    async (details: { roomName?: string; participantName?: string }) => {
      if (sessionIdRef.current) {
        return;
      }
      const startTime = new Date();
      sessionStartRef.current = startTime;
      sessionEndedRef.current = false;

      try {
        const res = await fetch('/api/analytics/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            direction: 'outbound',
            assistantId: appConfig.assistantId,
            startTime: startTime.toISOString(),
            metadata: {
              roomName: details.roomName,
              participantName: details.participantName,
              agentName: appConfig.agentName,
            },
          }),
        });
        if (!res.ok) {
          return;
        }
        const data = await res.json();
        sessionIdRef.current = data.session?.id ?? null;
      } catch (error) {
        console.error('Error recording call session:', error);
      }
    },
    [appConfig.assistantId, appConfig.agentName]
  );

  const finalizeSession = useCallback(
    async (
      outcome: 'completed' | 'abandoned' | 'voicemail' | 'busy' | 'failed' | 'transferred'
    ) => {
      if (sessionEndedRef.current) {
        return;
      }
      const sessionId = sessionIdRef.current;
      if (!sessionId) {
        return;
      }
      sessionEndedRef.current = true;
      const endTime = new Date();
      const startTime = sessionStartRef.current;
      const duration = startTime
        ? Math.max(0, Math.floor((endTime.getTime() - startTime.getTime()) / 1000))
        : undefined;

      try {
        await fetch('/api/analytics/sessions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            endTime: endTime.toISOString(),
            duration,
            outcome,
          }),
        });

        // Trigger analysis after call ends
        fetch(`/api/analytics/sessions/${sessionId}/analysis`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }).catch(err => console.error('Error analyzing session:', err));

      } catch (error) {
        console.error('Error updating call session:', error);
      } finally {
        sessionIdRef.current = null;
        sessionStartRef.current = null;
      }
    },
    []
  );

  useEffect(() => {
    function onDisconnected() {
      setIsSessionActive(false);
      void finalizeSession('completed');
    }

    function onMediaDevicesError(error: Error) {
      toastAlert({
        title: 'Encountered an error with your media devices',
        description: `${error.name}: ${error.message}`,
      });
    }

    function onTranscriptionReceived(transcriptions: any[], participant?: any) {
      const sessionId = sessionIdRef.current;
      if (!sessionId) return;

      const segments = transcriptions.map(t => ({
        speaker: participant?.identity || 'unknown',
        text: t.text,
        startTime: Number(t.startTime),
        endTime: Number(t.endTime),
        confidence: t.confidence,
        final: t.final
      }));

      // Only save final segments or significant updates
      const finalSegments = segments.filter((s: any) => s.final);
      if (finalSegments.length === 0) return;

      fetch(`/api/analytics/sessions/${sessionId}/transcript`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segments: finalSegments }),
      }).catch(err => console.error('Error saving transcript:', err));
    }

    room.on(RoomEvent.Disconnected, onDisconnected);
    room.on(RoomEvent.MediaDevicesError, onMediaDevicesError);
    room.on(RoomEvent.TranscriptionReceived, onTranscriptionReceived);

    return () => {
      room.off(RoomEvent.Disconnected, onDisconnected);
      room.off(RoomEvent.MediaDevicesError, onMediaDevicesError);
      room.off(RoomEvent.TranscriptionReceived, onTranscriptionReceived);
    };
  }, [room, finalizeSession]);

  useEffect(() => {
    return () => {
      aborted.current = true;
      room.disconnect();
    };
  }, [room]);

  const tokenSource = useMemo(
    () =>
      TokenSource.custom(async () => {
        const url = new URL(
          process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? '/api/connection-details',
          window.location.origin
        );

        try {
          const res = await fetch(url.toString(), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Sandbox-Id': appConfig.sandboxId ?? '',
            },
            body: JSON.stringify({
              room_config: appConfig.agentName
                ? {
                    agents: [{ agent_name: appConfig.agentName }],
                  }
                : undefined,
              assistant_id: appConfig.assistantId,
            }),
          });
          return await res.json();
        } catch (error) {
          console.error('Error fetching connection details:', error);
          throw new Error('Error fetching connection details!');
        }
      }),
    [appConfig]
  );

  const startSession = useCallback(async () => {
    if (room.state !== 'disconnected') {
      try {
        await room.disconnect();
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn('Error disconnecting before start:', error);
      }
    }

    setIsSessionActive(true);
    aborted.current = false;

    try {
      const { isPreConnectBufferEnabled } = appConfig;
      
      const connectionDetails = await tokenSource.fetch({
        agentName: appConfig.agentName,
      }) as {
        serverUrl: string;
        participantToken: string;
        roomName?: string;
        participantName?: string;
      };

      await createCallSession({
        roomName: connectionDetails.roomName,
        participantName: connectionDetails.participantName,
      });

      await room.connect(connectionDetails.serverUrl, connectionDetails.participantToken);
      
      await room.localParticipant.setMicrophoneEnabled(true, undefined, {
        preConnectBuffer: isPreConnectBufferEnabled,
      });
    } catch (error) {
      if (aborted.current) {
        return;
      }

      setIsSessionActive(false);
      void finalizeSession('failed');
      toastAlert({
        title: 'There was an error connecting to the agent',
        description: error instanceof Error ? `${error.name}: ${error.message}` : 'Unknown error occurred',
      });
    }
  }, [room, appConfig, tokenSource, createCallSession, finalizeSession]);

  const endSession = useCallback(async () => {
    try {
      setIsSessionActive(false);
      
      if (room.localParticipant) {
        room.localParticipant.audioTrackPublications.forEach((publication) => {
          if (publication.track) {
            publication.track.stop();
            room.localParticipant.unpublishTrack(publication.track);
          }
        });

        room.localParticipant.videoTrackPublications.forEach((publication) => {
          if (publication.track) {
            publication.track.stop();
            room.localParticipant.unpublishTrack(publication.track);
          }
        });

        await room.localParticipant.setMicrophoneEnabled(false);
        await room.localParticipant.setCameraEnabled(false);
      }

      

      void finalizeSession('completed');

      if (room.state !== 'disconnected') {
        await room.disconnect();
      }
    } catch (error) {
      console.error('Error ending session:', error);
      

      try {
        await room.disconnect();
      } catch (disconnectError) {
        console.error('Error during force disconnect:', disconnectError);
      }
      setIsSessionActive(false);
    }
  }, [room, finalizeSession]);

  return { room, isSessionActive, startSession, endSession };
}
