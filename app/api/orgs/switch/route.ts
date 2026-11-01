import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, orgMemberships } from "@/lib/db";
import { eq, and } from "drizzle-orm";



export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orgId } = body;

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    

    const [membership] = await db
      .select()
      .from(orgMemberships)
      .where(
        and(
          eq(orgMemberships.userId, session.user.id),
          eq(orgMemberships.orgId, orgId)
        )
      )
      .limit(1);

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this organization" },
        { status: 403 }
      );
    }

    

    const response = NextResponse.json({
      message: "Organization switched",
      orgId: membership.orgId,
      role: membership.role,
    });

    

    response.cookies.set("current_org_id", membership.orgId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, 

    });

    return response;
  } catch (error) {
    console.error("Error switching org:", error);
    return NextResponse.json(
      { error: "Failed to switch organization" },
      { status: 500 }
    );
  }
}
