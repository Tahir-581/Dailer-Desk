import { NextRequest, NextResponse } from "next/server";
import { db, orgs } from "@/lib/db";
import { eq } from "drizzle-orm";



export async function GET(request: NextRequest) {
  try {
    const allOrgs = await db.select().from(orgs);
    return NextResponse.json(allOrgs);
  } catch (error) {
    console.error("Error fetching orgs:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}



export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    const [newOrg] = await db
      .insert(orgs)
      .values({
        name,
        slug,
      })
      .returning();

    return NextResponse.json(newOrg, { status: 201 });
  } catch (error: any) {
    console.error("Error creating org:", error);
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Organization slug already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
  }
}
