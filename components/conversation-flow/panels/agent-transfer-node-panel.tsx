
"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Bot, Info, ChevronRight, ExternalLink } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import Image from "next/image"

interface AgentTransferNodePanelProps {
    node: any
    onUpdate: (data: any) => void
}

export function AgentTransferNodePanel({ node, onUpdate }: AgentTransferNodePanelProps) {
    const data = node.data || {}

    const handleUpdate = (key: string, value: any) => {
        onUpdate({ [key]: value })
    }

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-4 border-b border-gray-100 bg-orange-50/50">
                <div className="flex items-center gap-2 mb-1">
                    <Bot className="h-4 w-4 text-orange-600" />
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">
                        Agent Transfer Settings
                    </h3>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-8">
                <div className="space-y-3">
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                        Transfer to another agent to bring in new capabilities and fulfill different tasks.
                    </p>
                    <div className="flex gap-2.5 p-3 rounded-lg bg-blue-50/50 border border-blue-100/50">
                        <Info className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-blue-700 leading-relaxed font-medium">
                            It will be a seamless transition, with all the call context preserved. It will appear as a single call in history.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-[11px] font-bold text-gray-900">Select Agent</Label>
                        <Select
                            value={data.selectedAgent || "latest"}
                            onValueChange={(v) => handleUpdate("selectedAgent", v)}
                        >
                            <SelectTrigger className="h-10 text-xs focus:ring-orange-500/20">
                                <SelectValue placeholder="Conversation Flow Agent - (Latest)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="latest" className="text-xs">Conversation Flow Agent - (Latest)</SelectItem>
                                <SelectItem value="support" className="text-xs">Customer Support Agent</SelectItem>
                                <SelectItem value="sales" className="text-xs">Sales Department Agent</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/30 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-medium text-gray-400">Voice</span>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white border border-gray-100 shadow-sm">
                                    <div className="h-4 w-4 rounded-full bg-orange-100 overflow-hidden relative">

                                        <div className="absolute inset-0 bg-orange-200 animate-pulse" />
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-700">Cimo</span>
                                </div>
                            </div>
                            <ExternalLink className="h-3 w-3 text-gray-400 cursor-pointer hover:text-gray-600" />
                        </div>
                        <p className="text-[10px] text-gray-400 leading-relaxed">
                            It will use the voice that you set for the selected agent.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-[11px] font-bold text-gray-900">Speak During Transfer</Label>
                        <Switch
                            checked={data.speakDuringTransfer || false}
                            onCheckedChange={(c) => handleUpdate("speakDuringTransfer", c)}
                            className="data-[state=checked]:bg-orange-500"
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-gray-900">Post Call Analysis Setting</Label>
                        <p className="text-[10px] text-gray-400">
                            Select which agent&apos;s analysis fields to include in the call history.
                        </p>
                    </div>
                    <RadioGroup
                        value={data.analysisSetting || "transferred"}
                        onValueChange={(v) => handleUpdate("analysisSetting", v)}
                        className="space-y-2"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="transferred" id="a1" className="text-orange-600 border-gray-300 focus:ring-orange-500" />
                            <Label htmlFor="a1" className="text-xs font-medium text-gray-700">Only transferred agent</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="both" id="a2" className="text-orange-600 border-gray-300 focus:ring-orange-500" />
                            <Label htmlFor="a2" className="text-xs font-medium text-gray-700">Both this agent and transferred agent</Label>
                        </div>
                    </RadioGroup>
                </div>

                <div className="space-y-3 pb-8">
                    <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-gray-900">Webhook Setting</Label>
                        <p className="text-[10px] text-gray-400 leading-relaxed">
                            Select which agent&apos;s webhook endpoint to use for sending call updates.
                        </p>
                    </div>
                    <RadioGroup
                        value={data.webhookSetting || "this"}
                        onValueChange={(v) => handleUpdate("webhookSetting", v)}
                        className="space-y-2"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="transferred" id="w1" className="text-orange-600 border-gray-300 focus:ring-orange-500" />
                            <Label htmlFor="w1" className="text-xs font-medium text-gray-700">Only transferred agent</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="both" id="w2" className="text-orange-600 border-gray-300 focus:ring-orange-500" />
                            <Label htmlFor="w2" className="text-xs font-medium text-gray-700">Both this agent and transferred agent</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="this" id="w3" className="text-orange-600 border-gray-300 focus:ring-orange-500" />
                            <Label htmlFor="w3" className="text-xs font-medium text-gray-700">Only this agent</Label>
                        </div>
                    </RadioGroup>
                </div>
            </div>
        </div>
    )
}
