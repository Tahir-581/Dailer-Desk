"use client"

import { cn } from "@/lib/utils"
import { GlobalSettingsPanel } from "./global-settings-panel"
import { NodeEditorPanel } from "./node-editor-panel"

interface ConversationFlowRightSidebarProps {
  activeTab: "settings" | "test"
  onTabChange: (tab: "settings" | "test") => void
  testMode: "audio" | "chat"
  onTestModeChange: (mode: "audio" | "chat") => void
  selectedNode: any | null
  onNodeUpdate: (nodeId: string, data: any) => void
  assistantId: string
}

export function ConversationFlowRightSidebar({
  activeTab,
  onTabChange,
  testMode,
  onTestModeChange,
  selectedNode,
  onNodeUpdate,
  assistantId,
}: ConversationFlowRightSidebarProps) {
  return (
    <div className="w-[400px] border-l border-gray-200 bg-white flex flex-col shrink-0">
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => onTabChange("settings")}
            className={cn(
              "flex-1 px-4 py-2.5 text-xs font-medium transition-colors border-b",
              activeTab === "settings"
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {selectedNode ? "Node Settings" : "Global Settings"}
          </button>
          <button
            onClick={() => onTabChange("test")}
            className={cn(
              "flex-1 px-4 py-2.5 text-xs font-medium transition-colors border-b",
              activeTab === "test"
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            Test Agent
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === "test" ? (
          <div className="p-5 flex flex-col items-center justify-center h-full text-gray-500">
            <p>Test panel has been removed</p>
          </div>
        ) : selectedNode ? (
          <NodeEditorPanel
            node={selectedNode}
            onUpdate={(data) => onNodeUpdate(selectedNode.id, data)}
          />
        ) : (
          <GlobalSettingsPanel assistantId={assistantId} />
        )}
      </div>
    </div>
  )
}

