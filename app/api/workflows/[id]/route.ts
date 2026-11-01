import { NextRequest, NextResponse } from "next/server";
import { db, workflows, workflowNodes, workflowEdges } from "@/lib/db";
import { eq } from "drizzle-orm";
import { updateWorkflowMetadataSchema } from "@/lib/validations/workflow";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const workflowId = params.id;

        const workflow = await db.query.workflows.findFirst({
            where: eq(workflows.id, workflowId),
        });

        if (!workflow) {
            return NextResponse.json(
                { error: "Workflow not found" },
                { status: 404 }
            );
        }

        const nodes = await db.query.workflowNodes.findMany({
            where: eq(workflowNodes.workflowId, workflowId),
        });

        const edges = await db.query.workflowEdges.findMany({
            where: eq(workflowEdges.workflowId, workflowId),
        });

        return NextResponse.json({
            workflow: {
                id: workflow.id,
                name: workflow.name,
                assistant_id: workflow.assistantId,
                enabled: workflow.enabled,
                created_at: workflow.createdAt,
                updated_at: workflow.updatedAt,
            },
            nodes: nodes.map((node) => ({
                node_id: node.id,
                workflow_id: node.workflowId,
                type: node.type,
                config: node.config || {},
                created_at: node.createdAt,
            })),
            edges: edges.map((edge) => ({
                source_node_id: edge.sourceNodeId,
                target_node_id: edge.targetNodeId,
                workflow_id: edge.workflowId,
                condition: edge.condition,
                priority: edge.priority,
                created_at: edge.createdAt,
            })),
        });
    } catch (error) {
        console.error("Error fetching workflow:", error);
        return NextResponse.json(
            { error: "Failed to fetch workflow" },
            { status: 500 }
        );
    }
}


export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const workflowId = params.id;
        const body = await request.json();
        const validatedData = updateWorkflowMetadataSchema.safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json(
                { error: "Invalid data", details: validatedData.error.format() },
                { status: 400 }
            );
        }

        const [updatedWorkflow] = await db
            .update(workflows)
            .set({
                ...validatedData.data,
                updatedAt: new Date(),
            })
            .where(eq(workflows.id, workflowId))
            .returning();

        if (!updatedWorkflow) {
            return NextResponse.json(
                { error: "Workflow not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(updatedWorkflow);
    } catch (error) {
        console.error("Error updating workflow:", error);
        return NextResponse.json(
            { error: "Failed to update workflow" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const workflowId = params.id;

        const [deletedWorkflow] = await db
            .delete(workflows)
            .where(eq(workflows.id, workflowId))
            .returning();

        if (!deletedWorkflow) {
            return NextResponse.json(
                { error: "Workflow not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ message: "Workflow deleted successfully" });
    } catch (error) {
        console.error("Error deleting workflow:", error);
        return NextResponse.json(
            { error: "Failed to delete workflow" },
            { status: 500 }
        );
    }
}
