"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api/client"
import { auth } from "@/app/providers"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  Plus,
  Users,
  Calendar,
  MessageCircle,
  Receipt,
  ShoppingBag,
  ClipboardList,
  ChevronRight,
} from "lucide-react"
import {
  AGENT_TEMPLATES,
  BLANK_TEMPLATE_ID,
  type AgentTemplate,
  type FlowStepIcon,
} from "@/lib/agent-templates"

interface CreateAgentTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

function FlowStepIconComponent({ icon }: { icon: FlowStepIcon }) {
  const className = "h-4 w-4 text-muted-foreground shrink-0"
  switch (icon) {
    case "greetings":
      return <Users className={className} />
    case "screening":
      return <ClipboardList className={className} />
    case "schedule":
      return <Calendar className={className} />
    case "questions":
      return <MessageCircle className={className} />
    case "refund":
      return <Receipt className={className} />
    case "order":
      return <ShoppingBag className={className} />
    default:
      return <MessageCircle className={className} />
  }
}

export function CreateAgentTemplateDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateAgentTemplateDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(BLANK_TEMPLATE_ID)

  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        try {
          const orgResponse = await apiClient.get("/api/orgs/current")
          setOrgId(orgResponse.data?.orgId ?? null)
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
      setSelectedTemplateId(BLANK_TEMPLATE_ID)
      setError(null)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgId || !userId) return
    setIsLoading(true)
    setError(null)
    const template = AGENT_TEMPLATES.find((t) => t.id === selectedTemplateId)
    const name = template?.id === BLANK_TEMPLATE_ID ? "New Agent" : (template?.name ?? "New Agent")
    try {
      const response = await apiClient.post("/api/assistants", {
        orgId,
        name,
        description: template?.description ?? null,
        systemPrompt: null,
        status: "active",
        config: {
          type: "voice",
          agentType: "conversation-flow",
          template: selectedTemplateId,
        },
        createdBy: userId,
      })
      const newAssistant = response.data
      onOpenChange(false)
      onSuccess()
      router.push(`/assistants/${newAssistant.id}/conversation-flow`)
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { error?: string }; status?: number } }).response?.data?.error
        : null
      setError(message || (err instanceof Error ? err.message : "Failed to create agent"))
    } finally {
      setIsLoading(false)
    }
  }

  const blankTemplate = AGENT_TEMPLATES.find((t) => t.id === BLANK_TEMPLATE_ID)
  const prebuiltTemplates = AGENT_TEMPLATES.filter((t) => t.id !== BLANK_TEMPLATE_ID)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto p-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-xl">Create Agent</DialogTitle>
            <DialogDescription>Select Template</DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Start from blank - prominent card */}
            {blankTemplate && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Start from blank</div>
                <Card
                  role="button"
                  tabIndex={0}
                  className={cn(
                    "cursor-pointer transition-all hover:border-primary/50 hover:shadow-sm min-h-[120px] flex items-center justify-center",
                    selectedTemplateId === BLANK_TEMPLATE_ID
                      ? "border-2 border-primary shadow-sm bg-primary/5"
                      : "border"
                  )}
                  onClick={() => setSelectedTemplateId(BLANK_TEMPLATE_ID)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      setSelectedTemplateId(BLANK_TEMPLATE_ID)
                    }
                  }}
                >
                  <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center mb-2">
                      <Plus className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <span className="font-medium text-sm">{blankTemplate.name}</span>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Prebuilt templates grid */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Prebuilt templates</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {prebuiltTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    selected={selectedTemplateId === template.id}
                    onSelect={() => setSelectedTemplateId(template.id)}
                  />
                ))}
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

function TemplateCard({
  template,
  selected,
  onSelect,
}: {
  template: AgentTemplate
  selected: boolean
  onSelect: () => void
}) {
  return (
    <Card
      role="button"
      tabIndex={0}
      className={cn(
        "cursor-pointer transition-all hover:border-primary/50 hover:shadow-sm text-left",
        selected ? "border-2 border-primary shadow-sm bg-primary/5" : "border"
      )}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect()
        }
      }}
    >
      <CardContent className="p-4">
        {template.flowSteps.length >= 2 && (
          <div className="flex items-center gap-1 mb-3">
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-muted/60">
              <FlowStepIconComponent icon={template.flowSteps[0].icon} />
              <span className="text-xs font-medium text-muted-foreground">
                {template.flowSteps[0].label}
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/70 shrink-0" />
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-muted/60">
              <FlowStepIconComponent icon={template.flowSteps[1].icon} />
              <span className="text-xs font-medium text-muted-foreground">
                {template.flowSteps[1].label}
              </span>
            </div>
          </div>
        )}
        <span className="font-medium text-sm block leading-tight mb-1">{template.name}</span>
        {template.description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {template.description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
