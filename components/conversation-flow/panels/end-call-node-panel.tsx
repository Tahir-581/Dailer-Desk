
"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Info, HelpCircle } from "lucide-react"

interface EndCallNodePanelProps {
    node: any
    onUpdate: (data: any) => void
}

export function EndCallNodePanel({ node, onUpdate }: EndCallNodePanelProps) {
    const data = node.data || {}

    const handleUpdate = (updates: any) => {
        onUpdate({
            ...data,
            ...updates
        })
    }

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-sky-500 font-bold">#</span>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">
                        End Call Settings
                    </h3>
                </div>
                <p className="text-[11px] text-gray-500">
                    Configure how the call should terminate.
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-8 mt-2">
                <div className="flex items-center justify-between group">
                    <div className="space-y-0.5">
                        <Label className="text-[13px] font-semibold text-gray-700">Speak During Execution</Label>
                        <p className="text-[11px] text-gray-400">Whether to play the farewell message before hanging up.</p>
                    </div>
                    <Switch
                        checked={data.speakDuringExecution ?? true}
                        onCheckedChange={(checked) => handleUpdate({ speakDuringExecution: checked })}
                        className="data-[state=checked]:bg-sky-500"
                    />
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Label className="text-[13px] font-semibold text-gray-700">Global Node</Label>
                            <HelpCircle className="h-3.5 w-3.5 text-gray-300" />
                        </div>
                        <Switch
                            checked={data.isGlobal ?? false}
                            onCheckedChange={(checked) => handleUpdate({ isGlobal: checked })}
                            className="data-[state=checked]:bg-sky-500"
                        />
                    </div>
                    <div className="bg-sky-50/50 rounded-lg p-3 border border-sky-100/50 text-[11px] text-sky-700 leading-relaxed">
                        Allow other nodes jump to this node without edges. This makes the node accessible from anywhere in the flow via intent.
                    </div>
                </div>
            </div>
        </div>
    )
}
