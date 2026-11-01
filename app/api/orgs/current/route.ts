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

    

    const currentOrgId = request.cookies.get("current_org_id")?.value;

    let membership;
    
    if (currentOrgId) {
      

      const memberships = await db
        .select({
          id: orgMemberships.id,
          orgId: orgMemberships.orgId,
          role: orgMemberships.role,
          org: {
            id: orgs.id,
            name: orgs.name,
            slug: orgs.slug,
          },
        })
        .from(orgMemberships)
        .innerJoin(orgs, eq(orgMemberships.orgId, orgs.id))
        .where(eq(orgMemberships.userId, session.user.id));

      membership = memberships.find(m => m.orgId === currentOrgId);
    }

    

    if (!membership) {
      const memberships = await db
        .select({
          id: orgMemberships.id,
          orgId: orgMemberships.orgId,
          role: orgMemberships.role,
          org: {
            id: orgs.id,
            name: orgs.name,
            slug: orgs.slug,
          },
        })
        .from(orgMemberships)
        .innerJoin(orgs, eq(orgMemberships.orgId, orgs.id))
        .where(eq(orgMemberships.userId, session.user.id))
        .limit(1);

      membership = memberships[0];
    }

    if (!membership) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 }
      );
    }

    return NextResponse.json(membership);
  } catch (error) {
    console.error("Error fetching current org:", error);
    return NextResponse.json(
      { error: "Failed to fetch current organization" },
      { status: 500 }
    );
  }
}
