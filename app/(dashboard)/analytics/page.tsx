import { requireAuth } from "@/lib/auth/server"
import { redirect } from "next/navigation"
import { db, orgMemberships } from "@/lib/db"
import { eq } from "drizzle-orm"
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard"

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
                <div className="flex flex-col gap-4 p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>
                    </div>
                    <AnalyticsDashboard />
                </div>
            </div>
        </div>
    )
}
