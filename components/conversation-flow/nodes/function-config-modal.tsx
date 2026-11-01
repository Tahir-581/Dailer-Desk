"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, X, Calendar, Settings2, Trash2, ArrowLeft } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { auth } from "@/app/providers"
import { apiClient } from "@/lib/api/client"

interface KeyValuePair {
    id: string
    key: string
    value: string
}

interface FunctionConfig {
    id: string
    toolId?: string

    name: string
    description: string
    apiEndpoint: {
        method: string
        url: string
    }
    timeout: number
    headers: KeyValuePair[]
    queryParams: KeyValuePair[]
    parameters: string

    responseVariables: KeyValuePair[]
}

interface FunctionConfigModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (config: FunctionConfig) => void
    initialConfig?: FunctionConfig | null
    assistantId?: string
    defaultView?: "select" | "create"
}

const KeyValueList = ({
    items,
    onChange,
    title
}: {
    items: KeyValuePair[],
    onChange: (items: KeyValuePair[]) => void,
    title: string
}) => {
    const addPair = () => {
        onChange([...items, { id: Math.random().toString(36).substr(2, 9), key: "", value: "" }])
    }

    const removePair = (id: string) => {
        onChange(items.filter(item => item.id !== id))
    }

    const updatePair = (id: string, field: "key" | "value", value: string) => {
        onChange(items.map(item => item.id === id ? { ...item, [field]: value } : item))
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label>{title}</Label>
            </div>
            {items.map((item) => (
                <div key={item.id} className="flex gap-2">
                    <Input
                        placeholder="Key"
                        value={item.key}
                        onChange={(e) => updatePair(item.id, "key", e.target.value)}
                        className="flex-1"
                    />
                    <Input
                        placeholder="Value"
                        value={item.value}
                        onChange={(e) => updatePair(item.id, "value", e.target.value)}
                        className="flex-1"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removePair(item.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                </div>
            ))}
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPair}
                className="mt-1"
            >
                <Plus className="h-3.5 w-3.5 mr-1" /> New key value pair
            </Button>
        </div>
    )
}

