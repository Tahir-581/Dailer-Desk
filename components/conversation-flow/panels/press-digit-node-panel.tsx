
"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Grid3x3, Clock, Hash, CheckCircle2, Variable } from "lucide-react"

interface PressDigitNodePanelProps {
    node: any
    onUpdate: (data: any) => void
}

export function PressDigitNodePanel({ node, onUpdate }: PressDigitNodePanelProps) {
    const data = node.data || {}

    const handleInstructionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onUpdate({ instructions: e.target.value })
    }

    const handleChange = (key: string, value: any) => {
        onUpdate({ [key]: value })
    }

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-4 border-b border-gray-100 bg-teal-50/50">
                <div className="flex items-center gap-2 mb-1">
                    <Grid3x3 className="h-4 w-4 text-teal-600" />
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">
                        Press Digit
                    </h3>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-700">Instruction</Label>
                    <Textarea
                        value={data.instructions || ""}
                        onChange={handleInstructionChange}
                        placeholder="Please enter your 4-digit PIN"
                        className="min-h-[80px] text-xs leading-relaxed focus-visible:ring-teal-500/20 resize-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Hash className="h-3.5 w-3.5 text-teal-600" />
                            <Label className="text-xs font-semibold text-gray-700">Number of Digits</Label>
                        </div>
                        <Input
                            type="number"
                            value={data.numDigits || "1"}
                            onChange={(e) => handleChange("numDigits", parseInt(e.target.value) || 1)}
                            className="h-9 text-sm focus-visible:ring-teal-500/20"
                            min="1"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-teal-600" />
                            <Label className="text-xs font-semibold text-gray-700">Timeout (s)</Label>
                        </div>
                        <Input
                            type="number"
                            value={data.timeout || "10"}
                            onChange={(e) => handleChange("timeout", parseInt(e.target.value) || 10)}
                            className="h-9 text-sm focus-visible:ring-teal-500/20"
                            min="1"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-teal-600 text-sm font-bold">#</span>
                        <Label className="text-xs font-semibold text-gray-700">Stop Digit (Optional)</Label>
                    </div>
                    <Input
                        value={data.stopEvent || ""}
                        onChange={(e) => handleChange("stopEvent", e.target.value)}
                        placeholder="e.g. #"
                        className="h-9 text-sm focus-visible:ring-teal-500/20"
                        maxLength={1}
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Variable className="h-3.5 w-3.5 text-teal-600" />
                        <Label className="text-xs font-semibold text-gray-700">Store Result In</Label>
                    </div>
                    <Input
                        value={data.variableName || "collected_digits"}
                        onChange={(e) => handleChange("variableName", e.target.value)}
                        placeholder="variable_name"
                        className="h-9 text-sm focus-visible:ring-teal-500/20"
                    />
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-4 w-4 text-teal-600" />
                            <div className="space-y-0.5">
                                <Label className="text-xs font-semibold text-gray-700 block">Confirmation</Label>
                                <p className="text-[10px] text-gray-500">Ask user to confirm input</p>
                            </div>
                        </div>
                        <Switch
                            checked={data.askForConfirmation || false}
                            onCheckedChange={(checked) => handleChange("askForConfirmation", checked)}
                            className="data-[state=checked]:bg-teal-500"
                        />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                        <div className="space-y-0.5">
                            <Label className="text-xs font-semibold text-gray-700 block">Global Node</Label>
                            <p className="text-[10px] text-gray-500">Allow jumps without edges</p>
                        </div>
                        <Switch
                            checked={data.isGlobal || false}
                            onCheckedChange={(checked) => handleChange("isGlobal", checked)}
                            className="data-[state=checked]:bg-teal-500"
                        />
                    </div>
                </div>

            </div>
        </div>
    )
}
