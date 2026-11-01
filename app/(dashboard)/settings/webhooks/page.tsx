import { requireAuth } from "@/lib/auth/server"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ClockIcon, ChevronRightIcon } from "lucide-react"

export default async function WebhooksSettingsPage() {
  await requireAuth()

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Webhooks</h1>
        <p className="text-sm text-foreground">
          Configure your webhook URL to receive real-time event notifications. Check our{" "}
          <a href="#" className="text-blue-600 underline">
            documentation
          </a>{" "}
          for more details.
        </p>
      </div>

      <div className="flex flex-col gap-2 max-w-2xl">
        <Label htmlFor="webhook-url" className="text-sm font-medium text-foreground">
          URL
        </Label>
        <div className="flex items-center gap-4">
          <Input
            id="webhook-url"
            placeholder="Enter webhook URL"
            className="flex-1"
            disabled
          />
          <div className="flex items-center gap-2 px-3 py-2 h-10 border border-input rounded-md bg-muted/50 cursor-pointer hover:bg-muted">
            <ClockIcon className="h-4 w-4 text-foreground" />
            <span className="text-sm text-foreground">
              Timeout: <span className="font-semibold">5s</span>
            </span>
            <ChevronRightIcon className="h-4 w-4 text-foreground" />
          </div>
        </div>
      </div>
    </div>
  )
}
