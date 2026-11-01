import { NextRequest, NextResponse } from "next/server";
import { db, workflows, assistants } from "@/lib/db";
import { eq } from "drizzle-orm";
import { createWorkflowSchema } from "@/lib/validations/workflow";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = createWorkflowSchema.safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json(
                { error: "Invalid data", details: validatedData.error.format() },
                { status: 400 }
            );
        }

        const { assistantId, name, description } = validatedData.data;

        

        const [assistant] = await db
            .select()
            .from(assistants)
            .where(eq(assistants.id, assistantId))
            .limit(1);

        if (!assistant) {
            return NextResponse.json(
                { error: "Assistant not found" },
                { status: 404 }
            );
        }

        

        const [existingWorkflow] = await db
            .select()
            .from(workflows)
            .where(eq(workflows.assistantId, assistantId))
            .limit(1);

        if (existingWorkflow) {
            return NextResponse.json(
                { error: "Workflow already exists for this assistant", workflowId: existingWorkflow.id },
                { status: 409 }
            );
        }

        const [newWorkflow] = await db
            .insert(workflows)
            .values({
                assistantId,
                orgId: assistant.orgId,
                name,
                description,
                enabled: true,
            })
            .returning();

        return NextResponse.json(newWorkflow, { status: 201 });
    } catch (error) {
        console.error("Error creating workflow:", error);
        return NextResponse.json(
            { error: "Failed to create workflow" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const orgId = request.nextUrl.searchParams.get("orgId");

        if (!orgId) {
            return NextResponse.json(
                { error: "orgId is required" },
                { status: 400 }
            );
        }

        const allWorkflows = await db
            .select()
            .from(workflows)
            .where(eq(workflows.orgId, orgId));

        return NextResponse.json(allWorkflows);
    } catch (error) {
        console.error("Error fetching workflows:", error);
        return NextResponse.json(
            { error: "Failed to fetch workflows" },
            { status: 500 }
        );
    }
}
