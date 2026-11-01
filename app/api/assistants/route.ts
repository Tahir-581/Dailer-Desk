import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, assistants, orgMemberships, orgs, workflows, workflowNodes, workflowEdges } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getTemplateById } from "@/lib/agent-templates";

async function getCurrentOrgId(request: NextRequest): Promise<string | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return null;

  const currentOrgId = request.cookies.get("current_org_id")?.value;
  const memberships = await db
    .select({ orgId: orgMemberships.orgId })
    .from(orgMemberships)
    .innerJoin(orgs, eq(orgMemberships.orgId, orgs.id))
    .where(eq(orgMemberships.userId, session.user.id));

  const membership = currentOrgId
    ? memberships.find((m) => m.orgId === currentOrgId)
    : memberships[0] ?? null;

  return membership?.orgId ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const orgId = await getCurrentOrgId(request);
    if (!orgId) {
      return NextResponse.json(
        { error: "No organization selected or unauthorized" },
        { status: 403 }
      );
    }

    const status = request.nextUrl.searchParams.get("status");

    const conditions = [eq(assistants.orgId, orgId)];
    if (status) {
      conditions.push(eq(assistants.status, status as "active" | "inactive" | "archived"));
    }

    const allAssistants = await db
      .select()
      .from(assistants)
      .where(conditions.length > 1 ? and(...conditions) : conditions[0]);

    return NextResponse.json(allAssistants);
  } catch (error) {
    console.error("Error fetching assistants:", error);
    return NextResponse.json(
      { error: "Failed to fetch assistants" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, name, description, systemPrompt, status, config, createdBy } =
      body;

    if (!orgId || !name || !createdBy) {
      return NextResponse.json(
        { error: "orgId, name, and createdBy are required" },
        { status: 400 }
      );
    }

    const isWorkflowAgent = (config?.agentType === "conversation-flow");
    const templateId = config?.template as string | undefined;

    const [newAssistant] = await db
      .insert(assistants)
      .values({
        orgId,
        name,
        description,
        systemPrompt,
        status: status || "active",
        config: config || {},
        workflowEnabled: isWorkflowAgent,
        createdBy,
      })
      .returning();

    if (isWorkflowAgent && templateId && templateId !== "blank") {
      const template = getTemplateById(templateId);
      if (template?.seed && template.seed.nodes.length > 0) {
        const [newWorkflow] = await db
          .insert(workflows)
          .values({
            assistantId: newAssistant.id,
            orgId,
            name: `${name} Flow`,
            description: template.description || null,
            enabled: true,
          })
          .returning();

        const workflowId = newWorkflow.id;
        const seed = template.seed;
        const nodeIdMap: Record<string, string> = {};
        seed.nodes.forEach((node, i) => {
          const newId = `node-${workflowId}-${i}`;
          nodeIdMap[node.id] = newId;
        });

        await db.insert(workflowNodes).values(
          seed.nodes.map((node, i) => ({
            id: nodeIdMap[node.id],
            workflowId,
            type: node.type,
            config: node.data ?? {},
            positionX: Math.round(node.position.x),
            positionY: Math.round(node.position.y),
          }))
        );

        if (seed.edges.length > 0) {
          await db.insert(workflowEdges).values(
            seed.edges.map((edge, index) => ({
              id: `edge-${workflowId}-${index}`,
              workflowId,
              sourceNodeId: nodeIdMap[edge.source] ?? edge.source,
              targetNodeId: nodeIdMap[edge.target] ?? edge.target,
              sourceHandle: edge.sourceHandle ?? null,
              condition: edge.data?.condition ?? null,
              priority: edge.data?.priority ?? index,
            }))
          );
        }
      }
    }

    return NextResponse.json(newAssistant, { status: 201 });
  } catch (error) {
    console.error("Error creating assistant:", error);
    return NextResponse.json(
      { error: "Failed to create assistant" },
      { status: 500 }
    );
  }
}
