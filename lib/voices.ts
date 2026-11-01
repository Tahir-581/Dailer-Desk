export interface LiveKitVoiceOption {
  id: string;
  name: string;
  description?: string;
  ttsModel: string;
  voiceId: string;
}

export interface VoiceProviderConfig {
  label: string;
  ttsModel: string;
  voices: LiveKitVoiceOption[];
}

export const VOICE_PROVIDERS: Record<string, VoiceProviderConfig> = {
  cartesia: {
    label: "Cartesia",
    ttsModel: "cartesia/sonic-3",
    voices: [
      { id: "cartesia/sonic-3:a167e0f3-df7e-4d52-a9c3-f949145efdab", name: "Blake", description: "Energetic American adult male", ttsModel: "cartesia/sonic-3", voiceId: "a167e0f3-df7e-4d52-a9c3-f949145efdab" },
      { id: "cartesia/sonic-3:5c5ad5e7-1020-476b-8b91-fdcbe9cc313c", name: "Daniela", description: "Calm and trusting Mexican female", ttsModel: "cartesia/sonic-3", voiceId: "5c5ad5e7-1020-476b-8b91-fdcbe9cc313c" },
      { id: "cartesia/sonic-3:9626c31c-bec5-4cca-baa8-f8ba9e84c8bc", name: "Jacqueline", description: "Confident, young American adult female", ttsModel: "cartesia/sonic-3", voiceId: "9626c31c-bec5-4cca-baa8-f8ba9e84c8bc" },
      { id: "cartesia/sonic-3:f31cc6a7-c1e8-4764-980c-60a361443dd1", name: "Robyn", description: "Neutral, mature Australian female", ttsModel: "cartesia/sonic-3", voiceId: "f31cc6a7-c1e8-4764-980c-60a361443dd1" },
    ],
  },
  deepgram: {
    label: "Deepgram",
    ttsModel: "deepgram/aura-2",
    voices: [
      { id: "deepgram/aura-2:apollo", name: "Apollo", description: "Comfortable, casual male", ttsModel: "deepgram/aura-2", voiceId: "apollo" },
      { id: "deepgram/aura-2:athena", name: "Athena", description: "Smooth, professional female", ttsModel: "deepgram/aura-2", voiceId: "athena" },
      { id: "deepgram/aura-2:odysseus", name: "Odysseus", description: "Calm, professional male", ttsModel: "deepgram/aura-2", voiceId: "odysseus" },
      { id: "deepgram/aura-2:theia", name: "Theia", description: "Expressive, polite female", ttsModel: "deepgram/aura-2", voiceId: "theia" },
    ],
  },
  elevenlabs: {
    label: "ElevenLabs",
    ttsModel: "elevenlabs/eleven_turbo_v2_5",
    voices: [
      { id: "elevenlabs/eleven_turbo_v2_5:Xb7hH8MSUJpSbSDYk0k2", name: "Alice", description: "Clear and engaging, friendly British woman", ttsModel: "elevenlabs/eleven_turbo_v2_5", voiceId: "Xb7hH8MSUJpSbSDYk0k2" },
      { id: "elevenlabs/eleven_turbo_v2_5:iP95p4xoKVk53GoZ742B", name: "Chris", description: "Natural and real American male", ttsModel: "elevenlabs/eleven_turbo_v2_5", voiceId: "iP95p4xoKVk53GoZ742B" },
      { id: "elevenlabs/eleven_turbo_v2_5:cjVigY5qzO86Huf0OWal", name: "Eric", description: "A smooth tenor Mexican male", ttsModel: "elevenlabs/eleven_turbo_v2_5", voiceId: "cjVigY5qzO86Huf0OWal" },
      { id: "elevenlabs/eleven_turbo_v2_5:cgSgspJ2msm6clMCkdW9", name: "Jessica", description: "Young and popular, playful American female", ttsModel: "elevenlabs/eleven_turbo_v2_5", voiceId: "cgSgspJ2msm6clMCkdW9" },
    ],
  },
  inworld: {
    label: "Inworld",
    ttsModel: "inworld/inworld-tts-1",
    voices: [
      { id: "inworld/inworld-tts-1:Ashley", name: "Ashley", description: "Warm, natural American female", ttsModel: "inworld/inworld-tts-1", voiceId: "Ashley" },
      { id: "inworld/inworld-tts-1:Diego", name: "Diego", description: "Soothing, gentle Mexican male", ttsModel: "inworld/inworld-tts-1", voiceId: "Diego" },
      { id: "inworld/inworld-tts-1:Edward", name: "Edward", description: "Fast-talking, emphatic American male", ttsModel: "inworld/inworld-tts-1", voiceId: "Edward" },
      { id: "inworld/inworld-tts-1:Olivia", name: "Olivia", description: "Upbeat, friendly British female", ttsModel: "inworld/inworld-tts-1", voiceId: "Olivia" },
    ],
  },
  rime: {
    label: "Rime",
    ttsModel: "rime/arcana",
    voices: [
      { id: "rime/arcana:astra", name: "Astra", description: "Chipper, upbeat American female", ttsModel: "rime/arcana", voiceId: "astra" },
      { id: "rime/arcana:celeste", name: "Celeste", description: "Chill Gen-Z American female", ttsModel: "rime/arcana", voiceId: "celeste" },
      { id: "rime/arcana:luna", name: "Luna", description: "Chill but excitable American female", ttsModel: "rime/arcana", voiceId: "luna" },
      { id: "rime/arcana:ursa", name: "Ursa", description: "Young, emo American male", ttsModel: "rime/arcana", voiceId: "ursa" },
    ],
  },
} as const;

export type VoiceProviderId = keyof typeof VOICE_PROVIDERS;

export interface VoiceOptionFromApi {
  id?: string;
  voice_id?: string;
  name: string;
}

export function normalizeVoiceOption(v: VoiceOptionFromApi): { id: string; name: string } {
  const id = v.id ?? v.voice_id ?? v.name;
  const name = v.name || id;
  return { id, name };
}

export interface VoiceConfig {
  provider?: VoiceProviderId;
  ttsModel?: string;
  voiceId?: string;
  name?: string;
  avatar?: string;
}

export const BACKGROUND_AUDIO_OPTIONS = [
  { value: "None", label: "None" },
  { value: "Coffee Shop", label: "Coffee Shop" },
  { value: "Convention Hall", label: "Convention Hall" },
  { value: "Summer Outdoor", label: "Summer Outdoor" },
  { value: "Mountain Outdoor", label: "Mountain Outdoor" },
  { value: "Static Noise", label: "Static Noise" },
] as const;
