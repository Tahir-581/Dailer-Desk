import React from 'react';
import { cn } from '@/lib/utils';

export interface ChatEntryProps extends React.HTMLAttributes<HTMLLIElement> {

  locale: string;

  timestamp: number;

  message: string;

  messageOrigin: 'local' | 'remote';

  name?: string;

  hasBeenEdited?: boolean;
}

function AgentAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 ring-2 ring-primary/10">
      <svg
        className="h-4 w-4 text-primary"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
    </div>
  );
}

function UserAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white ring-2 ring-blue-500/20">
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    </div>
  );
}

export const ChatEntry = ({
  name,
  locale,
  timestamp,
  message,
  messageOrigin,
  hasBeenEdited = false,
  className,
  ...props
}: ChatEntryProps) => {
  const time = new Date(timestamp);
  const title = time.toLocaleTimeString(locale, { timeStyle: 'full' });
  const isLocal = messageOrigin === 'local';




  return (
    <li
      title={title}
      data-lk-message-origin={messageOrigin}
      className={cn(
        'group flex w-full gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300 z-10',
        isLocal ? 'flex-row-reverse' : 'flex-row',
        className
      )}


    >
      { }
      {isLocal ? <UserAvatar /> : <AgentAvatar />}

      { }
      <div className={cn('flex max-w-[75%] flex-col gap-1', isLocal ? 'items-end' : 'items-start')}>
        { }
        {name && (
          <div
            className={cn(
              'flex items-center gap-2 px-1 text-xs font-medium text-muted-foreground',
              isLocal ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            <span>{name}</span>
          </div>
        )}

        { }
        <div
          className={cn(
            'group/bubble relative break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm transition-all duration-200',
            isLocal
              ? 'rounded-br-md bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/20 hover:shadow-md hover:shadow-blue-500/30'
              : 'rounded-bl-md bg-card text-card-foreground ring-1 ring-border/50 hover:shadow-md'
          )}
        >
          <p className="whitespace-pre-wrap">{message}</p>

          { }
          <span
            className={cn(
              'absolute -bottom-5 whitespace-nowrap font-mono text-[10px] text-muted-foreground opacity-0 transition-opacity duration-200 group-hover/bubble:opacity-100',
              isLocal ? 'right-0' : 'left-0'
            )}
          >
            {hasBeenEdited && '(edited) '}
            {time.toLocaleTimeString(locale, { timeStyle: 'short' })}
          </span>
        </div>
      </div>
    </li>
  );
};
