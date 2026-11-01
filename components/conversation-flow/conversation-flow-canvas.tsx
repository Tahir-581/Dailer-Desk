"use client"

import { useCallback, useMemo, useRef, useEffect, useState, useImperativeHandle, forwardRef } from "react"
import * as React from "react"
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  ReactFlowProvider,
  Handle,
  Position,
  BaseEdge,
  EdgeProps,
  getBezierPath,
  getStraightPath,
  EdgeLabelRenderer,
} from "reactflow"
import "reactflow/dist/style.css"
import { Play, ChevronDown, Grid3x3, Plus, X, MoreHorizontal, Copy, Trash2 } from "lucide-react"
import { PressDigitNode } from "./nodes/press-digit-node"
import { LogicSplitNode } from "./nodes/logic-split-node"
import { AgentTransferNode } from "./nodes/agent-transfer-node"
import { BeginNode } from "./nodes/begin-node"
import { ConversationNode } from "./nodes/conversation_node"
import { EndCallNode } from "./nodes/end-call-node"
import { ExtractVariableNode } from "./nodes/extract-variable-node"
import { SMSNode } from "./nodes/sms-node"
import { FunctionNode } from "./nodes/function-node"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


const CallTransferNode: React.FC<{ id: string; data: any }> = ({ id, data }) => {
  const [isHovered, setIsHovered] = useState(false)
  const nodeActions = React.useContext(NodeActionsContext)
  const title = data?.title || "Transfer Call"

  return (
    <div
      className="relative w-[420px] bg-[#FFF7ED] rounded-xl shadow-sm border border-transparent hover:border-orange-200 transition-colors group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-white !border-2 !border-gray-800"
        style={{ left: -6, top: 24 }}
      />

      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <span className="text-sm font-medium text-gray-800">{title}</span>
        </div>

        {isHovered && nodeActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="opacity-70 hover:opacity-100 transition-opacity p-1 rounded hover:bg-orange-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4 text-gray-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); nodeActions.onDuplicate(id) }}>
                <Copy className="h-4 w-4 mr-2" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); nodeActions.onDelete(id) }} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="p-2">
        <div className="bg-white rounded-lg p-3 shadow-sm border border-orange-50/50">
          <div className="flex items-center gap-2 mb-3 text-gray-400">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
            <span className="text-[11px] font-medium uppercase tracking-wide">Transition</span>
          </div>

          <div
            className="relative flex items-center justify-between p-2 rounded bg-gray-50 text-xs text-gray-700 font-medium"
          >
            <div className="flex items-center gap-2">
              <svg className="text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" strokeDasharray="4 4"></circle>
              </svg>
              <span>Transfer failed</span>
            </div>

            <Handle
              type="source"
              position={Position.Right}
              id="transition-failed"
              className="!w-3 !h-3 !bg-white !border-2 !border-gray-800"
              style={{
                right: -26,
                top: "50%",
                transform: "translateY(-50%)"
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}


const EdgeDeleteContext = React.createContext<((edgeId: string) => void) | null>(null)

interface NodeActions {
  onDuplicate: (nodeId: string) => void
  onDelete: (nodeId: string) => void
}

export const NodeActionsContext = React.createContext<NodeActions | null>(null)

export const AssistantIdContext = React.createContext<string | undefined>(undefined)

function CustomEdge(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    selected,
    label,
  } = props

  const edgeType = (props as any).type || "step"

  const labelX = (sourceX + targetX) / 2
  const labelY = (sourceY + targetY) / 2

  let edgePath: string
  if (edgeType === "step") {
    const midX = (sourceX + targetX) / 2
    edgePath = `M ${sourceX},${sourceY} L ${midX},${sourceY} L ${midX},${targetY} L ${targetX},${targetY}`
  } else {
    const pathParams = {
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    }
    const [path] = edgeType === "straight" || edgeType === "default"
      ? getStraightPath(pathParams)
      : getBezierPath(pathParams)
    edgePath = path
  }

  const deleteEdge = React.useContext(EdgeDeleteContext)

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      if (deleteEdge) {
        deleteEdge(id)
      }
    },
    [id, deleteEdge]
  )

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={style}
      />
      {selected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan"
          >
            <button
              onClick={handleDelete}
              onMouseDown={(e) => {
                e.stopPropagation()
                e.preventDefault()
              }}
              onMouseUp={(e) => {
                e.stopPropagation()
                e.preventDefault()
              }}
              className="h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 border-2 border-white shadow-md flex items-center justify-center cursor-pointer transition-colors"
              style={{ zIndex: 10 }}
              type="button"
            >
              <X className="h-3 w-3 text-white" />
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

const nodeTypes = {
  begin: BeginNode,
  welcome: ConversationNode,
  conversation: ConversationNode,
  custom: ConversationNode,
  "end-call": EndCallNode,
  endCall: EndCallNode,

  "call-transfer": CallTransferNode,
  "press-digit": PressDigitNode,
  "logic-split": LogicSplitNode,
  "agent-transfer": AgentTransferNode,
  "extract-variable": ExtractVariableNode,
  sms: SMSNode,
  function: FunctionNode,
}

const edgeTypes = {
  default: CustomEdge,
  smoothstep: CustomEdge,
  straight: CustomEdge,
  step: CustomEdge,
}

export interface ConversationFlowCanvasRef {
  addNode: (type: string, name: string) => void
  updateNodeData: (nodeId: string, data: any) => void
}

interface ConversationFlowCanvasProps {
  assistantId: string
  onSelectionChange?: (node: any | null) => void
}

const ConversationFlowCanvasInner = forwardRef<ConversationFlowCanvasRef, ConversationFlowCanvasProps>(({ assistantId, onSelectionChange }, ref) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [workflowId, setWorkflowId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchWorkflow = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/assistants/${assistantId}/workflow`)
        const data = response.ok ? await response.json() : null

        if (data && data.nodes && data.nodes.length > 0) {
          setWorkflowId(data.workflow?.id || data.id)
          setNodes(data.nodes)
          setEdges(data.edges || [])
        } else {
          const welcomeNodeId = `welcome-${Date.now()}`
          const defaultNodes = [
            {
              id: `begin-${Date.now()}`,
              type: "begin",
              position: { x: 120, y: 200 },
              data: {},
            },
            {
              id: welcomeNodeId,
              type: "conversation",
              position: { x: 380, y: 200 },
              data: {
                title: "Welcome Node",
                transitions: [
                  "User needs to return the package",
                  "User needs to check the order status",
                ],
              },
            }
          ]
          setNodes(defaultNodes)
          setEdges([
            {
              id: `edge-${Date.now()}`,
              source: defaultNodes[0].id,
              target: welcomeNodeId,
              type: "step",
            }
          ])
        }
      } catch (error) {
        console.error("Failed to fetch workflow:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (assistantId) fetchWorkflow()
  }, [assistantId, setNodes, setEdges])

  const addNode = useCallback((type: string, name: string) => {
    setNodes((nds) => {
      const newNodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      const maxX = nds.length > 0
        ? Math.max(...nds.map(n => n.position.x))
        : 400
      const newPosition = {
        x: maxX + 380,
        y: 200
      }

      const newNode: Node = {
        id: newNodeId,
        type: type || "custom",
        position: newPosition,
        data: {
          title: name,
          transitions: ["Describe the transition condition"],
        },
      }

      return [...nds, newNode]
    })
  }, [setNodes])

  const duplicateNode = useCallback((nodeId: string) => {
    setNodes((nds) => {
      const nodeToDuplicate = nds.find(n => n.id === nodeId)
      if (!nodeToDuplicate) return nds

      const newNodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const maxX = nds.length > 0
        ? Math.max(...nds.map(n => n.position.x))
        : 400

      const duplicatedNode: Node = {
        ...nodeToDuplicate,
        id: newNodeId,
        position: {
          x: maxX + 380,
          y: nodeToDuplicate.position.y,
        },
        selected: false,
      }

      return [...nds, duplicatedNode]
    })
  }, [setNodes])

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter(n => n.id !== nodeId))
    setEdges((eds) => eds.filter(e => e.source !== nodeId && e.target !== nodeId))
  }, [setNodes, setEdges])

  useEffect(() => {
    const selected = nodes.find(n => n.selected)
    if (onSelectionChange) {
      onSelectionChange(selected || null)
    }
  }, [nodes, onSelectionChange])

  const updateNodeData = useCallback((nodeId: string, data: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...data,
            },
          }
        }
        return node
      })
    )
  }, [setNodes])

  useImperativeHandle(ref, () => ({
    addNode,
    updateNodeData,
  }), [addNode, updateNodeData])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.stopPropagation()
    },
    []
  )

  const onEdgesDelete = useCallback(
    (deleted: Edge[]) => {
      setEdges((eds) => eds.filter((edge) => !deleted.find((d) => d.id === edge.id)))
    },
    [setEdges]
  )

  const handleEdgeDelete = useCallback(
    (edgeId: string) => {
      setEdges((eds) => {
        const filtered = eds.filter((edge) => edge.id !== edgeId)
        return filtered
      })
    },
    [setEdges]
  )

  useEffect(() => {
    if (isLoading) return

    const syncTimeout = setTimeout(async () => {
      try {
        let currentWorkflowId = workflowId;



        if (!currentWorkflowId) {
          const createRes = await fetch(`/api/workflows`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              assistantId,
              name: "Main Flow",
              description: "Automatic workflow creation"
            }),
          })

          if (createRes.ok) {
            const newWorkflow = await createRes.json()
            currentWorkflowId = newWorkflow.id
            setWorkflowId(newWorkflow.id)
          } else {
            console.error("Failed to create workflow automatically")
            return
          }
        }

        await fetch(`/api/workflows/${currentWorkflowId}/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nodes, edges }),
        })
      } catch (error) {
        console.error("Failed to sync workflow:", error)
      }
    }, 2000)

    return () => clearTimeout(syncTimeout)
  }, [nodes, edges, workflowId, isLoading, assistantId])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-900 border-t-transparent"></div>
          <p className="text-sm text-gray-500 font-medium">Loading Workflow...</p>
        </div>
      </div>
    )
  }

  return (
    <EdgeDeleteContext.Provider value={handleEdgeDelete}>
      <AssistantIdContext.Provider value={assistantId}>
        <NodeActionsContext.Provider value={{ onDuplicate: duplicateNode, onDelete: deleteNode }}>
          <div className="flex-1 relative bg-gray-50">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onEdgeClick={onEdgeClick}
              onEdgesDelete={onEdgesDelete}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              edgesFocusable={true}
              edgesUpdatable={false}
              selectNodesOnDrag={false}
              deleteKeyCode={null}
              fitView
              minZoom={0.1}
              maxZoom={2}
              defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
              attributionPosition="bottom-left"
              panOnScroll={false}
              panOnDrag={true}
              zoomOnScroll={true}
              zoomOnPinch={true}
              zoomOnDoubleClick={false}
              preventScrolling={true}
              nodesDraggable={true}
              nodesConnectable={true}
              elementsSelectable={true}
              defaultEdgeOptions={{
                type: "step",
                style: { stroke: "#d1d5db", strokeWidth: 1.5, opacity: 0.85 },
                animated: false,
              }}
              snapToGrid={false}
              snapGrid={[20, 20]}
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={8}
                size={2}
                color="#6b7280"
                style={{ opacity: 0.1 }}
              />
              <Controls
                showInteractive={false}
                showZoom={true}
                showFitView={true}
                position="bottom-left"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                }}
              />
            </ReactFlow>

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-white border border-gray-200 rounded-md px-2 py-1 shadow-sm z-10">
              <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100">
                <Play className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100">
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100">
                <Grid3x3 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </NodeActionsContext.Provider>
      </AssistantIdContext.Provider>
    </EdgeDeleteContext.Provider>
  )
})

ConversationFlowCanvasInner.displayName = "ConversationFlowCanvasInner"

export const ConversationFlowCanvas = forwardRef<ConversationFlowCanvasRef, ConversationFlowCanvasProps>((props, ref) => {
  return (
    <ReactFlowProvider>
      <ConversationFlowCanvasInner {...props} ref={ref} />
    </ReactFlowProvider>
  )
})

ConversationFlowCanvas.displayName = "ConversationFlowCanvas"


