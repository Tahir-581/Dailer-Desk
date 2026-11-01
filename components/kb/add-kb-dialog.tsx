"use client"

import { useState, useEffect, useRef } from "react"
import { apiClient } from "@/lib/api/client"
import { auth } from "@/app/providers"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, X, FileText, Globe, Type, ArrowLeft, ArrowRight } from "lucide-react"
import { SitemapSelector } from "./sitemap-selector"

interface AddKBDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

type InputType = "pdf" | "web" | "text"
type Step = 1 | 2 | 3

interface PageItem {
  url: string
  title?: string
  lastmod?: string
}

export function AddKBDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddKBDialogProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [inputType, setInputType] = useState<InputType>("pdf")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [webUrl, setWebUrl] = useState("")
  const [discoveredPages, setDiscoveredPages] = useState<PageItem[]>([])
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set())
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [autoAddFuture, setAutoAddFuture] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [textContent, setTextContent] = useState("")
  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        try {
          const orgResponse = await apiClient.get("/api/orgs/current")
          setOrgId(orgResponse.data.orgId)

          const session = await auth.getSession()
          if (session?.data?.user?.id) {
            setUserId(session.data.user.id)
          }
        } catch (err) {
          console.error("Error fetching org/user data:", err)
          setError("Failed to load organization or user data")
        }
      }

      fetchData()
      setCurrentStep(1)
      setInputType("pdf")
      setName("")
      setSelectedFiles([])
      setWebUrl("")
      setDiscoveredPages([])
      setSelectedUrls(new Set())
      setAutoAddFuture(false)
      setAutoRefresh(false)
      setTextContent("")
      setError(null)
    }
  }, [open])

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const fileArray = Array.from(files)
      setSelectedFiles((prev) => [...prev, ...fileArray])
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDiscoverPages = async () => {
    if (!webUrl.trim()) 
    {
      setError("Please enter a URL")
      return
    }

    try 
    {
      new URL(webUrl)
    } 
    
    catch 
    {
      setError("Invalid URL format. URL must start with http:// or https://")
      return
    }

    setIsDiscovering(true)
    setError(null)

    try 
    {
      const baseURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      const response = await fetch(`${baseURL}/api/kb?action=discover-sitemap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl: webUrl }),
        credentials: "include"
      })

      if (!response.ok) 
      {
        const errorData = await response.json().catch(() => ({ error: "Failed to discover pages" }))
        throw new Error(errorData.error || "Failed to discover pages")
      }

      const data = await response.json()
      setDiscoveredPages(data.urls || [])
      
      if (data.urls && data.urls.length > 0) 
      {
        setCurrentStep(2)
      } 
      else 
      {
        setError("No pages found. Please check the URL and try again.")
      }
    } 
    
    catch (err: any) 
    {
      console.error("Error discovering pages:", err)
      setError(err.message || "Failed to discover pages")
    } 
    
    finally 
    {
      setIsDiscovering(false)
    }
  }

  const handleWebNext = () => {
    if (selectedUrls.size === 0) 
    {
      setError("Please select at least one page")
      return
    }
    setCurrentStep(3)
  }

  const handleTextChange = (value: string) => {
    setTextContent(value)
    
    if (value.length > 100000) 
    {
      setError(`Text exceeds maximum length of 100,000 characters`)
    } 
    
    else 
    {
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!orgId || !userId) {
      setError("Organization or user data not available. Please try again.")
      setIsLoading(false)
      return
    }

    if (!name.trim()) {
      setError("Knowledge Base Name is required")
      setIsLoading(false)
      return
    }

    try 
    {
      const baseURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

      if (inputType === "pdf") 
      {
        if (selectedFiles.length === 0) 
        {
          setError("Please select at least one PDF file")
          setIsLoading(false)
          return
        }

        const formData = new FormData()
        formData.append("orgId", orgId)
        formData.append("name", name.trim())
        formData.append("createdBy", userId)
        formData.append("description", "")
        formData.append("metadata", JSON.stringify({ sourceType: "pdf" }))

        selectedFiles.forEach((file, index) => {
          formData.append(`file_${index}`, file)
        })

        const response = await fetch(`${baseURL}/api/kb`, {
          method: "POST",
          body: formData,
          credentials: "include"
        })

        if (!response.ok) 
        {
          const errorData = await response.json().catch(() => ({ error: "Failed to create knowledge base" }))
          throw new Error(errorData.error || "Failed to create knowledge base")
        }

        await response.json()
      } 
      
      else if (inputType === "web") 
      {
        if (selectedUrls.size === 0) 
        {
          setError("Please select at least one page")
          setIsLoading(false)
          return
        }

        const response = await fetch(`${baseURL}/api/kb`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orgId,
            name: name.trim(),
            description: "",
            createdBy: userId,
            sourceType: "web",
            sourceUrls: Array.from(selectedUrls),
            baseUrl: webUrl,
            autoRefresh: autoAddFuture && autoRefresh,
            refreshInterval: autoRefresh ? 24 : undefined,
          }),
          credentials: "include"
        })

        if (!response.ok) 
        {
          const errorData = await response.json().catch(() => ({ error: "Failed to create knowledge base" }))
          throw new Error(errorData.error || "Failed to create knowledge base")
        }
        await response.json()
      } 
      
      else if (inputType === "text") 
      {
        if (!textContent.trim() || textContent.trim().length < 10) 
        {
          setError("Text content must be at least 10 characters")
          setIsLoading(false)
          return
        }

        if (textContent.length > 100000) 
        {
          setError("Text content exceeds maximum length of 100,000 characters")
          setIsLoading(false)
          return
        }

        const response = await fetch(`${baseURL}/api/kb`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orgId,
            name: name.trim(),
            description: "",
            createdBy: userId,
            sourceType: "text",
            textContent: textContent.trim(),
          }),
          credentials: "include"
        })

        if (!response.ok) 
        {
          const errorData = await response.json().catch(() => ({ error: "Failed to create knowledge base" }))
          throw new Error(errorData.error || "Failed to create knowledge base")
        }
        await response.json()
      }

      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      console.error("Error creating KB:", err)
      setError(err.message || "Failed to create knowledge base")
    } finally {
      setIsLoading(false)
    }
  }

  const getBaseUrl = (url: string): string => {
    try 
    {
      const urlObj = new URL(url)
      return urlObj.hostname
    } 
    
    catch 
    {
      return url
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] lg:max-w-[800px] p-0 gap-0 bg-white rounded-lg shadow-lg border-0">
        {}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <DialogTitle className="text-sm font-semibold text-gray-900 leading-none m-0">
            {currentStep === 1 && "Add Knowledge Base"}
            {currentStep === 2 && "Select Site Maps"}
            {currentStep === 3 && "Add Knowledge Base"}
          </DialogTitle>
        </div>

        <form onSubmit={handleSubmit}>
          {}
          {currentStep === 1 && (
            <div className="px-6 pb-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-medium text-gray-700 block leading-none">
                  Knowledge Base Name
                </Label>
                <Input
                  id="name"
                  placeholder="Enter"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 border-gray-300 rounded-md text-xs placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-gray-400 focus-visible:ring-offset-0"
                  disabled={isLoading}
                />
              </div>

              <Tabs value={inputType} onValueChange={(v) => setInputType(v as InputType)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="pdf" className="text-xs">
                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                    Documents
                  </TabsTrigger>
                  <TabsTrigger value="web" className="text-xs">
                    <Globe className="h-3.5 w-3.5 mr-1.5" />
                    Web Pages
                  </TabsTrigger>
                  <TabsTrigger value="text" className="text-xs">
                    <Type className="h-3.5 w-3.5 mr-1.5" />
                    Text
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pdf" className="mt-4 space-y-2">
                  <Label className="text-xs font-medium text-gray-700 block leading-none">Documents</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleFileSelect}
                    className="h-9 justify-start border-gray-300 rounded-md text-xs font-normal text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900"
                    disabled={isLoading}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5 text-gray-700" strokeWidth={2} />
                    Add
                  </Button>
                  {selectedFiles.length > 0 && (
                    <div className="space-y-1">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-xs text-gray-600 px-2 py-1.5 bg-gray-50 rounded border border-gray-200"
                        >
                          <span>
                            {file.name} ({(file.size / 1024).toFixed(2)} KB)
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                            disabled={isLoading}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="web" className="mt-4 space-y-2">
                  <Label htmlFor="web-url" className="text-xs font-medium text-gray-700 block leading-none">
                    URL Address
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="web-url"
                      type="url"
                      placeholder="https://docs.livekit.io/home/"
                      value={webUrl}
                      onChange={(e) => setWebUrl(e.target.value)}
                      className="h-9 border-gray-300 rounded-md text-xs placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-gray-400 focus-visible:ring-offset-0"
                      disabled={isLoading || isDiscovering}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDiscoverPages}
                      className="h-9 px-4 border-gray-300 rounded-md text-xs font-normal text-gray-700 bg-white hover:bg-gray-50"
                      disabled={isLoading || isDiscovering || !webUrl.trim()}
                    >
                      {isDiscovering ? "Discovering..." : "Discover Pages"}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="text" className="mt-4 space-y-2">
                  <Label htmlFor="text-content" className="text-xs font-medium text-gray-700 block leading-none">
                    Text Content
                  </Label>
                  <Textarea
                    id="text-content"
                    placeholder="Enter your text content here..."
                    value={textContent}
                    onChange={(e) => handleTextChange(e.target.value)}
                    className="min-h-[200px] text-xs border-gray-300"
                    disabled={isLoading}
                  />
                  <div className="text-xs text-gray-500 text-right">
                    {textContent.length.toLocaleString()} / 100,000 characters
                  </div>
                </TabsContent>
              </Tabs>

              {error && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded-md">
                  {error}
                </div>
              )}
            </div>
          )}

          {}
          {currentStep === 2 && (
            <div className="px-6 pb-4 space-y-4">
              <SitemapSelector
                pages={discoveredPages}
                selectedUrls={selectedUrls}
                onSelectionChange={setSelectedUrls}
                autoAddFuture={autoAddFuture}
                onAutoAddChange={setAutoAddFuture}
                isLoading={isDiscovering}
              />

              {error && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded-md">
                  {error}
                </div>
              )}
            </div>
          )}

          {}
          {currentStep === 3 && (
            <div className="px-6 pb-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="review-name" className="text-xs font-medium text-gray-700 block leading-none">
                  Knowledge Base Name
                </Label>
                <Input
                  id="review-name"
                  placeholder="Enter"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 border-gray-300 rounded-md text-xs placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-gray-400 focus-visible:ring-offset-0"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700 block leading-none">Selected Pages</Label>
                <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded border border-gray-200">
                  <div className="font-medium mb-1">{getBaseUrl(webUrl)}</div>
                  <div>{selectedUrls.size} Page{selectedUrls.size !== 1 ? "s" : ""}</div>
                </div>
                <div className="max-h-[200px] overflow-y-auto space-y-1 border border-gray-200 rounded p-2">
                  {Array.from(selectedUrls).slice(0, 10).map((url) => (
                    <div key={url} className="text-xs text-gray-600 truncate">
                      {url}
                    </div>
                  ))}
                  {selectedUrls.size > 10 && (
                    <div className="text-xs text-gray-500">
                      ... and {selectedUrls.size - 10} more
                    </div>
                  )}
                </div>
              </div>

              {autoAddFuture && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={autoRefresh}
                    onCheckedChange={(checked) => setAutoRefresh(checked === true)}
                    disabled={isLoading}
                    id="auto-refresh"
                  />
                  <label
                    htmlFor="auto-refresh"
                    className="text-xs text-gray-700 cursor-pointer"
                  >
                    Updates existing content every 24 hours
                  </label>
                </div>
              )}

              {error && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded-md">
                  {error}
                </div>
              )}
            </div>
          )}

          {}
          <div className="flex items-center justify-between gap-2 px-6 pb-5 pt-4 border-t border-gray-200">
            <div>
              {currentStep === 2 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="h-9 px-4 border-gray-300 bg-white text-gray-700 rounded-md text-xs font-normal hover:bg-gray-50"
                  disabled={isLoading}
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                  Back
                </Button>
              )}
              {currentStep === 3 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  className="h-9 px-4 border-gray-300 bg-white text-gray-700 rounded-md text-xs font-normal hover:bg-gray-50"
                  disabled={isLoading}
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-9 px-4 border-gray-300 bg-white text-gray-700 rounded-md text-xs font-normal hover:bg-gray-50 hover:text-gray-900"
                disabled={isLoading}
              >
                Cancel
              </Button>
              {currentStep === 2 && (
                <Button
                  type="button"
                  onClick={handleWebNext}
                  className="h-9 px-4 rounded-md text-xs font-normal bg-gray-200 text-gray-500 hover:bg-gray-300"
                  disabled={isLoading || selectedUrls.size === 0}
                >
                  Next
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              )}
              {(currentStep === 1 || currentStep === 3) && (
                <Button
                  type="submit"
                  className={`h-9 px-4 rounded-md text-xs font-normal transition-colors ${
                    isLoading || !name.trim() || 
                    (inputType === "pdf" && selectedFiles.length === 0) ||
                    (inputType === "web" && currentStep === 1) ||
                    (inputType === "text" && (!textContent.trim() || textContent.trim().length < 10))
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                  }`}
                  disabled={
                    isLoading ||
                    !name.trim() ||
                    (inputType === "pdf" && selectedFiles.length === 0) ||
                    (inputType === "web" && currentStep === 1) ||
                    (inputType === "text" && (!textContent.trim() || textContent.trim().length < 10))
                  }
                >
                  {isLoading ? "Saving..." : "Save"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
