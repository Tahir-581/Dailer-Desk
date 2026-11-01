"use client"

import { useState, useEffect } from "react"
import { Bot, Info, ExternalLink } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/assistants/config/livekit/alert"
import { apiClient } from "@/lib/api/client"

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

interface AgentOption {
  id: string
  name: string
  type: string
  displayName: string
  voice?: {
    name: string
    avatar?: string
  }
}

interface AgentTransferModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: (data: {
    name: string
    description: string
    selectedAgent: string
    voice: string
    voiceAvatar?: string
    speakDuringExecution: boolean
    postCallAnalysis: "transferred" | "both"
    webhookSetting: "transferred" | "both" | "this"
  }) => void
}

export function AgentTransferModal({ open, onOpenChange, onSave }: AgentTransferModalProps) {
  const [name, setName] = useState("agent_transfer")
  const [description, setDescription] = useState("")
  const [selectedAgent, setSelectedAgent] = useState("")
  const [voice, setVoice] = useState("Cimo")
  const [voiceAvatar, setVoiceAvatar] = useState<string | undefined>(undefined)
  const [speakDuringExecution, setSpeakDuringExecution] = useState(false)
  const [postCallAnalysis, setPostCallAnalysis] = useState<"transferred" | "both">("transferred")
  const [webhookSetting, setWebhookSetting] = useState<"transferred" | "both" | "this">("this")
  const [agents, setAgents] = useState<AgentOption[]>([])
  const [isLoadingAgents, setIsLoadingAgents] = useState(false)

  

  useEffect(() => {
    if (open) {
      fetchAgents()
    }
  }, [open])

  const fetchAgents = async () => {
    try {
      setIsLoadingAgents(true)
      const response = await apiClient.get<Assistant[]>("/api/assistants")
      const assistantsData = response.data

      

      const agentOptions: AgentOption[] = assistantsData.map((assistant) => {
        const config = assistant.config || {}

        

        const type =
          (config.type as string) ||
          (config.agentType as string) ||
          (assistant.systemPrompt ? "Single Prompt Agent" : "Conversation Flow Agent") ||
          "Unknown Agent"

        

        const voiceConfig = config.voice as { name?: string; avatar?: string } | undefined
        const voice = {
          name: voiceConfig?.name || "Default",
          avatar: voiceConfig?.avatar || undefined,
        }

        

        const displayName = `${assistant.name} - (${type})`

        return {
          id: assistant.id,
          name: assistant.name,
          type,
          displayName,
          voice,
        }
      })

      

      const sortedAgents = agentOptions.sort((a, b) => {
        const aAssistant = assistantsData.find((asst) => asst.id === a.id)
        const bAssistant = assistantsData.find((asst) => asst.id === b.id)
        if (!aAssistant || !bAssistant) return 0
        return new Date(bAssistant.updatedAt).getTime() - new Date(aAssistant.updatedAt).getTime()
      })

      

      if (sortedAgents.length > 0) {
        sortedAgents[0].displayName = `${sortedAgents[0].name} - (Latest)`
      }

      setAgents(sortedAgents)
    } catch (error) {
      console.error("Error fetching agents:", error)
      setAgents([])
    } finally {
      setIsLoadingAgents(false)
    }
  }

  

  useEffect(() => {
    if (agents.length > 0 && !selectedAgent) {
      const firstAgent = agents[0]
      setSelectedAgent(firstAgent.id)
      setVoice(firstAgent.voice?.name || "Cimo")
      setVoiceAvatar(firstAgent.voice?.avatar)
    }
  }, [agents, selectedAgent])

  

  useEffect(() => {
    if (selectedAgent) {
      const selectedAgentData = agents.find((agent) => agent.id === selectedAgent)
      if (selectedAgentData) {
        setVoice(selectedAgentData.voice?.name || "Cimo")
        setVoiceAvatar(selectedAgentData.voice?.avatar)
      }
    }
  }, [selectedAgent, agents])

  

  useEffect(() => {
    if (!open) {
      setName("agent_transfer")
      setDescription("")
      setSelectedAgent("")
      setVoice("Cimo")
      setVoiceAvatar(undefined)
      setSpeakDuringExecution(false)
      setPostCallAnalysis("transferred")
      setWebhookSetting("this")
    }
  }, [open])

  const handleSave = () => {
    if (onSave) {
      onSave({
        name,
        description,
        selectedAgent,
        voice,
        voiceAvatar,
        speakDuringExecution,
        postCallAnalysis,
        webhookSetting,
      })
    }
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] max-h-[85vh] flex flex-col">
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Bot className="h-4 w-4" />
            Agent Transfer
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            Transfer to another agent to bring in new capabilities and fulfill different tasks.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-2">
          {}
          <Alert className="bg-blue-50 border-blue-200 text-blue-900">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs text-blue-900">
              It will be a seamless transition, with all the call context preserved. It will appear as a single call in history.
            </AlertDescription>
          </Alert>

          {}
          <div className="space-y-1.5">
            <Label htmlFor="function-name" className="text-xs">Function Name</Label>
            <Input
              id="function-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="agent_transfer"
              className="text-xs h-9"
            />
          </div>

          {}
          <div className="space-y-1.5">
            <Label htmlFor="agent-description" className="text-xs">Description</Label>
            <Textarea
              id="agent-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Transfer the call to the customer service agent"
              className="min-h-[60px] text-xs"
            />
          </div>

          {}
          <div className="space-y-1.5">
            <Label className="text-xs">Select Agent</Label>
            <Select value={selectedAgent} onValueChange={setSelectedAgent} disabled={isLoadingAgents}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder={isLoadingAgents ? "Loading agents..." : "Select an agent"} />
              </SelectTrigger>
              <SelectContent>
                {agents.length === 0 && !isLoadingAgents && (
                  <SelectItem value="no-agents" disabled className="text-xs">
                    No agents available
                  </SelectItem>
                )}
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id} className="text-xs">
                    {agent.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {}
          <div className="space-y-1.5">
            <Label className="text-xs">Voice</Label>
            <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
              <Avatar className="h-6 w-6">
                <AvatarImage src={voiceAvatar} />
                <AvatarFallback className="text-[10px] bg-muted">
                  {voice.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium flex-1">{voice}</span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <p className="text-[11px] text-muted-foreground">
              It will use the voice that you set for the selected agent.
            </p>
          </div>

          {}
          <div className="space-y-2.5">
            <Label className="text-xs font-semibold">Execution Message</Label>
            <div className="flex items-start space-x-2.5">
              <Checkbox
                id="speak-during-execution"
                checked={speakDuringExecution}
                onCheckedChange={(checked) => setSpeakDuringExecution(checked === true)}
                className="h-4 w-4 mt-0.5"
              />
              <div className="flex-1">
                <Label htmlFor="speak-during-execution" className="text-xs font-normal cursor-pointer">
                  Speak During Execution
                </Label>
                <p className="text-[11px] text-muted-foreground mt-1">
                  If the function takes over 2 seconds, the agent can say something like: &quot;Let me check that for you.&quot;
                </p>
              </div>
            </div>
          </div>

          {}
          <div className="space-y-2.5">
            <Label className="text-xs font-semibold">Post Call Analysis Setting</Label>
            <p className="text-[11px] text-muted-foreground">
              Select which agent&apos;s analysis fields to include in the call history.
            </p>
            <RadioGroup value={postCallAnalysis} onValueChange={(v) => setPostCallAnalysis(v as "transferred" | "both")} className="space-y-2.5">
              <div className="flex items-center space-x-2.5">
                <RadioGroupItem value="transferred" id="analysis-transferred" />
                <Label htmlFor="analysis-transferred" className="text-xs font-normal cursor-pointer leading-none">
                  Only transferred agent
                </Label>
              </div>
              <div className="flex items-center space-x-2.5">
                <RadioGroupItem value="both" id="analysis-both" />
                <Label htmlFor="analysis-both" className="text-xs font-normal cursor-pointer leading-none">
                  Both this agent and transferred agent
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Webhook Setting */}
          <div className="space-y-2.5">
            <Label className="text-xs font-semibold">Webhook Setting</Label>
            <p className="text-[11px] text-muted-foreground">
              Select which agent&apos;s webhook endpoint to use for sending call updates.
            </p>
            <RadioGroup value={webhookSetting} onValueChange={(v) => setWebhookSetting(v as "transferred" | "both" | "this")} className="space-y-2.5">
              <div className="flex items-center space-x-2.5">
                <RadioGroupItem value="transferred" id="webhook-transferred" />
                <Label htmlFor="webhook-transferred" className="text-xs font-normal cursor-pointer leading-none">
                  Only transferred agent
                </Label>
              </div>
              <div className="flex items-center space-x-2.5">
                <RadioGroupItem value="both" id="webhook-both" />
                <Label htmlFor="webhook-both" className="text-xs font-normal cursor-pointer leading-none">
                  Both this agent and transferred agent
                </Label>
              </div>
              <div className="flex items-center space-x-2.5">
                <RadioGroupItem value="this" id="webhook-this" />
                <Label htmlFor="webhook-this" className="text-xs font-normal cursor-pointer leading-none">
                  Only this agent
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter className="mt-3 pt-3 border-t">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-foreground text-background hover:bg-foreground/90">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

