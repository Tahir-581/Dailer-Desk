"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Save } from "lucide-react"
import { VOICE_PROVIDERS, type VoiceProviderId, type LiveKitVoiceOption, BACKGROUND_AUDIO_OPTIONS } from "@/lib/voices"
import { Slider } from "@/components/ui/slider"

interface LeftPanelProps {
  prompt: string
  onChangePrompt: (value: string) => void
  voiceProvider: VoiceProviderId
  onProviderChange: (provider: VoiceProviderId) => void
  voiceOptions: LiveKitVoiceOption[]
  voiceId: string
  voiceName: string
  voiceAvatar?: string
  voiceError: string | null
  isLoadingVoices: boolean
  model: string
  assistantId: string
  originalPrompt: string
  onSavePrompt: (prompt: string) => Promise<void>
  onSaveVoice: (voiceId: string) => Promise<void>
  onSaveModel: (model: string) => Promise<void>
  backgroundAudioType: string
  backgroundAudioVolume: number
  onBackgroundAudioChange: (type: string, volume: number) => Promise<void>
  backchannelEnabled: boolean
  backchannelFrequency: number
  backchannelWords: string
  interruptionSensitivity: number
  onBackchannelChange: (next: {
    enabled: boolean
    frequency: number
    words: string
    interruptionSensitivity: number
  }) => Promise<void>
}



const normalizeModelValue = (modelValue: string): string => {
  const normalized = modelValue.toLowerCase()
  if (normalized.includes("gpt-4.1") || normalized.includes("gpt-4.1-mini")) {
    return "gpt-4.1"
  }
  if (normalized.includes("gpt-4") && !normalized.includes("gpt-3")) {
    return "gpt-4"
  }
  if (normalized.includes("gpt-3.5")) {
    return "gpt-3.5"
  }


  return "gpt-4.1"
}

