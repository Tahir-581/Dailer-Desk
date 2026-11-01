'use client';

import { AnimatePresence, type HTMLMotionProps, motion } from 'motion/react';
import { type ReceivedChatMessage } from '@livekit/components-react';
import { ChatEntry } from '../livekit/chat-entry';

const MotionContainer = motion.create('ul');
const MotionChatEntry = motion.create(ChatEntry);

const CONTAINER_MOTION_PROPS = {
  variants: {
    hidden: {
      opacity: 0,
      transition: {
        ease: 'easeOut',
        duration: 0.3,
        staggerChildren: 0.05,
        staggerDirection: -1,
      },
    },
    visible: {
      opacity: 1,
      transition: {
        delay: 0.15,
        ease: 'easeOut',
        duration: 0.3,
        staggerChildren: 0.05,
        staggerDirection: 1,
      },
    },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
};

const MESSAGE_MOTION_PROPS = {
  variants: {
    hidden: {
      opacity: 0,
      translateY: 20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      translateY: 0,
      scale: 1,
    },
  },
  transition: {
    type: 'spring',
    stiffness: 500,
    damping: 30,
  },
};

interface ChatTranscriptProps {
  hidden?: boolean;
  messages?: ReceivedChatMessage[];
}

export function ChatTranscript({
  hidden = false,
  messages = [],
  ...props
}: ChatTranscriptProps & Omit<HTMLMotionProps<'ul'>, 'ref'>) {
  return (
    <AnimatePresence mode="wait">
      {!hidden && (
        <MotionContainer     
          {...CONTAINER_MOTION_PROPS} 
          {...props}
          className="space-y-6"
        >
          {messages.length === 0 ? (
            <li className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <svg
                    className="h-8 w-8 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  No messages yet
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Start a conversation with your AI assistant
                </p>
              </div>
            </li>
          ) : (
            messages.map(({ id, timestamp, from, message, editTimestamp }: ReceivedChatMessage) => {
              const locale = navigator?.language ?? 'en-US';
              const messageOrigin = from?.isLocal ? 'local' : 'remote';
              const hasBeenEdited = !!editTimestamp;
              const name = from?.name || (messageOrigin === 'local' ? 'You' : 'AI Assistant');

              return (
                <MotionChatEntry
                  key={id}
                  name={name}
                  locale={locale}
                  timestamp={timestamp}
                  message={message}
                  messageOrigin={messageOrigin}
                  hasBeenEdited={hasBeenEdited}
                  {...MESSAGE_MOTION_PROPS}
                />
              );
            })
          )}
        </MotionContainer>
      )}
    </AnimatePresence>
  );
}
