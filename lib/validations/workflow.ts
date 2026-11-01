import { z } from "zod";

export const workflowNodeSchema = z.object({
    id: z.string(),
    type: z.string(),
    position: z.object({
        x: z.number(),
        y: z.number(),
    }),
    data: z.record(z.string(), z.any()).default({}),
});

export const workflowEdgeSchema = z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    sourceHandle: z.string().optional().nullish(),
    data: z.object({
        condition: z.string().optional().nullish(),
        priority: z.number().default(0),
    }).default({ priority: 0 }),
});

export const syncWorkflowSchema = z.object({
    nodes: z.array(workflowNodeSchema),
    edges: z.array(workflowEdgeSchema),
});

export const createWorkflowSchema = z.object({
    assistantId: z.string().uuid(),
    name: z.string().min(1),
    description: z.string().optional(),
});

export const updateWorkflowMetadataSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    enabled: z.boolean().optional(),
    config: z.record(z.string(), z.any()).optional(),
});

export type WorkflowNode = z.infer<typeof workflowNodeSchema>;
export type WorkflowEdge = z.infer<typeof workflowEdgeSchema>;
export type SyncWorkflowRequest = z.infer<typeof syncWorkflowSchema>;
export type CreateWorkflowRequest = z.infer<typeof createWorkflowSchema>;
export type UpdateWorkflowMetadataRequest = z.infer<typeof updateWorkflowMetadataSchema>;