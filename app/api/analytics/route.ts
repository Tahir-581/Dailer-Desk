import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, orgMemberships } from "@/lib/db"
import { eq } from "drizzle-orm"
import { AnalyticsService } from "@/lib/analytics/service"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const memberships = await db
      .select({ orgId: orgMemberships.orgId })
      .from(orgMemberships)
      .where(eq(orgMemberships.userId, session.user.id))

    if (!memberships.length) {
      return NextResponse.json({ error: "No organization selected" }, { status: 400 })
    }

    const orgId = memberships[0].orgId
    const { searchParams } = new URL(request.url)
    const startDateParam = searchParams.get("startDate")
    const endDateParam = searchParams.get("endDate")
    const assistantId = searchParams.get("assistantId") || undefined

    const startDate = startDateParam ? new Date(startDateParam) : undefined
    const endDate = endDateParam ? new Date(endDateParam) : undefined

    const filters = { orgId, startDate, endDate, assistantId }

    const [
      metrics,
      timeSeries,
      outcomes,
      assistantPerformance,
      directionBreakdown,
      hourlyActivity,
      durationDistribution,
      sentimentDistribution,
    ] = await Promise.all([
      AnalyticsService.getCallMetrics(filters),
      AnalyticsService.getTimeSeriesData(filters),
      AnalyticsService.getOutcomeBreakdown(filters),
      AnalyticsService.getAssistantPerformance(filters),
      AnalyticsService.getDirectionBreakdown(filters),
      AnalyticsService.getHourlyActivity(filters),
      AnalyticsService.getDurationDistribution(filters),
      AnalyticsService.getSentimentDistribution(filters),
    ])

    return NextResponse.json({
      metrics,
      timeSeries,
      outcomes,
      assistantPerformance,
      directionBreakdown,
      hourlyActivity,
      durationDistribution,
      sentimentDistribution,
    })
  } catch (error) {
    console.error("Analytics API error:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}

