import { requireAuth } from "@/lib/auth/server"

export default async function LogsPage() {
  await requireAuth()
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="mx-auto w-full">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Logs</h1>
          <p className="text-muted-foreground">
            View and analyze your application logs
          </p>
        </div>
        <div className="mt-8">
        </div>
      </div>
    </div>
  )
}
