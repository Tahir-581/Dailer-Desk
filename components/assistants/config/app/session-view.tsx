'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { AppConfig } from '@/app-config';
import { ChatTranscript } from '@/components/assistants/config/app/chat-transcript';
import {
  AgentControlBar,
  type ControlBarControls,
} from '@/components/assistants/config/livekit/agent-control-bar/agent-control-bar';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useConnectionTimeout } from '@/hooks/useConnectionTimout';
import { useSession } from './session-provider';
import { ScrollArea } from '../livekit/scroll-area/scroll-area';
import { AnimatedWaveform } from './animated-waveform';

interface SessionViewProps {
  appConfig: AppConfig;
}

export const SessionView = ({
  appConfig,
  ...props
}: React.ComponentProps<'section'> & SessionViewProps) => {
  useConnectionTimeout(200_000);

  const messages = useChatMessages();
  const [chatOpen, setChatOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { isSessionActive } = useSession();

  const controls: ControlBarControls = {
    leave: true,
    microphone: true,
    chat: appConfig.supportsChatInput,
    camera: appConfig.supportsVideoInput,
    screenShare: appConfig.supportsVideoInput,
  };

  useEffect(() => {
    const lastMessage = messages.at(-1);
    const lastMessageIsLocal = lastMessage?.from?.isLocal === true;

    if (scrollAreaRef.current && lastMessageIsLocal) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  

  useEffect(() => {
    if (!isSessionActive) {
      setChatOpen(false);
    }
  }, [isSessionActive]);

  return (
    <>
      <section className="bg-background relative z-10 h-full w-full overflow-hidden" >
        <ScrollArea ref={scrollAreaRef} className="px-4 pt-40 pb-[150px] md:px-6 h-[70vh] md:pb-[180px]">
          <ChatTranscript
            hidden={!chatOpen}
            messages={messages}
            className="mx-auto max-w-2xl space-y-3 transition-opacity duration-300 ease-out"
          />
        </ScrollArea>
        {!chatOpen && (
          <div className="flex flex-col items-center justify-center w-full absolute top-20 left-0 gap-3">
            <AnimatedWaveform className="h-8" barCount={5} />
            <div className="text-sm text-muted-foreground">Listening...</div>
          </div>
        )}
        <AgentControlBar controls={controls} onChatOpenChange={setChatOpen} />
      </section>
    </>

  );
};