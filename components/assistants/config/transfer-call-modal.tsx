"use client"

import { useState, useEffect } from "react"
import { PhoneForwarded, Info, Plus, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface SIPHeader {
  key: string
  value: string
}

interface TransferCallModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: (data: {
    name: string
    description: string
    transferTo: string
    transferToType: "static" | "dynamic"
    formatToE164: boolean
    extensionNumber: boolean
    extensionNumberValue?: string
    transferType: "cold" | "warm"
    sipMethod: "refer" | "invite"
    callerId: "retell" | "user"
    sipHeaders: SIPHeader[]
  }) => void
}

export function TransferCallModal({ open, onOpenChange, onSave }: TransferCallModalProps) {
  const [name, setName] = useState("transfer_call")
  const [description, setDescription] = useState("")
  const [transferTo, setTransferTo] = useState("+15555550100")
  const [transferToType, setTransferToType] = useState<"static" | "dynamic">("static")
  const [formatToE164, setFormatToE164] = useState<"format" | "raw">("format")
  const [extensionNumber, setExtensionNumber] = useState(false)
  const [extensionNumberValue, setExtensionNumberValue] = useState("")
  const [transferType, setTransferType] = useState<"cold" | "warm">("cold")
  const [sipMethod, setSipMethod] = useState<"refer" | "invite">("invite")
  const [callerId, setCallerId] = useState<"retell" | "user">("retell")
  const [sipHeaders, setSipHeaders] = useState<SIPHeader[]>([])

  

  useEffect(() => {
    if (!open) {
      setName("transfer_call")
      setDescription("")
      setTransferTo("+15555550100")
      setTransferToType("static")
      setFormatToE164("format")
      setExtensionNumber(false)
      setExtensionNumberValue("")
      setTransferType("cold")
      setSipMethod("invite")
      setCallerId("retell")
      setSipHeaders([])
    }
  }, [open])

  const handleSave = () => {
    if (onSave) {
      onSave({
        name,
        description,
        transferTo,
        transferToType,
        formatToE164: formatToE164 === "format",
        extensionNumber,
        extensionNumberValue: extensionNumber ? extensionNumberValue : undefined,
        transferType,
        sipMethod,
        callerId,
        sipHeaders,
      })
    }
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  const addSIPHeader = () => {
    setSipHeaders([...sipHeaders, { key: "", value: "" }])
  }

  const updateSIPHeader = (index: number, field: "key" | "value", value: string) => {
    const updated = [...sipHeaders]
    updated[index] = { ...updated[index], [field]: value }
    setSipHeaders(updated)
  }

  const removeSIPHeader = (index: number) => {
    setSipHeaders(sipHeaders.filter((_, i) => i !== index))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] max-h-[85vh] flex flex-col">
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center gap-2 text-base">
            <PhoneForwarded className="h-4 w-4" />
            Transfer Call
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-2">
          {}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="transfer_call"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Transfer the call to a human agent"
                className="min-h-[60px] text-xs"
              />
            </div>
          </div>

          {}
          <div className="space-y-2.5">
            <Label className="text-xs font-semibold">Transfer to</Label>
            <Tabs value={transferToType} onValueChange={(v) => setTransferToType(v as "static" | "dynamic")}>
              <div className="flex items-center justify-between gap-3">
                <TabsList className="inline-flex h-9 items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground">
                  <TabsTrigger 
                    value="static" 
                    className="rounded-md px-3 py-1.5 text-xs font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=inactive]:bg-transparent"
                  >
                    Static Destination
                  </TabsTrigger>
                  <TabsTrigger 
                    value="dynamic" 
                    className="rounded-md px-3 py-1.5 text-xs font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=inactive]:bg-transparent"
                  >
                    Dynamic Routing
                  </TabsTrigger>
                </TabsList>
                
                <div className="flex items-center gap-3 ml-auto">
                  <Select value={formatToE164} onValueChange={(v) => setFormatToE164(v as "format" | "raw")}>
                    <SelectTrigger className="w-[160px] h-9 text-xs bg-background border-border">
                      <SelectValue placeholder="Format to E.164" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="format" className="text-xs">Format to E.164</SelectItem>
                      <SelectItem value="raw" className="text-xs">Keep raw input</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {transferToType === "static" && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="extension"
                        checked={extensionNumber}
                        onCheckedChange={(checked) => setExtensionNumber(checked === true)}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="extension" className="text-xs font-normal cursor-pointer whitespace-nowrap">
                        Extension Number
                      </Label>
                    </div>
                  )}
                </div>
              </div>
              
              <TabsContent value="static" className="mt-3 space-y-2">
                <div className="flex items-start gap-2">
                  <Input
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    placeholder="Enter a static phone number / SIP URI / dynamic variable."
                    className="text-xs h-9 flex-1"
                  />
                  {extensionNumber && (
                    <Input
                      value={extensionNumberValue}
                      onChange={(e) => setExtensionNumberValue(e.target.value)}
                      placeholder="0000"
                      className="text-xs h-9 w-[120px]"
                    />
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Enter a static phone number / SIP URI / dynamic variable.
                </p>
              </TabsContent>
              <TabsContent value="dynamic" className="mt-3 space-y-2">
                <Textarea
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  placeholder="If the user wants to reach support, transfer to +1 (925) 222-2222; if the user wants to reach sales, transfer to +1 (925) 333-3333"
                  className="min-h-[100px] text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  Use a prompt to handle dynamic call transfer routing.
                </p>
              </TabsContent>
            </Tabs>
          </div>

          {}
          <div className="space-y-2.5">
            <Label className="text-xs">Type</Label>
            <div className="grid grid-cols-2 gap-2.5">
              <Card
                className={cn(
                  "cursor-pointer transition-all border-2",
                  transferType === "cold"
                    ? "border-blue-500 bg-blue-50/50"
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => setTransferType("cold")}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <PhoneForwarded className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-xs mb-1">Cold Transfer</h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        AI transfers the call to the next agent without a debrief.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={cn(
                  "cursor-pointer transition-all border-2",
                  transferType === "warm"
                    ? "border-orange-500 bg-orange-50/50"
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => setTransferType("warm")}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                      <PhoneForwarded className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-xs mb-1">Warm Transfer</h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        AI provides a debrief to the next agent after transferring the call.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {}
          <div className="space-y-2.5">
            <Label className="text-xs font-semibold">SIP Transfer Method</Label>
            <RadioGroup value={sipMethod} onValueChange={(v) => setSipMethod(v as "refer" | "invite")} className="space-y-2.5">
              <div className="flex items-center space-x-2.5">
                <RadioGroupItem value="refer" id="refer" />
                <Label htmlFor="refer" className="text-xs font-normal cursor-pointer leading-none">
                  SIP REFER
                </Label>
              </div>
              <div className="flex items-center space-x-2.5">
                <RadioGroupItem value="invite" id="invite" />
                <Label htmlFor="invite" className="text-xs font-normal cursor-pointer leading-none">
                  SIP INVITE
                </Label>
              </div>
            </RadioGroup>
          </div>

          {}
          <div className="space-y-2.5">
            <Label className="text-xs font-semibold">Displayed Caller ID</Label>
            <RadioGroup value={callerId} onValueChange={(v) => setCallerId(v as "retell" | "user")} className="space-y-2.5">
              <div className="flex items-center space-x-2.5">
                <RadioGroupItem value="retell" id="retell" />
                <Label htmlFor="retell" className="text-xs font-normal cursor-pointer leading-none">
                  Agent&apos;s Number
                </Label>
              </div>
              <div className="flex items-center space-x-2.5">
                <RadioGroupItem value="user" id="user" />
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="user" className="text-xs font-normal cursor-pointer leading-none">
                    User&apos;s Number
                  </Label>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>
            </RadioGroup>
          </div>

          {}
          <div className="space-y-2.5">
            <Label className="text-xs">Custom SIP Headers</Label>
            <p className="text-[11px] text-muted-foreground">
              Add key/value pairs for call routing, metadata, or carrier integration.
            </p>
            <div className="space-y-2">
              {sipHeaders.map((header, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder="Key"
                    value={header.key}
                    onChange={(e) => updateSIPHeader(index, "key", e.target.value)}
                    className="flex-1 text-xs"
                  />
                  <Input
                    placeholder="Value"
                    value={header.value}
                    onChange={(e) => updateSIPHeader(index, "value", e.target.value)}
                    className="flex-1 text-xs"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => removeSIPHeader(index)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 text-xs"
                onClick={addSIPHeader}
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-3 pt-3 border-t">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-foreground text-background hover:bg-foreground/90">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

