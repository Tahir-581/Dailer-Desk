import { requireAuth } from "@/lib/auth/server"
import { SessionHistoryTable } from "@/components/analytics/session-history-table"

export default async function CallHistoryPage() {
  await requireAuth()

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="mx-auto w-full">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Call History</h1>
          <p className="text-muted-foreground">
            View and manage your call logs
          </p>
        </div>
        <div className="mt-8">
          <SessionHistoryTable />
        </div>
      </div>
    </div>
  )
}
