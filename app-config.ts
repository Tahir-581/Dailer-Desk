export interface AppConfig {
  pageTitle: string;
  pageDescription: string;
  companyName: string;

  supportsChatInput: boolean;
  supportsVideoInput: boolean;
  supportsScreenShare: boolean;
  isPreConnectBufferEnabled: boolean;

  logo: string;
  startButtonText: string;
  accent?: string;
  logoDark?: string;
  accentDark?: string;

  sandboxId?: string;
  agentName?: string;
  assistantId?: string;
}

export const APP_CONFIG_DEFAULTS: AppConfig = {
  companyName: 'Dailer Desk',
  pageTitle: 'Dailer Desk Voice Agent',
  pageDescription: 'A voice agent built with Dailer Desk',

  supportsChatInput: true,
  supportsVideoInput: true,
  supportsScreenShare: true,
  isPreConnectBufferEnabled: true,

  logo: '/logo.svg',
  accent: '#002cf2',
  logoDark: '/logo-dark.svg',
  accentDark: '#1fd5f9',
  startButtonText: 'Start call',

  sandboxId: undefined,
  agentName: undefined,
};
