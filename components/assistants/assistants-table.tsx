"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Bot, ChevronDown, MoreVertical, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { apiClient } from "@/lib/api/client"
import { CreateAssistantDialog } from "./create-assistant-dialog"
import { CreateAgentTemplateDialog } from "./create-agent-template-dialog"
import { EditAssistantDialog } from "./edit-assistant-dialog"
import { DeleteAssistantDialog } from "./delete-assistant-dialog"

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

interface DisplayAssistant {
  id: string
  name: string
  type: string
  voice: { name: string; avatar: string | null }
  phone: string
  editedBy: string
}

export function AssistantsTable() {
  const router = useRouter()
  const [assistants, setAssistants] = useState<DisplayAssistant[]>([])
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [agentType, setAgentType] = useState<"voice" | "chat">("voice")
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedAssistantId, setSelectedAssistantId] = useState<string | null>(null)
  const [selectedAssistantName, setSelectedAssistantName] = useState<string | null>(null)

  const fetchAssistants = async () => {
    try {
      setIsLoading(true)
      const orgResponse = await apiClient.get<{ orgId: string }>("/api/orgs/current")
      const orgId = orgResponse.data?.orgId
      if (!orgId) {
        setAssistants([])
        setCurrentOrgId(null)
        return
      }
      setCurrentOrgId(orgId)

      const response = await apiClient.get<Assistant[]>("/api/assistants", {
        params: { orgId },
      })
      const assistantsData = response.data

      

      const displayAssistants: DisplayAssistant[] = assistantsData.map((assistant) => {
        const config = assistant.config || {}

        

        const type =
          (config.type as string) ||
          (config.agentType as string) ||
          (assistant.systemPrompt ? "Single Prompt" : "Conversation Flow") ||
          "Unknown"

        

        const voiceConfig = config.voice as { name?: string; avatar?: string } | undefined
        const voice = {
          name: voiceConfig?.name || "Default",
          avatar: voiceConfig?.avatar || null,
        }

        

        const phone = (config.phone as string) || "-"

        

        const editedBy = assistant.updatedAt
          ? new Date(assistant.updatedAt).toLocaleString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }).replace(",", "")
          : "-"

        return {
          id: assistant.id,
          name: assistant.name,
          type,
          voice,
          phone,
          editedBy,
        }
      })

      setAssistants(displayAssistants)
    } catch (error: unknown) {
      console.error("Error fetching assistants:", error)
      setAssistants([])
      const status = (error as { response?: { status?: number } })?.response?.status
      if (status === 404) {
        setCurrentOrgId(null)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAssistants()
  }, [])

  const handleCreateSuccess = () => {
    

    fetchAssistants()
  }

  const handleOpenDialog = (type: "voice" | "chat") => {
    setAgentType(type)
    if (type === "voice") {
      setTemplateDialogOpen(true)
    } else {
      setDialogOpen(true)
    }
  }

  const handleEdit = (assistantId: string) => {
    setSelectedAssistantId(assistantId)
    setEditDialogOpen(true)
  }

  const handleDelete = (assistantId: string, assistantName: string) => {
    setSelectedAssistantId(assistantId)
    setSelectedAssistantName(assistantName)
    setDeleteDialogOpen(true)
  }

  const handleEditSuccess = () => {
    fetchAssistants()
    setSelectedAssistantId(null)
  }

  const handleDeleteSuccess = () => {
    fetchAssistants()
    setSelectedAssistantId(null)
    setSelectedAssistantName(null)
  }

  

  const filteredAssistants = assistants.filter((assistant) =>
    assistant.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  return (
    <div className="flex flex-1 flex-col">
      {}
      <div className="flex h-14 items-center justify-between border-b px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">All Agents</span>
        </div>
        <div className="flex items-center gap-2">
          {}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="h-9 w-64 pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {}
          <Button variant="outline" size="default" className="h-9">
            Import
          </Button>
          {}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="default" className="h-9 gap-2">
                Create an Agent
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                className="flex items-center gap-2"
                onClick={() => handleOpenDialog("voice")}
              >
                <div className="flex h-4 w-4 items-center justify-center rounded bg-green-500">
                  <Bot className="h-3 w-3 text-white" />
                </div>
                <span>Voice Agent</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2"
                onClick={() => handleOpenDialog("chat")}
              >
                <div className="flex h-4 w-4 items-center justify-center rounded bg-blue-500">
                  <Bot className="h-3 w-3 text-white" />
                </div>
                <span>Chat Agent</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <CreateAssistantDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onSuccess={handleCreateSuccess}
            agentType={agentType}
          />
          <CreateAgentTemplateDialog
            open={templateDialogOpen}
            onOpenChange={setTemplateDialogOpen}
            onSuccess={handleCreateSuccess}
          />
        </div>
      </div>

      {}
      <EditAssistantDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleEditSuccess}
        assistantId={selectedAssistantId}
      />
      <DeleteAssistantDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onSuccess={handleDeleteSuccess}
        assistantId={selectedAssistantId}
        assistantName={selectedAssistantName}
      />

      {}
      <div className="flex flex-1 flex-col overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Agent Name</TableHead>
              <TableHead>Agent Type</TableHead>
              <TableHead>Voice</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Edited by</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  Loading assistants...
                </TableCell>
              </TableRow>
            ) : currentOrgId === null && assistants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  No organization selected. Switch or select an organization to view assistants.
                </TableCell>
              </TableRow>
            ) : filteredAssistants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  {searchQuery ? "No assistants found matching your search." : "No assistants found."}
                </TableCell>
              </TableRow>
            ) : (
              filteredAssistants.map((agent) => (
                <TableRow
                  key={agent.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    if (agent.type.toLowerCase().includes("flow") || agent.type === "conversation-flow") {
                      router.push(`/assistants/${agent.id}/conversation-flow`)
                    } else {
                      router.push(`/assistants/${agent.id}`)
                    }
                  }}
                >
                  <TableCell className="py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-green-500">
                        <Bot className="h-3 w-3 text-white" />
                      </div>
                      <span className="font-medium">{agent.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant="outline" className="bg-muted/50 text-muted-foreground font-normal">
                      {agent.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarImage src={agent.voice.avatar || undefined} />
                        <AvatarFallback className="text-xs bg-muted">
                          {agent.voice.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{agent.voice.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="text-sm text-muted-foreground">{agent.phone}</span>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="text-sm text-muted-foreground">{agent.editedBy}</span>
                  </TableCell>
                  <TableCell className="py-3" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(agent.id)
                          }}
                          className="flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(agent.id, agent.name)
                          }}
                          className="flex items-center gap-2 text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

