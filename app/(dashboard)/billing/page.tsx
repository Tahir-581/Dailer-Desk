import { requireAuth } from "@/lib/auth/server"

export default async function BillingPage() {
  await requireAuth()
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground">
            Manage your subscription and billing information
          </p>
        </div>
        <div className="mt-8">
        </div>
      </div>
    </div>
  )
}
