import { NextRequest, NextResponse } from "next/server";
import { db, orgs } from "@/lib/db";
import { eq } from "drizzle-orm";



export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [org] = await db.select().from(orgs).where(eq(orgs.id, params.id));

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(org);
  } catch (error) {
    console.error("Error fetching org:", error);
    return NextResponse.json(
      { error: "Failed to fetch organization" },
      { status: 500 }
    );
  }
}



export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, slug } = body;

    const [updatedOrg] = await db
      .update(orgs)
      .set({
        name,
        slug,
        updatedAt: new Date(),
      })
      .where(eq(orgs.id, params.id))
      .returning();

    if (!updatedOrg) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedOrg);
  } catch (error: any) {
    console.error("Error updating org:", error);
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Organization slug already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update organization" },
      { status: 500 }
    );
  }
}



export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.delete(orgs).where(eq(orgs.id, params.id));
    return NextResponse.json({ message: "Organization deleted" });
  } catch (error) {
    console.error("Error deleting org:", error);
    return NextResponse.json(
      { error: "Failed to delete organization" },
      { status: 500 }
    );
  }
}
