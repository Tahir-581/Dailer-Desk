
"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { MessageSquare } from "lucide-react"

interface SMSNodePanelProps {
    node: any
    onUpdate: (data: any) => void
}

export function SMSNodePanel({ node, onUpdate }: SMSNodePanelProps) {
    const data = node.data || {}

    const handleGlobalChange = (checked: boolean) => {
        onUpdate({ isGlobal: checked })
    }

    const handleLLMChange = (checked: boolean) => {
        onUpdate({ useDifferentLLM: checked })
    }

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-4 border-b border-gray-100 bg-orange-50">
                <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-4 w-4 text-orange-600" />
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">
                        SMS Node
                    </h3>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-8">
                <div className="space-y-6">
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Node Settings</h4>

                    {}
                    <div className="flex items-start justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                        <div className="space-y-0.5">
                            <Label className="text-xs font-semibold text-gray-700 block">Global Node</Label>
                            <p className="text-[10px] text-gray-500 max-w-[180px]">
                                Allow other nodes jump to this node without edges
                            </p>
                        </div>
                        <Switch
                            checked={data.isGlobal || false}
                            onCheckedChange={handleGlobalChange}
                            className="data-[state=checked]:bg-orange-600"
                        />
                    </div>

                    {}
                    <div className="flex items-start justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                        <div className="space-y-0.5">
                            <Label className="text-xs font-semibold text-gray-700 block">LLM</Label>
                            <p className="text-[10px] text-gray-500 max-w-[180px]">
                                Choose a different LLM for this node
                            </p>
                        </div>
                        <Switch
                            checked={data.useDifferentLLM || false}
                            onCheckedChange={handleLLMChange}
                            className="data-[state=checked]:bg-orange-600"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
