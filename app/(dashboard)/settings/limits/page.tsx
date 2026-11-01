import { requireAuth } from "@/lib/auth/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PencilIcon } from "lucide-react"

export default async function LimitsSettingsPage() {
  await requireAuth()

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Limits</h1>
      </div>

      <div className="space-y-4 w-full">
        <Card>
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-normal text-foreground">Concurrent Calls Limit</span>
                <span className="text-md font-semibold text-foreground">20</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs font-normal border-border bg-background hover:bg-accent"
                disabled
              >
                <PencilIcon className="h-3 w-3 mr-1.5" />
                Adjust Limit
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-normal text-foreground">LLM Token Limit</span>
                <span className="text-md font-semibold text-foreground">32768</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-normal text-foreground">Telnyx CPS</span>
                <span className="text-md font-semibold text-foreground">1</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs font-normal border-border bg-background hover:bg-accent"
                disabled
              >
                <PencilIcon className="h-3 w-3 mr-1.5" />
                Adjust Limit
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-normal text-foreground">Twilio CPS</span>
                <span className="text-md font-semibold text-foreground">1</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs font-normal border-border bg-background hover:bg-accent"
                disabled
              >
                <PencilIcon className="h-3 w-3 mr-1.5" />
                Adjust Limit
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-normal text-foreground">Custom Telephony CPS</span>
                <span className="text-md font-semibold text-foreground">1</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs font-normal border-border bg-background hover:bg-accent"
                disabled
              >
                <PencilIcon className="h-3 w-3 mr-1.5" />
                Adjust Limit
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
