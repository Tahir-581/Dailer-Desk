"use client"

import { useState } from "react"
import {
  Hash,
  Settings,
  Phone,
  Grid3x3,
  GitBranch,
  UserRound,
  MessageSquare,
  Braces,
  Box,
  Square,
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  Hexagon
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface ConversationFlowLeftSidebarProps {
  activeTab: "node" | "components"
  onTabChange: (tab: "node" | "components") => void
  onNodeClick?: (type: string, name: string) => void
}

interface NodeType {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  disabled?: boolean
}

const nodeTypes: NodeType[] = [
  { id: "conversation", name: "Conversation", icon: Hash },
  { id: "function", name: "Function", icon: Settings },
  { id: "call-transfer", name: "Call Transfer", icon: Phone },
  { id: "press-digit", name: "Press Digit", icon: Grid3x3 },
  { id: "logic-split", name: "Logic Split Node", icon: GitBranch },
  { id: "agent-transfer", name: "Agent Transfer", icon: UserRound },
  { id: "sms", name: "SMS", icon: MessageSquare },
  { id: "extract-variable", name: "Extract Variable", icon: Braces },
  { id: "mcp", name: "MCP", icon: Box, disabled: true },
  { id: "end-call", name: "Ending", icon: Square },
]

export function ConversationFlowLeftSidebar({
  activeTab,
  onTabChange,
  onNodeClick,
}: ConversationFlowLeftSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [libraryExpanded, setLibraryExpanded] = useState(true)
  const [agentExpanded, setAgentExpanded] = useState(true)

  const filteredNodes = nodeTypes.filter(node =>
    node.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleNodeClick = (type: string, name: string, disabled?: boolean) => {
    if (disabled) return
    if (onNodeClick) {
      onNodeClick(type, name)
    }
  }

  return (
    <div className="w-[280px] border-r border-gray-200 bg-white flex flex-col shrink-0">
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => onTabChange("node")}
            className={cn(
              "flex-1 px-4 py-2.5 text-xs font-medium transition-colors border-b",
              activeTab === "node"
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            Node
          </button>
          <button
            onClick={() => onTabChange("components")}
            className={cn(
              "flex-1 px-4 py-2.5 text-xs font-medium transition-colors border-b",
              activeTab === "components"
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            Components
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === "node" ? (
          <div className="p-1.5">
            {filteredNodes.map((node) => {
              const Icon = node.icon
              return (
                <div
                  key={node.id}
                  onClick={() => handleNodeClick(node.id, node.name, node.disabled)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-colors group",
                    node.disabled
                      ? "opacity-40 cursor-not-allowed bg-gray-50/50"
                      : "hover:bg-gray-50 cursor-pointer"
                  )}
                >
                  <Icon className={cn(
                    "h-3.5 w-3.5 flex-shrink-0",
                    node.disabled ? "text-gray-300" : "text-gray-400 group-hover:text-gray-600"
                  )} />
                  <span className={cn(
                    "text-xs font-medium",
                    node.disabled ? "text-gray-400" : "text-gray-700 group-hover:text-gray-900"
                  )}>
                    {node.name}
                    {node.disabled && <span className="ml-2 text-[10px] font-normal italic opacity-60">(Coming Soon)</span>}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-1.5 space-y-1">
            <div className="px-1.5 pb-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-7 text-xs border-gray-200 focus:border-gray-300"
                />
              </div>
            </div>

            <div>
              <button
                onClick={() => setLibraryExpanded(!libraryExpanded)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 hover:bg-gray-50 rounded-md transition-colors group"
              >
                <div className="flex items-center gap-2">
                  {libraryExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
                  )}
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Library Components</span>
                </div>
                <Plus className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
              </button>
              {libraryExpanded && (
                <div className="mt-0.5 space-y-0.5 px-1.5">
                  <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-md hover:bg-gray-50 cursor-pointer transition-colors group">
                    <Box className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                    <span className="text-xs text-gray-700 group-hover:text-gray-900">Component S1</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-md hover:bg-gray-50 cursor-pointer transition-colors group">
                    <Box className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                    <span className="text-xs text-gray-700 group-hover:text-gray-900">Component S3</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-md hover:bg-gray-50 cursor-pointer transition-colors group">
                    <Box className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                    <span className="text-xs text-gray-700 group-hover:text-gray-900">Component S2</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <button
                onClick={() => setAgentExpanded(!agentExpanded)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 hover:bg-gray-50 rounded-md transition-colors group"
              >
                <div className="flex items-center gap-2">
                  {agentExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
                  )}
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Agent Components</span>
                </div>
                <Plus className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
              </button>
              {agentExpanded && (
                <div className="mt-0.5 px-1.5">
                  <div className="px-3 py-1.5">
                    <span className="text-xs text-gray-400">No agent components available</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

