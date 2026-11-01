"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Phone, Info } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface CallTransferNodePanelProps {
    node: any
    onUpdate: (data: any) => void
}

export function CallTransferNodePanel({ node, onUpdate }: CallTransferNodePanelProps) {
    const data = node.data || {}

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate({
            ...data,
            title: e.target.value
        })
    }

    const handleDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate({
            ...data,
            destination: e.target.value
        })
    }

    const handleTransferTypeChange = (value: string) => {
        onUpdate({
            ...data,
            transferType: value
        })
    }

    const handlePlayDialtoneChange = (checked: boolean) => {
        onUpdate({
            ...data,
            playDialtone: checked
        })
    }

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-emerald-600 font-bold text-lg">📞</span>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">
                        Call Transfer Node
                    </h3>
                </div>

            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Display Name
                    </Label>
                    <Input
                        value={data.title || "Call Transfer"}
                        onChange={handleTitleChange}
                        className="h-9 text-sm focus-visible:ring-emerald-500/20 border-gray-200"
                        placeholder="e.g. Transfer to Support"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Destination Number
                    </Label>
                    <div className="relative">
                        <Phone className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <Input
                            value={data.destination || ""}
                            onChange={handleDestinationChange}
                            className="pl-8 h-9 text-sm focus-visible:ring-emerald-500/20 border-gray-200 font-mono"
                            placeholder="+15551234567"
                        />
                    </div>
                    <p className="text-[10px] text-gray-400 flex items-start gap-1">
                        <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>Use E.164 format (e.g., +12223334444) or a SIP URI.</span>
                    </p>
                </div>

                <div className="space-y-4 pt-2">
                    <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Configuration
                    </Label>

                    <div className="grid gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-xs font-medium text-gray-700">Transfer Type</Label>
                                <p className="text-[10px] text-gray-500">How the transfer is initiated</p>
                            </div>
                            <Select value={data.transferType || "cold"} onValueChange={handleTransferTypeChange}>
                                <SelectTrigger className="w-[100px] h-8 text-xs bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cold">Cold</SelectItem>
                                    <SelectItem value="warm" disabled>Warm (Soon)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-xs font-medium text-gray-700">Play Dialtone</Label>
                                <p className="text-[10px] text-gray-500">Sound during transfer</p>
                            </div>
                            <Switch
                                checked={data.playDialtone !== false} 

                                onCheckedChange={handlePlayDialtoneChange}
                                className="scale-75 origin-right"
                            />
                        </div>
                    </div>
                </div>


            </div>
        </div>
    )
}
