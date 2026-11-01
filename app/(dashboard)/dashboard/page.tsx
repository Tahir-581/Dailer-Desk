import { requireAuth } from "@/lib/auth/server"
import { redirect } from "next/navigation"
import { db, orgMemberships } from "@/lib/db"
import { eq } from "drizzle-orm"
import { LiveKitAnalyticsDashboard } from "@/components/analytics/livekit-analytics-dashboard"

export default async function Page() {
  const session = await requireAuth()

  const memberships = await db
    .select()
    .from(orgMemberships)
    .where(eq(orgMemberships.userId, session.user.id))
    .limit(1);

  if (memberships.length === 0) {
    redirect("/create-organization");
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <LiveKitAnalyticsDashboard />
      </div>
    </div>
  )
}