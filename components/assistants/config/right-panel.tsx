
"use client"

import { useParams } from 'next/navigation';
import { App } from '@/components/assistants/config/app/app';
import { APP_CONFIG_DEFAULTS, type AppConfig } from '@/app-config';

export function RightPanel() {
  const params = useParams();
  const assistantId = params?.id as string | undefined;
  
  const appConfig: AppConfig = {
    ...APP_CONFIG_DEFAULTS,
    assistantId: assistantId,
    agentName: process.env.NEXT_PUBLIC_LIVEKIT_AGENT_NAME ?? "my-python-agent",
  };
  
  return <App appConfig={appConfig} />
}
