"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function isValidLiveKitUrl(url: string): boolean {
  const trimmed = url.trim()
  return trimmed.startsWith("wss://") || trimmed.startsWith("ws://")
}

export function CreateOrganizationButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const name = (formData.get("name") as string)?.trim() ?? ""
    const livekitUrl = (formData.get("livekitUrl") as string)?.trim() ?? ""
    const livekitApiKey = (formData.get("livekitApiKey") as string)?.trim() ?? ""
    const livekitApiSecret = (formData.get("livekitApiSecret") as string)?.trim() ?? ""
    const livekitProjectId = (formData.get("livekitProjectId") as string)?.trim() || undefined

    if (!name) {
      setError("Organization name is required")
      setIsLoading(false)
      return
    }

    if (!livekitUrl) {
      setError("LiveKit URL is required")
      setIsLoading(false)
      return
    }

    if (!isValidLiveKitUrl(livekitUrl)) {
      setError("LiveKit URL must start with wss:// or ws://")
      setIsLoading(false)
      return
    }

    if (!livekitApiKey) {
      setError("LiveKit API key is required")
      setIsLoading(false)
      return
    }

    if (!livekitApiSecret) {
      setError("LiveKit API secret is required")
      setIsLoading(false)
      return
    }

    try {
      await apiClient.post("/api/orgs/create", {
        name,
        livekitUrl,
        livekitApiKey,
        livekitApiSecret,
        ...(livekitProjectId ? { livekitProjectId } : {}),
      })

      setOpen(false)
      router.refresh()
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : null
      setError(message || (err instanceof Error ? err.message : "Something went wrong"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Organization</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Organization</DialogTitle>
            <DialogDescription>
              Create a new organization and link it to a LiveKit project. Enter your LiveKit project details from the LiveKit Cloud dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="name">Organization / project name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="My Organization"
                required
                disabled={isLoading}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="livekitUrl">LiveKit URL</Label>
              <Input
                id="livekitUrl"
                name="livekitUrl"
                type="url"
                placeholder="wss://your-project.livekit.cloud"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                WebSocket URL from your LiveKit project (e.g. wss://xxx.livekit.cloud)
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="livekitApiKey">LiveKit API key</Label>
              <Input
                id="livekitApiKey"
                name="livekitApiKey"
                type="text"
                placeholder="API..."
                required
                disabled={isLoading}
                autoComplete="off"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="livekitApiSecret">LiveKit API secret</Label>
              <Input
                id="livekitApiSecret"
                name="livekitApiSecret"
                type="password"
                placeholder="Secret"
                required
                disabled={isLoading}
                autoComplete="off"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="livekitProjectId">LiveKit project ID (optional)</Label>
              <Input
                id="livekitProjectId"
                name="livekitProjectId"
                type="text"
                placeholder="p_xxxx"
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
