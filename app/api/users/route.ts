import { NextRequest, NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";



export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get("orgId");
    
    const query = db.select().from(users);
    const allUsers = orgId
      ? await query.where(eq(users.orgId, orgId))
      : await query;

    return NextResponse.json(allUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}



export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, passwordHash, orgId, role } = body;

    if (!email || !passwordHash || !orgId) {
      return NextResponse.json(
        { error: "Email, passwordHash, and orgId are required" },
        { status: 400 }
      );
    }

    const [newUser] = await db
      .insert(users)
      .values({
        email,
        name,
        passwordHash,
        orgId,
        role: role || "member",
      })
      .returning();

    

    const { passwordHash: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error: any) {
    console.error("Error creating user:", error);
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "User email already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
