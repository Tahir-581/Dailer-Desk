"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Info } from "lucide-react"

interface ConversationNodePanelProps {
    node: any
    onUpdate: (data: any) => void
}

export function ConversationNodePanel({ node, onUpdate }: ConversationNodePanelProps) {
    const data = node.data || {}

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate({
            ...data,
            title: e.target.value
        })
    }

    const handleInstructionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onUpdate({
            ...data,
            instructions: e.target.value,
            systemPrompt: e.target.value
        })
    }

    return (
        <div className="flex flex-col h-full bg-white">


            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Display Name
                    </Label>
                    <Input
                        value={data.title || ""}
                        onChange={handleTitleChange}
                        className="h-9 text-sm focus-visible:ring-purple-500/20 border-gray-200"
                        placeholder="e.g., Greeting, Product Info, Support"
                    />
                    <p className="text-[10px] text-gray-400 flex items-start gap-1">
                        <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>This helps you identify the node in your workflow.</span>
                    </p>
                </div>

                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Agent Instructions
                    </Label>
                    <Textarea
                        value={data.instructions || data.systemPrompt || ""}
                        onChange={handleInstructionsChange}
                        placeholder="Example: You are a friendly customer service agent. Greet the caller warmly and ask how you can help them today. Keep your tone professional but approachable."
                        className="min-h-[180px] text-sm leading-relaxed focus-visible:ring-purple-500/20 resize-none border-gray-200 font-mono"
                    />

                </div>


            </div>
        </div>
    )
}
