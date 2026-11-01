"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

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

interface EditAssistantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  assistantId: string | null
}

export function EditAssistantDialog({
  open,
  onOpenChange,
  onSuccess,
  assistantId,
}: EditAssistantDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [assistant, setAssistant] = useState<Assistant | null>(null)

  

  useEffect(() => {
    if (open && assistantId) {
      const fetchAssistant = async () => {
        setIsFetching(true)
        try {
          const response = await apiClient.get<Assistant>(`/api/assistants/${assistantId}`)
          setAssistant(response.data)
        } catch (err) {
          console.error("Error fetching assistant:", err)
          setError("Failed to load assistant data")
        } finally {
          setIsFetching(false)
        }
      }

      fetchAssistant()
    } else {
      setAssistant(null)
      setError(null)
    }
  }, [open, assistantId])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!assistantId || !assistant) return

    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const systemPrompt = formData.get("systemPrompt") as string
    const voiceName = formData.get("voiceName") as string
    const phone = formData.get("phone") as string

    if (!name || name.trim().length === 0) {
      setError("Assistant name is required")
      setIsLoading(false)
      return
    }

    try {
      

      const config = { ...(assistant.config || {}) }
      
      

      const existingAgentType = (config.agentType as string) || 
                                 ((config.type as string)?.toLowerCase().includes("voice") ? "voice" : "chat")
      const agentType = existingAgentType || "chat"

      config.type = agentType === "voice" ? "Voice Agent" : "Chat Agent"
      config.agentType = agentType

      if (agentType === "voice") {
        if (voiceName) {
          config.voice = { name: voiceName, ...(config.voice as object || {}) }
        }
        if (phone) {
          config.phone = phone
        }
      }

      await apiClient.put(`/api/assistants/${assistantId}`, {
        name: name.trim(),
        description: description?.trim() || null,
        systemPrompt: systemPrompt?.trim() || null,
        config,
      })

      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to update assistant")
      setIsLoading(false)
    }
  }

  if (!assistant && isFetching) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="py-8 text-center text-sm text-muted-foreground">
            Loading assistant data...
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!assistant) {
    return null
  }

  const config = assistant.config || {}
  const existingAgentType = (config.agentType as string) || 
                           ((config.type as string)?.toLowerCase().includes("voice") ? "voice" : "chat")
  const agentType = existingAgentType || "chat"
  const voiceConfig = config.voice as { name?: string; avatar?: string } | undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Assistant</DialogTitle>
            <DialogDescription>
              Update the assistant details and configuration.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="name">Agent Name *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="My Assistant"
                required
                disabled={isLoading}
                defaultValue={assistant.name}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Brief description of what this assistant does..."
                disabled={isLoading}
                rows={2}
                defaultValue={assistant.description || ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="systemPrompt">System Prompt</Label>
              <Textarea
                id="systemPrompt"
                name="systemPrompt"
                placeholder="Instructions for the assistant's behavior..."
                disabled={isLoading}
                rows={4}
                defaultValue={assistant.systemPrompt || ""}
              />
            </div>
            {agentType === "voice" && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="voiceName">Voice Name</Label>
                  <Input
                    id="voiceName"
                    name="voiceName"
                    type="text"
                    placeholder="e.g., Cimo"
                    disabled={isLoading}
                    defaultValue={voiceConfig?.name || ""}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="text"
                    placeholder="e.g., +1234567890"
                    disabled={isLoading}
                    defaultValue={(config.phone as string) || ""}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Assistant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

