"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Home, Edit, MoreVertical, RefreshCw, Play, Copy, Rocket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { apiClient } from "@/lib/api/client"

interface ConversationFlowHeaderProps {
  assistantId: string
  activeTab: "create" | "simulation"
  onTabChange: (tab: "create" | "simulation") => void
}

interface Assistant {
  id: string
  name: string
}

export function ConversationFlowHeader({
  assistantId,
  activeTab,
  onTabChange,
}: ConversationFlowHeaderProps) {
  const router = useRouter()
  const [assistant, setAssistant] = useState<Assistant | null>(null)
  const [autoSaveTime, setAutoSaveTime] = useState<string>("")
  const [copied, setCopied] = useState<string>("")

  useEffect(() => {
    const fetchAssistant = async () => {
      try {
        const response = await apiClient.get<Assistant>(`/api/assistants/${assistantId}`)
        setAssistant(response.data)
      } catch (error) {
        console.error("Error fetching assistant:", error)
      }
    }

    if (assistantId) {
      fetchAssistant()
    }
  }, [assistantId])

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours = now.getHours().toString().padStart(2, "0")
      const minutes = now.getMinutes().toString().padStart(2, "0")
      setAutoSaveTime(`${hours}:${minutes}`)
    }
    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(""), 2000)
  }

  const agentIdShort = assistantId ? `${assistantId.slice(0, 2)}...${assistantId.slice(-3)}` : "ag...64c"
  const cfIdShort = "co...253"

  return (
    <div className="flex flex-col border-b border-gray-200 shrink-0 bg-white">
      <div className="flex items-center px-6 py-3 bg-white border-b border-gray-200">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/assistants")}
          className="h-8 w-8 shrink-0 hover:bg-gray-100 text-gray-600"
        >
          <Home className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 ml-3">
          <h1 className="text-[15px] font-medium text-gray-900 leading-tight">
            Conversation Flow Agent
          </h1>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-4 w-4 shrink-0 p-0 hover:bg-gray-100 text-gray-600"
          >
            <Edit className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between px-6 py-2.5 bg-white">
        <div className="flex items-center gap-4 text-[11px] text-gray-500">
          <div className="flex items-center gap-1.5">
            <span>Agent ID: {agentIdShort}</span>
            <button
              onClick={() => handleCopy(assistantId, "agentId")}
              className="hover:text-gray-700 transition-colors"
            >
              <Copy className="h-3 w-3" />
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <span>CF ID: {cfIdShort}</span>
            <button
              onClick={() => handleCopy(cfIdShort, "cfId")}
              className="hover:text-gray-700 transition-colors"
            >
              <Copy className="h-3 w-3" />
            </button>
          </div>
          <span>$0.115/min</span>
          <span>970-1300ms latency</span>
          <span>25-225 tokens</span>
        </div>

        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-8 h-full">
            <button
              onClick={() => onTabChange("create")}
              className={cn(
                "h-full px-1 text-[13px] font-medium transition-colors relative",
                activeTab === "create"
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              Create
              {activeTab === "create" && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900" />
              )}
            </button>
            <button
              onClick={() => onTabChange("simulation")}
              className={cn(
                "h-full px-1 text-[13px] font-medium transition-colors relative",
                activeTab === "simulation"
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              Simulation
              {activeTab === "simulation" && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="text-[11px] text-gray-500">Auto saved at {autoSaveTime}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100">
            <MoreVertical className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100">
            <Play className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            className="h-8 px-4 text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800/95"
          >
            <Rocket className="h-3.5 w-3.5 mr-1.5" />
            Publish
          </Button>
        </div>
      </div>
    </div>
  )
}


