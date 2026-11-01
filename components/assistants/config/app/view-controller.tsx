'use client';

import { useSession } from './session-provider';
import { SessionView } from './session-view';
import { WelcomeView } from './welcome-view';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export function ViewController() {
  const { appConfig, isSessionActive, startSession, endSession } = useSession();

  return (
    <>
      {!isSessionActive && (
        <WelcomeView
          startButtonText={appConfig.startButtonText}
          onStartCall={startSession}
        />
      )}
      {}
            {isSessionActive && <SessionView appConfig={appConfig} />}
          {}
      
    </>
  );
}
