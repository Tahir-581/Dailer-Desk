import { NextRequest, NextResponse } from "next/server";
import { db, workflowNodes, workflowEdges, workflows } from "@/lib/db";
import { eq } from "drizzle-orm";
import { syncWorkflowSchema } from "@/lib/validations/workflow";

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const workflowId = params.id;
        const body = await request.json();
        const validatedData = syncWorkflowSchema.safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json(
                { error: "Invalid data", details: validatedData.error.format() },
                { status: 400 }
            );
        }

        const { nodes, edges } = validatedData.data;

        

        await db.transaction(async (tx) => {
            

            const workflow = await tx.query.workflows.findFirst({
                where: eq(workflows.id, workflowId),
            });

            if (!workflow) {
                throw new Error("Workflow not found");
            }

            

            await tx.delete(workflowNodes).where(eq(workflowNodes.workflowId, workflowId));
            await tx.delete(workflowEdges).where(eq(workflowEdges.workflowId, workflowId));

            

            if (nodes.length > 0) {
                await tx.insert(workflowNodes).values(
                    nodes.map((node) => ({
                        id: node.id,
                        workflowId,
                        type: node.type,
                        config: node.data,
                        positionX: Math.round(node.position.x),
                        positionY: Math.round(node.position.y),
                    }))
                );
            }

            

            if (edges.length > 0) {
                

                const getConditionFromSourceHandle = (edge: typeof edges[0]): string | null => {
                    

                    if (edge.data?.condition) {
                        return edge.data.condition;
                    }

                    

                    if (edge.sourceHandle) {
                        const match = edge.sourceHandle.match(/^transition-(\d+)$/);
                        if (match) {
                            const transitionIndex = parseInt(match[1], 10);
                            const sourceNode = nodes.find(n => n.id === edge.source);

                            if (sourceNode?.data?.transitions && Array.isArray(sourceNode.data.transitions)) {
                                const conditionText = sourceNode.data.transitions[transitionIndex];
                                if (conditionText && typeof conditionText === 'string') {
                                    return conditionText;
                                }
                            }
                        }

                        

                        const specialHandleConditions: Record<string, string> = {
                            "sent-success": "Sent successfully",
                            "sent-failed": "Failed to send",
                            "transfer-failed": "Transfer failed",
                        };

                        if (edge.sourceHandle in specialHandleConditions) {
                            return specialHandleConditions[edge.sourceHandle];
                        }
                    }

                    return null;
                };

                await tx.insert(workflowEdges).values(
                    edges.map((edge, index) => ({
                        id: edge.id,
                        workflowId,
                        sourceNodeId: edge.source,
                        targetNodeId: edge.target,
                        sourceHandle: edge.sourceHandle || null,
                        condition: getConditionFromSourceHandle(edge),
                        priority: edge.data?.priority ?? index, 

                    }))
                );
            }

            

            await tx
                .update(workflows)
                .set({ updatedAt: new Date() })
                .where(eq(workflows.id, workflowId));
        });

        return NextResponse.json({ message: "Workflow synchronized successfully" });
    } catch (error: any) {
        console.error("Error syncing workflow:", error);

        if (error.message === "Workflow not found") {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }

        return NextResponse.json(
            { error: "Failed to synchronize workflow" },
            { status: 500 }
        );
    }
}
