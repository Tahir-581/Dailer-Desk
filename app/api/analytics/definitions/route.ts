import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AnalyticsService } from "@/lib/analytics/service";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session || !session.session.activeOrganizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.session.activeOrganizationId;
    const definitions = await AnalyticsService.getAnalysisDefinitions(orgId);
    
    return NextResponse.json(definitions);
  } catch (error) {
    return NextResponse.json({ error: "Failed to get definitions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session || !session.session.activeOrganizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.session.activeOrganizationId;
    const body = await req.json();
    
    const definition = await AnalyticsService.createAnalysisDefinition({
        ...body,
        orgId,
        createdBy: session.user.id
    });
    
    return NextResponse.json(definition);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create definition" }, { status: 500 });
  }
}
