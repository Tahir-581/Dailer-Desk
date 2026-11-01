"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Home,
  Edit,
  RefreshCw,
  MoreVertical,
  Grid3x3,
  FileText,
  MessageCircle,
  Mic2,
  Headphones,
  TrendingUp,
  Shield,
  Box,
  Paperclip,
} from "lucide-react"
import { Button } from "@/components/ui/button"

import { apiClient } from "@/lib/api/client"
import { cn } from "@/lib/utils"
import { VOICE_PROVIDERS, type VoiceProviderId, type LiveKitVoiceOption } from "@/lib/voices"
import { LeftPanel } from "@/components/assistants/config/left-panel"
import { MiddlePanel } from "@/components/assistants/config/middle-panel"
import { RightPanel } from "@/components/assistants/config/right-panel"

interface Assistant {
  id: string
  orgId: string
  name: string
  description: string | null
  systemPrompt: string | null
  status: "active" | "inactive" | "archived"
  config: Record<string, unknown> | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

interface SettingsCategory {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  isOpen?: boolean
}

export default function AssistantConfigPage() {
  const params = useParams()
  const router = useRouter()
  const assistantId = params.id as string
  const [assistant, setAssistant] = useState<Assistant | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [prompt, setPrompt] = useState("")
  const [originalPrompt, setOriginalPrompt] = useState("")
  const [voiceProvider, setVoiceProvider] = useState<VoiceProviderId>("inworld")
  const [voiceId, setVoiceId] = useState("")
  const [voiceOptions, setVoiceOptions] = useState<LiveKitVoiceOption[]>([])
  const [isLoadingVoices] = useState(false)
  const [voiceError] = useState<string | null>(null)
  const [backgroundAudioType, setBackgroundAudioType] = useState<string>("None")
  const [backgroundAudioVolume, setBackgroundAudioVolume] = useState<number>(0.5)
  const [backchannelEnabled, setBackchannelEnabled] = useState(false)
  const [backchannelFrequency, setBackchannelFrequency] = useState(0.8)
  const [backchannelWords, setBackchannelWords] = useState("")
  const [interruptionSensitivity, setInterruptionSensitivity] = useState(0.8)
  const [activeTab, setActiveTab] = useState("create")
  const [testTab, setTestTab] = useState("audio")
  const [settingsCategories, setSettingsCategories] = useState<SettingsCategory[]>([
    { id: "functions", title: "Functions", icon: Grid3x3 },
    { id: "knowledge", title: "Knowledge Base", icon: FileText },
    { id: "speech", title: "Speech Settings", icon: MessageCircle },
    { id: "transcription", title: "Realtime Transcription Settings", icon: Mic2 },
    { id: "call", title: "Call Settings", icon: Headphones },
    { id: "analysis", title: "Post-Call Analysis", icon: TrendingUp },
    { id: "security", title: "Security & Fallback Settings", icon: Shield },
    { id: "webhook", title: "Webhook Settings", icon: Box },
    { id: "mcps", title: "MCPs", icon: Paperclip },
  ])

  useEffect(() => {
    const fetchAssistant = async () => {
      try {
        const response = await apiClient.get<Assistant>(`/api/assistants/${assistantId}`)
        setAssistant(response.data)
        const systemPrompt = response.data.systemPrompt || ""
        setPrompt(systemPrompt)
        setOriginalPrompt(systemPrompt)
      } catch (error) {
        console.error("Error fetching assistant:", error)
        router.push("/assistants")
      } finally {
        setIsLoading(false)
      }
    }

    if (assistantId) {
      fetchAssistant()
    }
  }, [assistantId, router])

  useEffect(() => {
    if (!assistant?.config) return
    const config = assistant.config as Record<string, unknown>
    const voice = config.voice as { provider?: string; voiceId?: string; name?: string } | undefined
    const provider = (voice?.provider as VoiceProviderId) || "inworld"
    const voices = VOICE_PROVIDERS[provider]?.voices ?? []
    setVoiceProvider(provider)
    setVoiceOptions(voices)
    const savedVoiceId = (voice?.voiceId as string) ?? ""
    const savedName = (voice?.name as string) ?? ""
    const match = voices.find((v) => v.voiceId === savedVoiceId || v.name === savedName || v.id === savedVoiceId)
    setVoiceId(match ? match.id : savedVoiceId)

    const bgAudio = config.backgroundAudio as { type?: string; volume?: number } | string | undefined
    if (typeof bgAudio === 'object' && bgAudio !== null) {
      setBackgroundAudioType(bgAudio.type || "None")
      setBackgroundAudioVolume(bgAudio.volume || 0.5)
    } else if (typeof bgAudio === 'string') {
      setBackgroundAudioType(bgAudio)
      setBackgroundAudioVolume(0.5)
    } else {
      setBackgroundAudioType("None")
      setBackgroundAudioVolume(0.5)
    }

    const backchanneling = config.backchanneling as {
      enabled?: boolean
      frequency?: number
      words?: string[]
      interruptionSensitivity?: number
    } | undefined
    if (backchanneling) {
      setBackchannelEnabled(backchanneling.enabled ?? false)
      setBackchannelFrequency(
        typeof backchanneling.frequency === "number" ? backchanneling.frequency : 0.8
      )
      setBackchannelWords(Array.isArray(backchanneling.words) ? backchanneling.words.join(", ") : "")
      setInterruptionSensitivity(
        typeof backchanneling.interruptionSensitivity === "number"
          ? backchanneling.interruptionSensitivity
          : 0.8
      )
    } else {
      setBackchannelEnabled(false)
      setBackchannelFrequency(0.8)
      setBackchannelWords("")
      setInterruptionSensitivity(0.8)
    }
  }, [assistant?.id, assistant?.config])

  const config = assistant?.config || {}
  const voiceConfig = config.voice as { name?: string; avatar?: string; ttsModel?: string; voiceId?: string; provider?: string } | undefined
  const voiceName = voiceConfig?.name || "Cimo"
  const voiceAvatar = voiceConfig?.avatar || undefined



  const rawModel = (config.model as string) || (config.llm as string) || "gpt-4.1"
  const normalizeModel = (modelValue: string): string => {
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
  const model = normalizeModel(rawModel)

  const toggleCategory = (id: string) => {
    setSettingsCategories((prev) =>
      prev.map((cat) =>
        cat.id === id ? { ...cat, isOpen: !cat.isOpen } : cat
      )
    )
  }

  const handleSavePrompt = async (newPrompt: string) => {
    try {
      const response = await apiClient.put(`/api/assistants/${assistantId}`, {
        systemPrompt: newPrompt,
      })
      setAssistant(response.data)
      setOriginalPrompt(newPrompt)
    } catch (error) {
      console.error("Error saving prompt:", error)
      throw error
    }
  }

  const handleProviderChange = (newProvider: VoiceProviderId) => {
    setVoiceProvider(newProvider)
    setVoiceId("")
    setVoiceOptions(VOICE_PROVIDERS[newProvider]?.voices ?? [])
  }

  const handleSaveVoice = async (selectedVoiceId: string) => {
    if (!assistant || !selectedVoiceId) return
    const option = voiceOptions.find((v) => v.id === selectedVoiceId)
    if (!option) return
    try {
      const config = { ...(assistant.config || {}) } as Record<string, unknown>
      config.voice = {
        ...(config.voice as object || {}),
        provider: voiceProvider,
        voiceId: option.voiceId,
        name: option.name,
        ttsModel: option.ttsModel,
      }
      const response = await apiClient.put(`/api/assistants/${assistantId}`, { config })
      setAssistant(response.data)
      setVoiceId(selectedVoiceId)
    } catch (error) {
      console.error("Error saving voice:", error)
      throw error
    }
  }

  const handleSaveModel = async (newModel: string) => {
    try {
      const config = { ...(assistant?.config || {}) }
      config.model = newModel
      config.llm = newModel


      const response = await apiClient.put(`/api/assistants/${assistantId}`, {
        config,
      })
      setAssistant(response.data)
    } catch (error) {
      console.error("Error saving model:", error)
      throw error
    }
  }

  const handleSaveBackgroundAudio = async (type: string, volume: number) => {
    try {
      const config = { ...(assistant?.config || {}) } as Record<string, unknown>
      config.backgroundAudio = {
        type,
        volume,
      }
      const response = await apiClient.put(`/api/assistants/${assistantId}`, {
        config,
      })
      setAssistant(response.data)
      setBackgroundAudioType(type)
      setBackgroundAudioVolume(volume)
    } catch (error) {
      console.error("Error saving background audio:", error)
      throw error
    }
  }

  const handleSaveBackchanneling = async (next: {
    enabled: boolean
    frequency: number
    words: string
    interruptionSensitivity: number
  }) => {
    try {
      const words = next.words
        .split(",")
        .map((word) => word.trim())
        .filter((word) => word.length > 0)
      const config = { ...(assistant?.config || {}) } as Record<string, unknown>
      config.backchanneling = {
        enabled: next.enabled,
        frequency: next.frequency,
        words,
        interruptionSensitivity: next.interruptionSensitivity,
      }
      const response = await apiClient.put(`/api/assistants/${assistantId}`, {
        config,
      })
      setAssistant(response.data)
      setBackchannelEnabled(next.enabled)
      setBackchannelFrequency(next.frequency)
      setBackchannelWords(next.words)
      setInterruptionSensitivity(next.interruptionSensitivity)
    } catch (error) {
      console.error("Error saving backchanneling settings:", error)
      throw error
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading assistant...</p>
        </div>
      </div>
    )
  }

  if (!assistant) {
    return null
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background z-50 overflow-x-auto">
      <div className="min-w-[960px] w-full flex flex-col h-full">
        { }
        <div className="flex h-[56px] items-center justify-between border-b border-border/40 px-6 bg-background shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/assistants")}
              className="h-8 w-8 shrink-0 hover:bg-muted/50"
            >
              <Home className="h-4 w-4" />
            </Button>
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-[15px] font-semibold leading-tight truncate">{assistant.name}</h1>
                <Button variant="ghost" size="icon" className="h-4 w-4 shrink-0 p-0 hover:bg-transparent">
                  <Edit className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
              <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground leading-tight">
                <span className="whitespace-nowrap">Agent ID: {assistant.id.slice(0, 2)}...{assistant.id.slice(-3)}</span>
                <span className="whitespace-nowrap">LLM ID</span>
                <span className="whitespace-nowrap">$0.115/min</span>
                <span className="whitespace-nowrap">970-1300ms latency</span>
                <span className="whitespace-nowrap">65-305 tokens</span>
              </div>
            </div>
          </div>

          { }
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-8 h-full">
              <button
                onClick={() => setActiveTab("create")}
                className={cn(
                  "h-full px-1 text-[13px] font-medium transition-colors relative",
                  activeTab === "create"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Create
                {activeTab === "create" && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground" />
                )}
              </button>
              <button
                onClick={() => router.push(`/assistants/${assistantId}/conversation-flow`)}
                className="h-full px-1 text-[13px] font-medium transition-colors text-muted-foreground hover:text-foreground relative"
              >
                Workflows
              </button>
              <button
                onClick={() => setActiveTab("simulation")}
                className={cn(
                  "h-full px-1 text-[13px] font-medium transition-colors relative",
                  activeTab === "simulation"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Simulation
                {activeTab === "simulation" && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-1 justify-end">
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/50">
              <MoreVertical className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/50">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm" className="h-8 px-4 text-sm font-medium bg-foreground text-background hover:bg-foreground/90">
              Publish
            </Button>
          </div>
        </div>

        { }
        <div className="flex flex-1 overflow-hidden shrink-0">
          <LeftPanel
            prompt={prompt}
            onChangePrompt={setPrompt}
            voiceProvider={voiceProvider}
            onProviderChange={handleProviderChange}
            voiceOptions={voiceOptions}
            voiceId={voiceId}
            voiceName={voiceName}
            voiceAvatar={voiceAvatar}
            voiceError={voiceError}
            isLoadingVoices={isLoadingVoices}
            model={model}
            assistantId={assistantId}
            originalPrompt={originalPrompt}
            onSavePrompt={handleSavePrompt}
            onSaveVoice={handleSaveVoice}
            onSaveModel={handleSaveModel}
            backgroundAudioType={backgroundAudioType}
            backgroundAudioVolume={backgroundAudioVolume}
            onBackgroundAudioChange={handleSaveBackgroundAudio}
            backchannelEnabled={backchannelEnabled}
            backchannelFrequency={backchannelFrequency}
            backchannelWords={backchannelWords}
            interruptionSensitivity={interruptionSensitivity}
            onBackchannelChange={handleSaveBackchanneling}
          />
          <MiddlePanel
            settingsCategories={settingsCategories}
            onToggleCategory={toggleCategory}
            assistantId={assistantId}
          />
          <RightPanel />
        </div>
      </div>
    </div>
  )
}
