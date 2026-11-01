
"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { GitBranch, Plus, Trash2, MessageCircle } from "lucide-react"
import { Input } from "@/components/ui/input"

interface LogicSplitNodePanelProps {
    node: any
    onUpdate: (data: any) => void
}

export function LogicSplitNodePanel({ node, onUpdate }: LogicSplitNodePanelProps) {
    const data = node.data || {}
    const examples = data.examples || []

    const handleGlobalChange = (checked: boolean) => {
        onUpdate({ isGlobal: checked })
    }

    const addExample = () => {
        onUpdate({
            examples: [...examples, { id: Date.now(), text: "" }]
        })
    }

    const updateExample = (id: number, text: string) => {
        onUpdate({
            examples: examples.map((ex: any) => ex.id === id ? { ...ex, text } : ex)
        })
    }

    const removeExample = (id: number) => {
        onUpdate({
            examples: examples.filter((ex: any) => ex.id !== id)
        })
    }

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-4 border-b border-gray-100 bg-indigo-50/50">
                <div className="flex items-center gap-2 mb-1">
                    <GitBranch className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">
                        Logic Split
                    </h3>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-8">
                <div className="space-y-4">
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Node Settings</h4>
                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                        <div className="space-y-0.5">
                            <Label className="text-xs font-semibold text-gray-700 block transition-colors">Global Node</Label>
                            <p className="text-[10px] text-gray-500 max-w-[180px]">
                                Allow other nodes jump to this node without edges
                            </p>
                        </div>
                        <Switch
                            checked={data.isGlobal || false}
                            onCheckedChange={handleGlobalChange}
                            className="data-[state=checked]:bg-indigo-500"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1">
                        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Fine-tuning Examples</h4>
                        <p className="text-[10px] text-gray-500 leading-relaxed">
                            Add example conversations to train your AI agent how to handle specific scenarios
                        </p>
                    </div>

                    <div className="space-y-2">
                        {examples.map((example: any) => (
                            <div key={example.id} className="flex gap-2 group">
                                <div className="relative flex-1">
                                    <MessageCircle className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                                    <Input
                                        value={example.text}
                                        onChange={(e) => updateExample(example.id, e.target.value)}
                                        placeholder="User says: 'I want to speak with sales'"
                                        className="pl-8 h-9 text-xs focus-visible:ring-indigo-500/20 border-gray-200"
                                    />
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeExample(example.id)}
                                    className="h-9 w-9 text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}

                        <Button
                            variant="outline"
                            onClick={addExample}
                            className="w-full h-9 border-dashed border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/30 text-xs gap-2"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Add example
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