export function LeftPanel({
  prompt,
  onChangePrompt,
  voiceProvider,
  onProviderChange,
  voiceOptions,
  voiceId,
  voiceName,
  voiceAvatar,
  voiceError,
  isLoadingVoices,
  model,
  assistantId,
  originalPrompt,
  onSavePrompt,
  onSaveVoice,
  onSaveModel,
  backgroundAudioType,
  backgroundAudioVolume,
  onBackgroundAudioChange,
  backchannelEnabled,
  backchannelFrequency,
  backchannelWords,
  interruptionSensitivity,
  onBackchannelChange,
}: LeftPanelProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSavingVoice, setIsSavingVoice] = useState(false)
  const [selectedModel, setSelectedModel] = useState(model)
  const [isSavingModel, setIsSavingModel] = useState(false)
  const [localBackchannelWords, setLocalBackchannelWords] = useState(backchannelWords)

  useEffect(() => {
    setHasChanges(prompt !== originalPrompt)
  }, [prompt, originalPrompt])

  useEffect(() => {
    const normalizedModel = normalizeModelValue(model)
    setSelectedModel(normalizedModel)
  }, [model])

  useEffect(() => {
    setLocalBackchannelWords(backchannelWords)
  }, [backchannelWords])

  const handleSave = async () => {
    if (!hasChanges || isSaving) return

    setIsSaving(true)
    try {
      await onSavePrompt(prompt)
      setHasChanges(false)
    } catch (error) {
      console.error("Error saving prompt:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleVoiceChange = async (selectedVoiceId: string) => {
    if (!selectedVoiceId) return
    setIsSavingVoice(true)
    try {
      await onSaveVoice(selectedVoiceId)
    } catch (error) {
      console.error("Error saving voice:", error)
    } finally {
      setIsSavingVoice(false)
    }
  }

  const handleModelChange = async (newModel: string) => {
    setSelectedModel(newModel)



    setIsSavingModel(true)
    try {
      await onSaveModel(newModel)
    } catch (error) {
      console.error("Error saving model:", error)


      setSelectedModel(model)
    } finally {
      setIsSavingModel(false)
    }
  }

  const voiceSelectBase =
    "h-[38px] min-w-0 rounded-lg border border-input bg-background px-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/30 focus:ring-2 focus:ring-ring/20"

  return (
    <div className="w-[420px] min-w-[620px] border-r border-border/40 overflow-y-auto bg-background shrink-0">
      <div className="p-6 space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={selectedModel}
            onValueChange={handleModelChange}
            disabled={isSavingModel}
          >
            <SelectTrigger
              className={`flex-[1.2] min-w-[100px] ${voiceSelectBase}`}
              disabled={isSavingModel}
            >
              <SelectValue placeholder={isSavingModel ? "Saving..." : "GPT 4.1"} />
            </SelectTrigger>
            <SelectContent className="rounded-lg border-border/60 shadow-lg">
              <SelectItem value="gpt-4.1" className="rounded-md py-2">GPT 4.1</SelectItem>
              <SelectItem value="gpt-4" className="rounded-md py-2">GPT 4</SelectItem>
              <SelectItem value="gpt-3.5" className="rounded-md py-2">GPT 3.5</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={voiceProvider}
            onValueChange={(v) => onProviderChange(v as VoiceProviderId)}
            disabled={isSavingVoice || isLoadingVoices}
          >
            <SelectTrigger
              className={`flex-1 min-w-[100px] ${voiceSelectBase}`}
              disabled={isSavingVoice || isLoadingVoices}
            >
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent className="rounded-lg border-border/60 shadow-lg">
              {Object.entries(VOICE_PROVIDERS).map(([id, cfg]) => (
                <SelectItem key={id} value={id} className="rounded-md py-2 font-medium">
                  {cfg.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={voiceId || undefined}
            onValueChange={(v) => v && handleVoiceChange(v)}
            disabled={isSavingVoice || isLoadingVoices}
          >
            <SelectTrigger
              className={`flex-[1.2] min-w-[120px] ${voiceSelectBase}`}
              disabled={isSavingVoice || isLoadingVoices}
            >
              <span className="flex items-center gap-2.5 min-w-0 flex-1 text-left">
                <Avatar className="h-5 w-5 shrink-0 rounded-full border border-border/50 bg-muted/50">
                  <AvatarImage src={voiceAvatar || undefined} />
                  <AvatarFallback className="text-xs font-semibold text-muted-foreground">
                    {(voiceName || "?").charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <SelectValue placeholder="Select voice" />
              </span>
            </SelectTrigger>
            <SelectContent className="min-w-[200px] rounded-lg border-border/60 shadow-lg">
              {voiceOptions.length === 0 && (
                <div className="px-3 py-2 text-xs text-muted-foreground">No voices</div>
              )}
              {voiceOptions.map((voice) => (
                <SelectItem
                  key={voice.id}
                  value={voice.id}
                  className="rounded-md py-2.5 focus:bg-muted/60"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 shrink-0 rounded-full border border-border/40 bg-muted/50">
                      <AvatarFallback className="text-sm font-semibold text-muted-foreground">
                        {voice.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground">{voice.name}</span>
                    {voice.description && (
                      <span className="text-xs text-muted-foreground"> — {voice.description}</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select defaultValue="english">
            <SelectTrigger className={`flex-1 min-w-[90px] ${voiceSelectBase}`}>
              <SelectValue placeholder="English" />
            </SelectTrigger>
            <SelectContent className="rounded-lg border-border/60 shadow-lg">
              <SelectItem value="english" className="rounded-md py-2">English</SelectItem>
              <SelectItem value="spanish" className="rounded-md py-2">Spanish</SelectItem>
              <SelectItem value="french" className="rounded-md py-2">French</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-foreground tracking-tight">System Prompt</Label>
            {hasChanges && (
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="h-7 px-3 text-xs"
              >
                <Save className="h-3 w-3 mr-1.5" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            )}
          </div>
          <Textarea
            value={prompt}
            onChange={(e) => onChangePrompt(e.target.value)}
            placeholder="Type in a universal prompt for your agent, such as its role, conversational style, objective, etc."
            className="min-h-[320px] text-[13px] leading-relaxed resize-none border-border/60 focus-visible:ring-1 focus-visible:ring-ring/50"
          />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Use {"{{}}"} to add variables. <span className="text-primary cursor-pointer hover:underline">(Learn more)</span>
          </p>
        </div>

        { }
        <div className="flex gap-4">
          <div className="flex-1 space-y-2">
            <Label className="text-[13px] font-medium">Background Audio</Label>
            <Select
              value={backgroundAudioType}
              onValueChange={(v) => onBackgroundAudioChange(v, backgroundAudioVolume)}
            >
              <SelectTrigger className="h-[38px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BACKGROUND_AUDIO_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-2">
            <Label className="text-[13px] font-medium">Volume</Label>
            <div className="px-1 py-3">
              <Slider
                value={[Math.round((backgroundAudioVolume ?? 0.5) * 100)]}
                onValueChange={(vals) => onBackgroundAudioChange(backgroundAudioType, (vals?.[0] ?? 50) / 100)}
                min={0}
                max={100}
                step={5}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-[13px] font-medium">Backchanneling</Label>
            <Switch
              checked={backchannelEnabled}
              onCheckedChange={(checked) =>
                onBackchannelChange({
                  enabled: checked,
                  frequency: backchannelFrequency,
                  words: localBackchannelWords,
                  interruptionSensitivity,
                })
              }
            />
          </div>
          <div className="grid gap-3">
            <div className="space-y-1">
              <Label className="text-[12px] text-muted-foreground">Frequency</Label>
              <div className="px-1 py-2">
                <Slider
                  value={[Math.round((backchannelFrequency ?? 0.8) * 100)]}
                  onValueChange={(vals) =>
                    onBackchannelChange({
                      enabled: backchannelEnabled,
                      frequency: (vals?.[0] ?? 80) / 100,
                      words: localBackchannelWords,
                      interruptionSensitivity,
                    })
                  }
                  min={0}
                  max={100}
                  step={5}
                  disabled={!backchannelEnabled}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[12px] text-muted-foreground">Interruption Sensitivity</Label>
              <div className="px-1 py-2">
                <Slider
                  value={[Math.round((interruptionSensitivity ?? 0.8) * 100)]}
                  onValueChange={(vals) =>
                    onBackchannelChange({
                      enabled: backchannelEnabled,
                      frequency: backchannelFrequency,
                      words: localBackchannelWords,
                      interruptionSensitivity: (vals?.[0] ?? 80) / 100,
                    })
                  }
                  min={0}
                  max={100}
                  step={5}
                  disabled={!backchannelEnabled}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[12px] text-muted-foreground">Backchannel Words</Label>
              <Input
                value={localBackchannelWords}
                onChange={(e) => setLocalBackchannelWords(e.target.value)}
                onBlur={() =>
                  onBackchannelChange({
                    enabled: backchannelEnabled,
                    frequency: backchannelFrequency,
                    words: localBackchannelWords,
                    interruptionSensitivity,
                  })
                }
                placeholder="okay, uh-huh, mhmm"
                className="h-[36px] text-sm"
                disabled={!backchannelEnabled}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[13px] font-medium">Welcome Message</Label>
          <Select defaultValue="user-speaks-first">
            <SelectTrigger className="h-[38px] text-sm">
              <SelectValue placeholder="User speaks first" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user-speaks-first">User speaks first</SelectItem>
              <SelectItem value="agent-speaks-first">Agent speaks first</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
