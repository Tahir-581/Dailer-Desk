"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api/client"
import { auth } from "@/app/providers"
import {
  FileText,
  Plus,
  BookOpen,
  CheckCircle2,
  Pencil,
  Trash2,
  Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddKBDialog } from "@/components/kb/add-kb-dialog"

interface KBItem {
  id: string
  name: string
  description: string | null
  content: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export default function KBPage() {
  const router = useRouter()
  const [kbItems, setKbItems] = useState<KBItem[]>([])
  const [selectedKb, setSelectedKb] = useState<KBItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [orgId, setOrgId] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        

        const session = await auth.getSession()
        if (!session?.data?.user) {
          router.push("/login")
          return
        }

        

        const orgResponse = await apiClient.get("/api/orgs/current")
        const currentOrgId = orgResponse.data.orgId
        setOrgId(currentOrgId)

        

        const kbResponse = await apiClient.get(`/api/kb?orgId=${currentOrgId}`)
        const items = kbResponse.data || []
        setKbItems(items)

        

        if (items.length > 0 && !selectedKb) {
          setSelectedKb(items[0])
        }
      } catch (error) {
        console.error("Error fetching KB data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleRefresh = async () => {
    if (!orgId) return
    try {
      const kbResponse = await apiClient.get(`/api/kb?orgId=${orgId}`)
      const items = kbResponse.data || []
      setKbItems(items)

      

      if (selectedKb && !items.find((item: KBItem) => item.id === selectedKb.id)) {
        setSelectedKb(items.length > 0 ? items[0] : null)
      } else if (!selectedKb && items.length > 0) {
        setSelectedKb(items[0])
      }
    } catch (error) {
      console.error("Error refreshing KB data:", error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    return `${month}/${day}/${year} ${hours}:${minutes}`
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 h-full bg-white items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gray-300 border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const formatId = (id: string) => {
    return `${id.substring(0, 4)}...${id.substring(id.length - 3)}`
  }

  

  if (!isLoading && kbItems.length === 0) {
    return (
      <>
        <div className="flex flex-1 h-full bg-white">
          {}
          <div className="w-[240px] border-r border-gray-200 bg-white flex flex-col">
            {}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-700" />
                <h2 className="text-sm font-medium text-gray-900">Knowledge Base</h2>
              </div>
              <Button
                size="icon"
                className="h-7 w-7 rounded-full bg-black hover:bg-black/90 p-0"
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="h-3.5 w-3.5 text-white" />
              </Button>
            </div>
            {}
            <div className="flex-1" />
          </div>

          {}
          <div className="flex-1 bg-white flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <FileText className="h-16 w-16 text-gray-400" strokeWidth={1.5} />
              <p className="text-sm text-gray-600">You don&apos;t have any knowledge base</p>
            </div>
          </div>
        </div>

        <AddKBDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSuccess={handleRefresh}
        />
      </>
    )
  }

  return (
    <>
      <div className="flex flex-1 h-full bg-white">
        {/* Left Panel - Navigation */}
        <div className="w-[240px] border-r border-gray-200 bg-white flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-700" />
              <h2 className="text-sm font-medium text-gray-900">Knowledge Base</h2>
            </div>
            <Button
              size="icon"
              className="h-7 w-7 rounded-full bg-black hover:bg-black/90 p-0"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="h-3.5 w-3.5 text-white" />
            </Button>
          </div>

          {/* List Items */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-1">
              {kbItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedKb(item)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer ${
                    selectedKb?.id === item.id
                      ? "bg-gray-100"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <BookOpen className="h-3.5 w-3.5 text-gray-700" />
                  <span className="text-xs text-gray-900 truncate">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Content */}
        {selectedKb ? (
          <div className="flex-1 bg-white flex flex-col">
            {/* Header with Title and Actions */}
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <h1 className="text-lg font-semibold text-gray-900">{selectedKb.name}</h1>
                <div className="flex items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="h-8 px-3 bg-black text-white hover:bg-black/90 text-xs font-normal rounded"
                  >
                    <Pencil className="h-3 w-3 mr-1.5" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 border-gray-300 bg-white hover:bg-gray-50 rounded"
                    onClick={async () => {
                      if (confirm("Are you sure you want to delete this knowledge base?")) {
                        try {
                          await apiClient.delete(`/api/kb/${selectedKb.id}`)
                          await handleRefresh()
                        } catch (error) {
                          console.error("Error deleting KB:", error)
                        }
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-gray-700" />
                  </Button>
                </div>
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <span>ID: {formatId(selectedKb.id)}</span>
                <FileText className="h-3 w-3 text-gray-500" />
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span className="h-0.5 w-0.5 rounded-full bg-gray-400" />
                <span>Uploaded by: {formatDate(selectedKb.createdAt)}</span>
              </div>
            </div>

            {/* File Display */}
            <div className="flex-1 p-6">
              {selectedKb.metadata && typeof selectedKb.metadata === "object" && "files" in selectedKb.metadata ? (
                <div className="space-y-3">
                  {(selectedKb.metadata.files as any[])?.map((file: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded bg-white"
                    >
                      <div className="h-10 w-10 bg-red-600 rounded flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-[10px] leading-none">
                          {file.type?.toUpperCase() || "PDF"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium text-gray-900 truncate">
                            {file.name || "Unknown file"}
                          </p>
                          {file.size && (
                            <span className="text-xs text-gray-500">{file.size}</span>
                          )}
                        </div>
                      </div>
                      {file.url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-700 hover:bg-gray-100 rounded"
                          onClick={() => window.open(file.url, "_blank")}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 border border-gray-200 rounded bg-white">
                  <div className="h-10 w-10 bg-red-600 rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-[10px] leading-none">PDF</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {selectedKb.name}.pdf
                      </p>
                      <span className="text-xs text-gray-500">30 K</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-gray-700 hover:bg-gray-100 rounded"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-white flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <FileText className="h-16 w-16 text-gray-400" strokeWidth={1.5} />
              <p className="text-sm text-gray-600">Select a knowledge base to view details</p>
            </div>
          </div>
        )}
      </div>

      <AddKBDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={handleRefresh}
      />
    </>
  )
}
