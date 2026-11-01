"use client"

import { useState } from "react"
import {
  ChevronDown,
  ChevronRight,
  Plus,
  PhoneOff,
  PhoneForwarded,
  Bot,
  Calendar,
  Grid3x3,
  MessageSquare,
  Braces,
  Link2
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { EndCallModal } from "./end-call-modal"
import { TransferCallModal } from "./transfer-call-modal"
import { AgentTransferModal } from "./agent-transfer-modal"
import { FunctionConfigModal } from "@/components/conversation-flow/nodes/function-config-modal"

interface SettingsCategory {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  isOpen?: boolean
}

interface MiddlePanelProps {
  settingsCategories: SettingsCategory[]
  onToggleCategory: (id: string) => void
  assistantId?: string
}

interface FunctionOption {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const FUNCTION_OPTIONS: FunctionOption[] = [
  { id: "end-call", label: "End Call", icon: PhoneOff },
  { id: "call-transfer", label: "Call Transfer", icon: PhoneForwarded },
  { id: "agent-transfer", label: "Agent Transfer", icon: Bot },
  { id: "check-calendar", label: "Check Calendar Availability (Cal.com)", icon: Calendar },
  { id: "book-calendar", label: "Book on the Calendar (Cal.com)", icon: Calendar },
  { id: "press-digit", label: "Press Digit (IVR Navigation)", icon: Grid3x3 },
  { id: "send-sms", label: "Send SMS", icon: MessageSquare },
  { id: "extract-variable", label: "Extract Dynamic Variable", icon: Braces },
  { id: "custom-function", label: "Custom Function", icon: Link2 },
]

export function MiddlePanel({ settingsCategories, onToggleCategory, assistantId }: MiddlePanelProps) {
  const [endCallModalOpen, setEndCallModalOpen] = useState(false)
  const [transferCallModalOpen, setTransferCallModalOpen] = useState(false)
  const [agentTransferModalOpen, setAgentTransferModalOpen] = useState(false)
  const [customFunctionModalOpen, setCustomFunctionModalOpen] = useState(false)

  const handleFunctionSelect = (functionId: string) => {


    if (functionId === "end-call") {
      setEndCallModalOpen(true)
    } else if (functionId === "call-transfer") {
      setTransferCallModalOpen(true)
    } else if (functionId === "agent-transfer") {
      setAgentTransferModalOpen(true)
    } else if (functionId === "custom-function") {
      setCustomFunctionModalOpen(true)
    }


  }

  const handleEndCallSave = (data: { name: string; description: string }) => {

  }

  const handleTransferCallSave = (data: any) => {

  }

  const handleAgentTransferSave = (data: any) => {

  }

  const handleCustomFunctionSave = (config: any) => {

  }

  return (
    <div className="w-[260px] min-w-[300px] border-r border-border/40 overflow-y-auto bg-background shrink-0">
      <div className="py-3">
        {settingsCategories.map((category) => {
          const Icon = category.icon
          const isOpen = category.isOpen || false
          const isFunctions = category.id === "functions"

          return (
            <div key={category.id}>
              <button
                onClick={() => onToggleCategory(category.id)}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/40 transition-colors group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className="h-[14px] w-[14px] text-muted-foreground shrink-0" />
                  <span className="text-[13px] text-foreground truncate">{category.title}</span>
                </div>
                {isOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-2" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-2" />
                )}
              </button>
              {isOpen && (
                <div className="pl-8 pr-3 py-3 bg-muted/20">
                  {isFunctions ? (
                    <div className="space-y-3">
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Enable your agent with capabilities such as calendar bookings, call termination, etc.
                      </p>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-full justify-start gap-2 text-[12px] font-normal"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[280px]">
                          {FUNCTION_OPTIONS.map((option) => {
                            const OptionIcon = option.icon
                            return (
                              <DropdownMenuItem
                                key={option.id}
                                className="gap-2 cursor-pointer"
                                onClick={() => handleFunctionSelect(option.id)}
                              >
                                <OptionIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="text-[13px] flex-1">{option.label}</span>
                              </DropdownMenuItem>
                            )
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ) : (
                    <div className="text-[11px] text-muted-foreground">
                      Settings content for {category.title}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      { }
      <EndCallModal
        open={endCallModalOpen}
        onOpenChange={setEndCallModalOpen}
        onSave={handleEndCallSave}
      />
      <TransferCallModal
        open={transferCallModalOpen}
        onOpenChange={setTransferCallModalOpen}
        onSave={handleTransferCallSave}
      />
      <AgentTransferModal
        open={agentTransferModalOpen}
        onOpenChange={setAgentTransferModalOpen}
        onSave={handleAgentTransferSave}
      />
      <FunctionConfigModal
        open={customFunctionModalOpen}
        onOpenChange={setCustomFunctionModalOpen}
        onSave={handleCustomFunctionSave}
        assistantId={assistantId}
        defaultView="create"
      />
    </div>
  )
}