export function FunctionConfigModal({ open, onOpenChange, onSave, initialConfig, assistantId, defaultView = "select" }: FunctionConfigModalProps) {
    const [view, setView] = useState<"select" | "create">(defaultView)
    const [selectedToolId, setSelectedToolId] = useState<string | null>(null)



    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [method, setMethod] = useState("POST")
    const [url, setUrl] = useState("")
    const [timeout, setTimeout] = useState(120000)
    const [headers, setHeaders] = useState<KeyValuePair[]>([])
    const [queryParams, setQueryParams] = useState<KeyValuePair[]>([])
    const [parameters, setParameters] = useState("")
    const [responseVariables, setResponseVariables] = useState<KeyValuePair[]>([])



    const [isSaving, setIsSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)

    useEffect(() => {
        if (open) {
            setSaveError(null)
        }
        if (initialConfig) {
            setName(initialConfig.name)
            setDescription(initialConfig.description)
            setMethod(initialConfig.apiEndpoint.method)
            setUrl(initialConfig.apiEndpoint.url)
            setTimeout(initialConfig.timeout)
            setHeaders(initialConfig.headers)
            setQueryParams(initialConfig.queryParams)
            setParameters(initialConfig.parameters)
            setResponseVariables(initialConfig.responseVariables)
            setView("create")

        } else {
            resetForm()
            setView(defaultView)
        }
    }, [initialConfig, open, defaultView])

    const resetForm = () => {
        setName("")
        setDescription("")
        setMethod("POST")
        setUrl("")
        setTimeout(120000)
        setHeaders([])
        setQueryParams([])
        setParameters("")
        setResponseVariables([])
        setSaveError(null)
    }



    const transformConfigToBackendFormat = (frontendConfig: FunctionConfig) => {


        const headersObj: Record<string, string> = {}
        frontendConfig.headers.forEach(pair => {
            if (pair.key) {
                headersObj[pair.key] = pair.value
            }
        })

        const queryParamsObj: Record<string, string> = {}
        frontendConfig.queryParams.forEach(pair => {
            if (pair.key) {
                queryParamsObj[pair.key] = pair.value
            }
        })

        const responseVariablesObj: Record<string, string> = {}
        frontendConfig.responseVariables.forEach(pair => {
            if (pair.key) {
                responseVariablesObj[pair.key] = pair.value
            }
        })



        let parametersObj: any = {}
        if (frontendConfig.parameters) {
            try {
                parametersObj = JSON.parse(frontendConfig.parameters)
            } catch (e) {
                console.error("Invalid JSON in parameters:", e)
                parametersObj = {}
            }
        }



        const backendConfig: any = {
            endpoint: frontendConfig.apiEndpoint.url,
            method: frontendConfig.apiEndpoint.method,
            headers: headersObj,
            queryParams: queryParamsObj,
            timeout: frontendConfig.timeout,
            payloadFormat: "json",
            speakDuringExecution: false,
            speakAfterExecution: true
        }



        if (Object.keys(parametersObj).length > 0) {
            backendConfig.parameters = parametersObj
        }
        if (Object.keys(responseVariablesObj).length > 0) {
            backendConfig.responseVariables = responseVariablesObj
        }

        return backendConfig
    }

    const handleCreateSave = async () => {

        if (!name.trim() || !url.trim()) {

            setSaveError("Name and URL are required")
            return
        }


        setIsSaving(true)
        setSaveError(null)
        try {


            const orgResponse = await apiClient.get("/api/orgs/current")
            const orgId = orgResponse.data.orgId

            if (!orgId) {
                throw new Error("Organization ID not found")
            }


            const session = await auth.getSession()
            const userId = session?.data?.user?.id

            if (!userId) {
                throw new Error("User ID not found")
            }



            const frontendConfig: FunctionConfig = {
                id: initialConfig?.id || Math.random().toString(36).substr(2, 9),
                name: name.trim(),
                description: description.trim(),
                apiEndpoint: { method, url: url.trim() },
                timeout,
                headers,
                queryParams,
                parameters,
                responseVariables
            }



            const backendConfig = transformConfigToBackendFormat(frontendConfig)



            let savedTool
            if (initialConfig?.toolId) {

                const updateResponse = await apiClient.put(`/api/tools/${initialConfig.toolId}`, {
                    name: frontendConfig.name,
                    type: "custom_function",
                    description: frontendConfig.description || "",
                    config: backendConfig,
                    enabled: true
                })
                savedTool = updateResponse.data
            } else {

                const createResponse = await apiClient.post("/api/tools", {
                    orgId,
                    name: frontendConfig.name,
                    type: "custom_function",
                    description: frontendConfig.description || "",
                    config: backendConfig,
                    enabled: true,
                    createdBy: userId
                })
                savedTool = createResponse.data
            }



            frontendConfig.toolId = savedTool.id




            onSave(frontendConfig)
            onOpenChange(false)

        } catch (err: any) {
            console.error("❌ Error saving custom function:", err)
            console.error("Error details:", {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
            })
            const errorMessage = err.response?.data?.error || err.response?.data?.details || err.message || "Failed to save custom function"
            setSaveError(errorMessage)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn("max-w-2xl max-h-[85vh] overflow-y-auto", view === "create" ? "sm:max-w-3xl" : "sm:max-w-xl")}>
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        {view === "create" && (
                            <Button variant="ghost" size="icon" className="h-6 w-6 mr-1" onClick={() => setView("select")}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        )}
                        <DialogTitle>
                            {view === "select" ? "Select Function" : "Custom Function"}
                        </DialogTitle>
                    </div>
                </DialogHeader>

                { }
                {saveError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                        {saveError}
                    </div>
                )}

                {view === "select" ? (
                    <div className="min-h-[200px] flex flex-col justify-between">
                        <div className="py-8 text-center text-gray-500">
                            No tools available
                        </div>

                        <div className="flex items-center justify-between pt-4">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="gap-2">
                                        <Plus className="h-4 w-4" /> Add
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-64">
                                    <DropdownMenuItem className="gap-2">
                                        <Calendar className="h-4 w-4 text-gray-500" />
                                        Check Calendar Availability (Cal.com)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="gap-2">
                                        <Calendar className="h-4 w-4 text-gray-500" />
                                        Book on the Calendar (Cal.com)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="gap-2" onClick={() => {
                                        resetForm()
                                        setView("create")
                                    }}>
                                        <Settings2 className="h-4 w-4 text-gray-500" />
                                        Custom Function
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                                <Button disabled className="bg-gray-400">Add</Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                                placeholder="Enter the name of the custom function"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                placeholder="Enter the description of the custom function"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>API Endpoint</Label>
                            <p className="text-xs text-gray-500">The API Endpoint is the address of the service you are connecting to</p>
                            <div className="flex gap-2">
                                <Select value={method} onValueChange={setMethod}>
                                    <SelectTrigger className="w-[100px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="GET">GET</SelectItem>
                                        <SelectItem value="POST">POST</SelectItem>
                                        <SelectItem value="PUT">PUT</SelectItem>
                                        <SelectItem value="DELETE">DELETE</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input
                                    placeholder="Enter the URL of the custom function"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    className="flex-1"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Timeout (ms)</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    value={timeout}
                                    onChange={(e) => setTimeout(parseInt(e.target.value) || 0)}
                                    className="flex-1"
                                />
                                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-md border border-gray-200">milliseconds</span>
                            </div>
                        </div>

                        <KeyValueList title="Headers" items={headers} onChange={setHeaders} />

                        <KeyValueList title="Query Parameters" items={queryParams} onChange={setQueryParams} />

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Parameters (Optional)</Label>
                                    <p className="text-xs text-gray-500">JSON schema that defines the format in which the LLM will return.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">Payload: args only</span>
                                    <Switch />
                                </div>
                            </div>
                            <div className="bg-gray-900 rounded-md p-2">
                                <Textarea
                                    value={parameters}
                                    onChange={(e) => setParameters(e.target.value)}
                                    placeholder="Enter JSON Schema here..."
                                    className="bg-transparent border-none text-white font-mono min-h-[150px] focus-visible:ring-0"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => setParameters(JSON.stringify({
                                        "type": "object",
                                        "properties": {
                                            "appointment_available_ts": {
                                                "type": "string",
                                                "description": "The timestamp of the appointment that is available for booking."
                                            }
                                        },
                                        "required": ["appointment_available_ts"]
                                    }, null, 2))}
                                >
                                    example 1
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => setParameters(JSON.stringify({
                                        "type": "object",
                                        "properties": {
                                            "city": {
                                                "type": "string",
                                                "description": "The city for which the weather is to be fetched."
                                            }
                                        },
                                        "required": ["city"]
                                    }, null, 2))}
                                >
                                    example 2
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => setParameters(JSON.stringify({
                                        "type": "object",
                                        "properties": {
                                            "appointment_available_ts": {
                                                "type": "string",
                                                "description": "The timestamp of the appointment that is available for booking."
                                            },
                                            "doctor_name": {
                                                "type": "string",
                                                "description": "An optional field to specify the name of the doctor."
                                            }
                                        },
                                        "required": ["appointment_available_ts"]
                                    }, null, 2))}
                                >
                                    example 3
                                </Button>
                            </div>
                            <Button variant="outline" className="w-full">Format JSON</Button>
                        </div>

                        <KeyValueList title="Response Variables" items={responseVariables} onChange={setResponseVariables} />

                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={() => setView("select")} disabled={isSaving}>Cancel</Button>
                            <Button onClick={handleCreateSave} disabled={isSaving}>
                                {isSaving ? "Saving..." : "Save"}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
