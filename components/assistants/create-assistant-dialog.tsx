"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api/client"
import { auth } from "@/app/providers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  Workflow,
  Brackets,
  Network,
  Link2,
  Plus,
  Phone
} from "lucide-react"

interface CreateAssistantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  agentType?: "voice" | "chat"
}

type AgentTypeOption = "conversation-flow" | "single-prompt" | "multi-prompt" | "custom-llm"
type TemplateOption = "blank" | "notification" | "healthcare"

export function CreateAssistantDialog({
  open,
  onOpenChange,
  onSuccess,
  agentType,
}: CreateAssistantDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [selectedAgentType, setSelectedAgentType] = useState<AgentTypeOption>("single-prompt")
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateOption>("blank")

  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        try {
          const orgResponse = await apiClient.get("/api/orgs/current")
          setOrgId(orgResponse.data.orgId)

          const session = await auth.getSession()
          if (session?.data?.user?.id) {
            setUserId(session.data.user.id)
          }
        } catch (err) {
          console.error("Error fetching org/user data:", err)
          setError("Failed to load organization or user data")
        }
      }

      fetchData()
      setName("")
      setSelectedAgentType("single-prompt")
      setSelectedTemplate("blank")
      setError(null)
    }
  }, [open])

  const agentTypeOptions = [
    {
      id: "conversation-flow" as AgentTypeOption,
      label: "Conversation Flow Agent",
      description: "For rigid, highly formatted conversations.",
      icon: Workflow,
    },
    {
      id: "single-prompt" as AgentTypeOption,
      label: "Single Prompt Agent",
      description: "For simple, freeform conversations.",
      icon: Brackets,
    },
    {
      id: "multi-prompt" as AgentTypeOption,
      label: "Multi-Prompt Agent",
      description: "For flexible conversations with structured flows.",
      icon: Network,
    },
    {
      id: "custom-llm" as AgentTypeOption,
      label: "Custom LLM",
      description: "Attach your custom llm link.",
      icon: Link2,
    },
  ]

  const templateOptions = [
    {
      id: "blank" as TemplateOption,
      label: "Start from blank",
      description: "",
      icon: Plus,
    },
    {
      id: "notification" as TemplateOption,
      label: "Notification",
      description: "After giving the notification, end the call.",
      icon: Phone,
    },
    {
      id: "healthcare" as TemplateOption,
      label: "Healthcare Check-In",
      description: "Ask questions to gather information, can transfer call.",
      icon: Phone,
    },
  ]

  const getAgentTypeName = (type: AgentTypeOption): string => {
    const option = agentTypeOptions.find(opt => opt.id === type)
    return option?.label || "Single Prompt Agent"
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!orgId || !userId) {
      setError("Organization or user data not available. Please try again.")
      setIsLoading(false)
      return
    }

    try {
      const agentName = name.trim() || getAgentTypeName(selectedAgentType)

      const config: Record<string, unknown> = {
        type: agentType || "voice",
        agentType: selectedAgentType,
        template: selectedTemplate,
      }

      const response = await apiClient.post("/api/assistants", {
        orgId,
        name: agentName,
        description: null,
        systemPrompt: null,
        status: "active",
        config,
        createdBy: userId,
      })

      const newAssistant = response.data;

      onOpenChange(false)
      onSuccess()

      

      if (selectedAgentType === "conversation-flow") {
        router.push(`/assistants/${newAssistant.id}/conversation-flow`)
      } else {
        router.push(`/assistants/${newAssistant.id}`)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to create assistant")
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-xl">Create Agent</DialogTitle>
          </DialogHeader>

          <div className="space-y-8 px-6 pb-6">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Agent Name</Label>
              <Input
                placeholder="e.g. Sales Assistant"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10"
              />
            </div>

            {}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Agent Type</Label>
              <div className="grid grid-cols-2 gap-3">
                {agentTypeOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <label
                      key={option.id}
                      className={cn(
                        "flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all bg-background",
                        selectedAgentType === option.id
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/30 hover:bg-accent/50"
                      )}
                    >
                      <input
                        type="radio"
                        name="agentType"
                        value={option.id}
                        checked={selectedAgentType === option.id}
                        onChange={() => setSelectedAgentType(option.id)}
                        className="mt-0.5 h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                          <span className="font-medium text-sm leading-tight">{option.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {option.description}
                        </p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            {}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Select Template</Label>
              <div className="grid grid-cols-3 gap-4">
                {templateOptions.map((template) => {
                  const Icon = template.icon
                  return (
                    <Card
                      key={template.id}
                      className={cn(
                        "cursor-pointer transition-all hover:border-primary/50 hover:shadow-sm",
                        selectedTemplate === template.id
                          ? "border-2 border-primary shadow-sm"
                          : "border"
                      )}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <CardContent className="p-5 flex flex-col items-center justify-center text-center min-h-[140px]">
                        {template.id === "blank" ? (
                          <div className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center mb-3">
                            <Icon className="h-10 w-10 text-muted-foreground" />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-md bg-muted flex items-center justify-center mb-3">
                            <Icon className="h-7 w-7 text-muted-foreground" />
                          </div>
                        )}
                        <span className="font-medium text-sm mb-1.5 leading-tight">
                          {template.label}
                        </span>
                        {template.description && (
                          <p className="text-xs text-muted-foreground leading-relaxed px-1">
                            {template.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 pb-6 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="min-w-[80px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !orgId || !userId}
              className="min-w-[80px]"
            >
              {isLoading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
