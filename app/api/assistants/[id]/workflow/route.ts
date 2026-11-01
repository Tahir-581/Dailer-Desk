import { NextRequest, NextResponse } from "next/server";
import { db, workflows, workflowNodes, workflowEdges } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const assistantId = params.id;

        const workflow = await db.query.workflows.findFirst({
            where: eq(workflows.assistantId, assistantId),
            with: {
                nodes: true,
                edges: true,
            },
        });

        if (!workflow) {
            return NextResponse.json(
                { error: "Workflow not found for this assistant" },
                { status: 404 }
            );
        }

        

        const formattedWorkflow = {
            ...workflow,
            nodes: workflow.nodes.map((node: any) => ({
                id: node.id,
                type: node.type,
                position: { x: node.positionX, y: node.positionY },
                data: node.config,
            })),
            edges: workflow.edges.map((edge: any) => ({
                id: edge.id,
                source: edge.sourceNodeId,
                target: edge.targetNodeId,
                sourceHandle: edge.sourceHandle,
                data: {
                    condition: edge.condition,
                    priority: edge.priority,
                },
            })),
        };

        return NextResponse.json(formattedWorkflow);
    } catch (error) {
        console.error("Error fetching assistant workflow:", error);
        return NextResponse.json(
            { error: "Failed to fetch workflow" },
            { status: 500 }
        );
    }
}
