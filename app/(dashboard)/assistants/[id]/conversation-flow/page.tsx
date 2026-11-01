"use client"

import { useState, useRef } from "react"
import { useParams } from "next/navigation"
import { ConversationFlowHeader } from "@/components/conversation-flow/conversation-flow-header"
import { ConversationFlowLeftSidebar } from "@/components/conversation-flow/conversation-flow-left-sidebar"
import { ConversationFlowCanvas, ConversationFlowCanvasRef } from "@/components/conversation-flow/conversation-flow-canvas"
import { ConversationFlowRightSidebar } from "@/components/conversation-flow/conversation-flow-right-sidebar"

export default function ConversationFlowPage() {
  const params = useParams()
  const assistantId = params.id as string
  const [activeTab, setActiveTab] = useState<"create" | "simulation">("create")
  const [leftSidebarTab, setLeftSidebarTab] = useState<"node" | "components">("node")
  const [rightSidebarTab, setRightSidebarTab] = useState<"settings" | "test">("settings")
  const [testMode, setTestMode] = useState<"audio" | "chat">("audio")
  const [selectedNode, setSelectedNode] = useState<any | null>(null)
  const canvasRef = useRef<ConversationFlowCanvasRef>(null)

  const handleNodeClick = (type: string, name: string) => {
    if (canvasRef.current) {
      canvasRef.current.addNode(type, name)
    }
  }

  const handleSelectionChange = (node: any | null) => {
    setSelectedNode(node)
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-white z-50 overflow-hidden">
      <ConversationFlowHeader
        assistantId={assistantId}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <div className="flex flex-1 overflow-hidden">
        <ConversationFlowLeftSidebar
          activeTab={leftSidebarTab}
          onTabChange={setLeftSidebarTab}
          onNodeClick={handleNodeClick}
        />
        <ConversationFlowCanvas
          assistantId={assistantId}
          ref={canvasRef}
          onSelectionChange={handleSelectionChange}
        />
        <ConversationFlowRightSidebar
          activeTab={rightSidebarTab}
          onTabChange={setRightSidebarTab}
          testMode={testMode}
          onTestModeChange={setTestMode}
          selectedNode={selectedNode}
          onNodeUpdate={(nodeId, data) => {
            if (canvasRef.current && canvasRef.current.updateNodeData) {
              canvasRef.current.updateNodeData(nodeId, data)
            }
          }}
          assistantId={assistantId}
        />
      </div>
      <div className="border-t border-gray-200 bg-white shrink-0 px-4 py-2">
        <div className="flex items-center gap-2">
          <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted">
            <span className="text-sm">+</span>
          </button>
          <button className="px-3 py-1 rounded text-sm font-medium bg-gray-900 text-white hover:bg-gray-800">
            Main Flow
          </button>
        </div>
      </div>
    </div>
  )
}

