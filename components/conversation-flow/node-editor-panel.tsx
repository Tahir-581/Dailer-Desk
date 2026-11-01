"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Plus, X } from "lucide-react"
import { ConversationNodePanel } from "./panels/conversation-node-panel"
import { CallTransferNodePanel } from "./panels/call-transfer-node-panel"
import { PressDigitNodePanel } from "./panels/press-digit-node-panel"
import { LogicSplitNodePanel } from "./panels/logic-split-node-panel"
import { AgentTransferNodePanel } from "./panels/agent-transfer-node-panel"
import { EndCallNodePanel } from "./panels/end-call-node-panel"
import { ExtractVariableNodePanel } from "./panels/extract-variable-node-panel"
import { SMSNodePanel } from "./panels/sms-node-panel"

interface NodeEditorPanelProps {
    node: any
    onUpdate: (data: any) => void
}

export function NodeEditorPanel({ node, onUpdate }: NodeEditorPanelProps) {
    const nodeType = node.type
    const data = node.data || {}

    if (nodeType === "conversation") {
        return <ConversationNodePanel node={node} onUpdate={onUpdate} />
    }

    if (nodeType === "call-transfer") {
        return <CallTransferNodePanel node={node} onUpdate={onUpdate} />
    }

    if (nodeType === "press-digit") {
        return <PressDigitNodePanel node={node} onUpdate={onUpdate} />
    }

    if (nodeType === "logic-split") {
        return <LogicSplitNodePanel node={node} onUpdate={onUpdate} />
    }

    if (nodeType === "agent-transfer") {
        return <AgentTransferNodePanel node={node} onUpdate={onUpdate} />
    }

    if (nodeType === "end-call") {
        return <EndCallNodePanel node={node} onUpdate={onUpdate} />
    }

    if (nodeType === "extract-variable") {
        return <ExtractVariableNodePanel node={node} onUpdate={onUpdate} />
    }

    if (nodeType === "sms") {
        return <SMSNodePanel node={node} onUpdate={onUpdate} />
    }

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate({ title: e.target.value })
    }

    const handleSystemPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onUpdate({ systemPrompt: e.target.value })
    }

    const handleTransitionChange = (index: number, value: string) => {
        const newTransitions = [...(data.transitions || [])]
        newTransitions[index] = value
        onUpdate({ transitions: newTransitions })
    }

    const addTransition = () => {
        const newTransitions = [...(data.transitions || []), "New transition"]
        onUpdate({ transitions: newTransitions })
    }

    const removeTransition = (index: number) => {
        const newTransitions = [...(data.transitions || [])]
        newTransitions.splice(index, 1)
        onUpdate({ transitions: newTransitions })
    }

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-pink-500 font-bold">#</span>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">
                        {nodeType} Node Settings
                    </h3>
                </div>
                <p className="text-[11px] text-gray-500">
                    Configure the behavior and prompts for this conversation step.
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-700">Display Name</Label>
                    <Input
                        value={data.title || ""}
                        onChange={handleTitleChange}
                        className="h-9 text-sm focus-visible:ring-pink-500/20"
                        placeholder="e.g. Greeting"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-700">System Prompt / Response</Label>
                    <Textarea
                        value={data.systemPrompt || ""}
                        onChange={handleSystemPromptChange}
                        placeholder="What should the agent say or do in this step?"
                        className="min-h-[160px] text-sm leading-relaxed focus-visible:ring-pink-500/20 resize-none"
                    />
                    <p className="text-[10px] text-gray-400">
                        Define the persona and objectives specifically for this node.
                    </p>
                </div>

                <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Transitions</Label>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-pink-500 hover:text-pink-600 hover:bg-pink-50"
                            onClick={addTransition}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="space-y-2">
                        {(data.transitions || []).map((transition: string, index: number) => (
                            <div key={index} className="flex gap-2 group">
                                <Input
                                    value={transition}
                                    onChange={(e) => handleTransitionChange(index, e.target.value)}
                                    className="h-8 text-[12px] bg-gray-50 border-gray-200 focus-visible:ring-pink-500/20"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => removeTransition(index)}
                                >
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}