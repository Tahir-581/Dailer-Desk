"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Bot,
  Book,
  MessageSquare,
  Radio,
  Headphones,
  TrendingUp,
  Shield,
  Package,
  ChevronDown,
  ChevronRight,
  Plus,
  Settings,
  ArrowUpRight,
  Trash2
} from "lucide-react"
import { apiClient } from "@/lib/api/client"
import { VOICE_PROVIDERS, type VoiceProviderId, type VoiceConfig, type LiveKitVoiceOption, BACKGROUND_AUDIO_OPTIONS } from "@/lib/voices"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SettingsCategory {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
}

const settingsCategories: SettingsCategory[] = [
  { id: "agent", title: "Agent Settings", icon: Bot },
  { id: "knowledge", title: "Knowledge Base", icon: Book },
  { id: "speech", title: "Speech Settings", icon: MessageSquare },
  { id: "transcription", title: "Realtime Transcription Settings", icon: Radio },
  { id: "call", title: "Call Settings", icon: Headphones },
  { id: "extraction", title: "Post-Call Data Extraction", icon: TrendingUp },
  { id: "security", title: "Security & Fallback Settings", icon: Shield },
  { id: "webhook", title: "Webhook Settings", icon: Package },
]

interface Assistant {
  id: string
  name: string
  systemPrompt?: string | null
  config?: {
    model?: string
    llm?: string
    voice?: VoiceConfig
    backgroundAudio?: {
      type?: string
      volume?: number
    } | string
  }
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

interface GlobalSettingsPanelProps {
  assistantId: string
}

interface KBItem {
  id: string
  name: string
  description: string | null
  content: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export function GlobalSettingsPanel({ assistantId }: GlobalSettingsPanelProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [assistant, setAssistant] = useState<Assistant | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [systemPrompt, setSystemPrompt] = useState("")
  const [model, setModel] = useState("gpt-4.1")
  const [voiceProvider, setVoiceProvider] = useState<VoiceProviderId>("inworld")
  const [voiceId, setVoiceId] = useState("")
  const [voiceName, setVoiceName] = useState("")
  const [voiceOptions, setVoiceOptions] = useState<LiveKitVoiceOption[]>([])
  const [isLoadingVoices] = useState(false)
  const [voiceError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [backgroundAudioType, setBackgroundAudioType] = useState<string>("None")
  const [backgroundAudioVolume, setBackgroundAudioVolume] = useState<number>(0.5)

  const [allKBItems, setAllKBItems] = useState<KBItem[]>([])
  const [orgId, setOrgId] = useState<string | null>(null)
  const [isLoadingKB, setIsLoadingKB] = useState(false)





  useEffect(() => {
    const fetchKBData = async () => {
      try {
        setIsLoadingKB(true)
        const startTime = Date.now()
        const orgResponse = await apiClient.get("/api/orgs/current")
        const currentOrgId = orgResponse.data.orgId
        setOrgId(currentOrgId)

        if (currentOrgId) {
          const kbStartTime = Date.now()
          const kbResponse = await apiClient.get(`/api/kb?orgId=${currentOrgId}`)
          const kbEndTime = Date.now()

          setAllKBItems(kbResponse.data || [])
        }
        const totalTime = Date.now() - startTime
      } catch (error) {
        console.error("Error fetching KB data:", error)
      } finally {
        setIsLoadingKB(false)
      }
    }



    fetchKBData()
  }, [])



  useEffect(() => {
    const fetchAssistant = async () => {
      if (!assistantId) return

      try {
        setIsLoading(true)
        const response = await apiClient.get<Assistant>(`/api/assistants/${assistantId}`)
        setAssistant(response.data)



        const prompt = response.data.systemPrompt || ""
        setSystemPrompt(prompt)



        const config = response.data.config || {}
        const rawModel = (config.model as string) || (config.llm as string) || "gpt-4.1"
        setModel(normalizeModelValue(rawModel))

        const voiceConfig = config.voice as VoiceConfig | undefined
        const provider = (voiceConfig?.provider as VoiceProviderId) || "inworld"
        const voices = VOICE_PROVIDERS[provider]?.voices ?? []
        setVoiceProvider(provider)
        setVoiceOptions(voices)
        setVoiceName(voiceConfig?.name ?? "")
        const savedVoiceId = voiceConfig?.voiceId ?? ""
        const match = voices.find((v) => v.voiceId === savedVoiceId || v.name === voiceConfig?.name || v.id === savedVoiceId)
        setVoiceId(match ? match.id : savedVoiceId)

        // Initialize background audio settings
        const bgAudioConfig = config.backgroundAudio
        if (typeof bgAudioConfig === 'object' && bgAudioConfig !== null) {
          setBackgroundAudioType(bgAudioConfig.type || "None")
          setBackgroundAudioVolume(bgAudioConfig.volume || 0.5)
        } else if (typeof bgAudioConfig === 'string') {
          setBackgroundAudioType(bgAudioConfig)
          setBackgroundAudioVolume(0.5)
        } else {
          setBackgroundAudioType("None")
          setBackgroundAudioVolume(0.5)
        }
      } catch (error) {
        console.error("Error fetching assistant:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAssistant()
  }, [assistantId])

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleSavePrompt = async (promptToSave?: string) => {
    if (!assistantId) return
    try {
      setIsSaving(true)


      const promptValue = promptToSave !== undefined ? promptToSave : systemPrompt

      const response = await apiClient.put(`/api/assistants/${assistantId}`, {
        systemPrompt: promptValue,
      })



      setAssistant(response.data)
      setSystemPrompt(promptValue)
    } catch (error) {
      console.error("Error saving prompt:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveModel = async (newModel: string) => {
    if (!assistantId || !assistant) return
    try {
      setIsSaving(true)
      const config = { ...(assistant.config || {}) }
      config.model = newModel
      config.llm = newModel

      const response = await apiClient.put(`/api/assistants/${assistantId}`, {
        config,
      })
      setModel(newModel)
      setAssistant(response.data)
    } catch (error) {
      console.error("Error saving model:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleProviderChange = (newProvider: VoiceProviderId) => {
    setVoiceProvider(newProvider)
    setVoiceId("")
    setVoiceName("")
    setVoiceOptions(VOICE_PROVIDERS[newProvider]?.voices ?? [])
  }

  const handleSaveVoice = async (selectedVoiceId: string) => {
    if (!assistantId || !assistant || !selectedVoiceId) return
    const option = voiceOptions.find((v) => v.id === selectedVoiceId)
    if (!option) return
    try {
      setIsSaving(true)
      const config = { ...(assistant.config || {}) }
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
      setVoiceName(option.name)
    } catch (error) {
      console.error("Error saving voice:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveBackgroundAudio = async (type: string, volume: number) => {
    if (!assistantId || !assistant) return
    try {
      setIsSaving(true)
      const config = { ...(assistant.config || {}) }
      config.backgroundAudio = {
        type: type,
        volume: volume,
      }
      const response = await apiClient.put(`/api/assistants/${assistantId}`, { config })
      setAssistant(response.data)
      setBackgroundAudioType(type)
      setBackgroundAudioVolume(volume)
    } catch (error) {
      console.error("Error saving background audio:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-3 space-y-1">
      {settingsCategories.map((category) => {
        const Icon = category.icon
        const isExpanded = expandedCategories.has(category.id)

        return (
          <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Icon className="h-4 w-4 text-gray-400 group-hover:text-gray-600 flex-shrink-0 transition-colors" />
                <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 whitespace-normal break-words">{category.title}</span>
              </div>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600 flex-shrink-0 transition-colors" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 flex-shrink-0 transition-colors" />
              )}
            </button>
            {isExpanded && (
              <div className="px-4 py-4 bg-gray-50/50 border-t border-gray-100">
                {category.id === "agent" ? (
                  <AgentSettingsContent
                    systemPrompt={systemPrompt}
                    onSystemPromptChange={setSystemPrompt}
                    onSavePrompt={handleSavePrompt}
                    model={model}
                    onModelChange={handleSaveModel}
                    voiceProvider={voiceProvider}
                    onProviderChange={handleProviderChange}
                    voiceOptions={voiceOptions}
                    voiceId={voiceId}
                    voiceName={voiceName}
                    onVoiceChange={handleSaveVoice}
                    isLoadingVoices={isLoadingVoices}
                    voiceError={voiceError}
                    isLoading={isLoading}
                    isSaving={isSaving}
                    backgroundAudioType={backgroundAudioType}
                    backgroundAudioVolume={backgroundAudioVolume}
                    onBackgroundAudioChange={handleSaveBackgroundAudio}
                  />
                ) : category.id === "knowledge" ? (
                  <KnowledgeBaseContent
                    assistantId={assistantId}
                    assistant={assistant}
                    onAssistantUpdate={setAssistant}
                    allKBItems={allKBItems}
                    orgId={orgId}
                    isLoadingKB={isLoadingKB}
                    onKBItemsUpdate={setAllKBItems}
                  />
                ) : (
                  <div className="text-sm text-gray-600 leading-relaxed">
                    Settings content for {category.title}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

interface AgentSettingsContentProps {
  systemPrompt: string
  onSystemPromptChange: (value: string) => void
  onSavePrompt: (promptToSave?: string) => void
  model: string
  onModelChange: (model: string) => void
  voiceProvider: VoiceProviderId
  onProviderChange: (provider: VoiceProviderId) => void
  voiceOptions: LiveKitVoiceOption[]
  voiceId: string
  voiceName: string
  onVoiceChange: (voiceId: string) => void
  isLoadingVoices: boolean
  voiceError: string | null
  isLoading: boolean
  isSaving: boolean
  backgroundAudioType: string
  backgroundAudioVolume: number
  onBackgroundAudioChange: (type: string, volume: number) => void
}

function AgentSettingsContent({
  systemPrompt,
  onSystemPromptChange,
  onSavePrompt,
  model,
  onModelChange,
  voiceProvider,
  onProviderChange,
  voiceOptions,
  voiceId,
  voiceName,
  onVoiceChange,
  isLoadingVoices,
  voiceError,
  isLoading,
  isSaving,
  backgroundAudioType,
  backgroundAudioVolume,
  onBackgroundAudioChange,
}: AgentSettingsContentProps) {
  const [localPrompt, setLocalPrompt] = useState(systemPrompt)

  useEffect(() => {
    setLocalPrompt(systemPrompt)
  }, [systemPrompt])

  const handlePromptBlur = () => {
    if (localPrompt !== systemPrompt) {


      onSavePrompt(localPrompt)


      onSystemPromptChange(localPrompt)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="flex-1 space-y-2">
          <Label className="text-xs font-semibold text-gray-700">Model</Label>
          <Select
            value={model}
            onValueChange={onModelChange}
            disabled={isSaving}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4.1">GPT 4.1</SelectItem>
              <SelectItem value="gpt-4">GPT 4</SelectItem>
              <SelectItem value="gpt-3.5">GPT 3.5</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 space-y-2">
          <Label className="text-xs font-semibold text-gray-700">Voice provider</Label>
          <Select
            value={voiceProvider}
            onValueChange={(v) => onProviderChange(v as VoiceProviderId)}
            disabled={isSaving}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(VOICE_PROVIDERS).map(([id, cfg]) => (
                <SelectItem key={id} value={id}>
                  {cfg.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 space-y-2">
          <Label className="text-xs font-semibold text-gray-700">Voice</Label>
          <Select
            value={voiceId || undefined}
            onValueChange={(v) => v && onVoiceChange(v)}
            disabled={isSaving}
          >
            <SelectTrigger className="h-9 text-sm">
              <div className="flex items-center gap-2 w-full">
                <Avatar className="h-4 w-4 shrink-0">
                  <AvatarFallback className="text-[10px] bg-gray-200 leading-none flex items-center justify-center">
                    {(voiceName || "?").charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <SelectValue placeholder="Select voice" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {voiceOptions.length === 0 && (
                <div className="px-2 py-1.5 text-xs text-gray-500">No voices</div>
              )}
              {voiceOptions.map((voice) => (
                <SelectItem key={voice.id} value={voice.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-4 w-4 shrink-0">
                      <AvatarFallback className="text-[10px]">
                        {voice.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{voice.name}</span>
                    {voice.description && (
                      <span className="text-xs text-gray-500"> — {voice.description}</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 space-y-2">
          <Label className="text-xs font-semibold text-gray-700">Background Audio</Label>
          <Select
            value={backgroundAudioType}
            onValueChange={(v) => onBackgroundAudioChange(v, backgroundAudioVolume)}
            disabled={isSaving}
          >
            <SelectTrigger className="h-9 text-sm">
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
          <Label className="text-xs font-semibold text-gray-700">Volume</Label>
          <div className="px-2 py-2">
            <Slider
              value={[Math.round((backgroundAudioVolume ?? 0.5) * 100)]}
              onValueChange={(vals) => onBackgroundAudioChange(backgroundAudioType, (vals?.[0] ?? 50) / 100)}
              min={0}
              max={100}
              step={5}
              disabled={isSaving}
            />
          </div>
        </div>
      </div>

      { }
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-gray-700">System Prompt</Label>
        <div className="relative">
          <Textarea
            value={localPrompt}
            onChange={(e) => setLocalPrompt(e.target.value)}
            onBlur={handlePromptBlur}
            placeholder="Enter system prompt..."
            className="min-h-[100px] text-sm resize-y"
            disabled={isSaving}
            style={{ resize: 'vertical' }}
          />
        </div>
      </div>
    </div>
  )
}

interface KnowledgeBaseContentProps {
  assistantId: string
  assistant: Assistant | null
  onAssistantUpdate?: (assistant: Assistant) => void
  allKBItems: KBItem[]
  orgId: string | null
  isLoadingKB: boolean
  onKBItemsUpdate: (items: KBItem[]) => void
}

function KnowledgeBaseContent({
  assistantId,
  assistant,
  onAssistantUpdate,
  allKBItems,
  orgId,
  isLoadingKB,
  onKBItemsUpdate
}: KnowledgeBaseContentProps) {
  const router = useRouter()
  const [selectedKBIds, setSelectedKBIds] = useState<string[]>([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)



  useEffect(() => {
    if (assistant?.config) {
      const config = assistant.config as Record<string, unknown>
      const kbIds = (config.knowledgeBaseIds as string[]) || []
      setSelectedKBIds(kbIds)
    }
  }, [assistant])

  const handleDropdownOpenChange = (open: boolean) => {
    setIsDropdownOpen(open)




    if (open && orgId) {
      const refreshKBItems = async () => {
        try {
          const response = await apiClient.get(`/api/kb?orgId=${orgId}`)
          onKBItemsUpdate(response.data || [])
        } catch (error) {
          console.error("Error refreshing KB items:", error)
        }
      }


      if (allKBItems.length > 0) {
        refreshKBItems()
      }
    }
  }

  const handleKBSelect = async (kbId: string) => {
    if (!assistantId || !assistant) return



    if (selectedKBIds.includes(kbId)) {
      setIsDropdownOpen(false)
      return
    }

    try {
      const config = { ...(assistant.config || {}) }
      const kbIds = (config.knowledgeBaseIds as string[]) || []
      config.knowledgeBaseIds = [...kbIds, kbId]

      const response = await apiClient.put(`/api/assistants/${assistantId}`, {
        config,
      })

      setSelectedKBIds([...selectedKBIds, kbId])
      if (onAssistantUpdate) {
        onAssistantUpdate(response.data)
      }
      setIsDropdownOpen(false)
    } catch (error) {
      console.error("Error adding KB to assistant:", error)
    }
  }

  const handleKBRemove = async (kbId: string) => {
    if (!assistantId || !assistant) return

    try {
      const config = { ...(assistant.config || {}) }
      const kbIds = (config.knowledgeBaseIds as string[]) || []
      config.knowledgeBaseIds = kbIds.filter(id => id !== kbId)

      const response = await apiClient.put(`/api/assistants/${assistantId}`, {
        config,
      })

      setSelectedKBIds(selectedKBIds.filter(id => id !== kbId))
      if (onAssistantUpdate) {
        onAssistantUpdate(response.data)
      }
    } catch (error) {
      console.error("Error removing KB from assistant:", error)
    }
  }



  const selectedKBItems = allKBItems.filter(kb => selectedKBIds.includes(kb.id))



  const availableKBItems = allKBItems.filter(kb => !selectedKBIds.includes(kb.id))

  const handleAddNewKB = () => {
    setIsDropdownOpen(false)
    window.open("/kb", "_blank")
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 leading-relaxed">
        Add knowledge base to provide context to the agent.
      </p>

      { }
      {selectedKBItems.length > 0 && (
        <div className="space-y-2">
          {selectedKBItems.map((kb) => (
            <div
              key={kb.id}
              className="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Book className="h-4 w-4 text-gray-500 shrink-0" />
                <span className="text-sm text-gray-700 truncate">{kb.name}</span>
              </div>
              <button
                onClick={() => handleKBRemove(kb.id)}
                className="ml-2 p-1.5 hover:bg-gray-200 rounded transition-colors shrink-0"
                aria-label="Remove knowledge base"
              >
                <Trash2 className="h-3.5 w-3.5 text-gray-500 hover:text-gray-700" />
              </button>
            </div>
          ))}
        </div>
      )}

      { }
      <DropdownMenu open={isDropdownOpen} onOpenChange={handleDropdownOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button
            className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 h-9 text-sm font-normal"
          >
            <Plus className="h-3.5 w-3.5 mr-2" />
            Add
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-full min-w-[280px]">
          {isLoadingKB && allKBItems.length === 0 && (
            <DropdownMenuItem disabled>
              <span className="text-sm text-gray-500">Loading knowledge bases...</span>
            </DropdownMenuItem>
          )}
          {availableKBItems.length > 0 && (
            <>
              {availableKBItems.map((kb) => (
                <DropdownMenuItem
                  key={kb.id}
                  onClick={() => handleKBSelect(kb.id)}
                  className="cursor-pointer"
                >
                  <Book className="h-4 w-4 mr-2 text-gray-400 shrink-0" />
                  <span className="text-sm flex-1">{kb.name}</span>
                </DropdownMenuItem>
              ))}
            </>
          )}
          {(!isLoadingKB || allKBItems.length > 0) && (
            <DropdownMenuItem
              onClick={handleAddNewKB}
              className={`cursor-pointer ${availableKBItems.length > 0 ? 'border-t border-gray-200 mt-1 pt-1' : ''}`}
            >
              <ArrowUpRight className="h-4 w-4 mr-2 text-gray-400 shrink-0" />
              <span className="text-sm flex-1">Add New Knowledge Base</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      { }
      <div className="space-y-3 pt-2 border-t border-gray-200">
        <h4 className="text-xs font-semibold text-gray-700">Advance Setting</h4>
        <Button
          onClick={() => { }}
          variant="outline"
          className="w-full bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 h-9 text-sm font-normal"
        >
          <Settings className="h-3.5 w-3.5 mr-2" />
          Adjust KB Retrieval Chunks and Similarity
        </Button>
      </div>
    </div >
  )
}
