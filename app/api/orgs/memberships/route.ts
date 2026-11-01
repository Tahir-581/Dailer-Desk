import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, orgMemberships, orgs } from "@/lib/db";
import { eq } from "drizzle-orm";



export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const memberships = await db
      .select({
        id: orgMemberships.id,
        orgId: orgMemberships.orgId,
        role: orgMemberships.role,
        createdAt: orgMemberships.createdAt,
        org: {
          id: orgs.id,
          name: orgs.name,
          slug: orgs.slug,
        },
      })
      .from(orgMemberships)
      .innerJoin(orgs, eq(orgMemberships.orgId, orgs.id))
      .where(eq(orgMemberships.userId, session.user.id));

    return NextResponse.json(memberships);
  } catch (error) {
    console.error("Error fetching memberships:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}
