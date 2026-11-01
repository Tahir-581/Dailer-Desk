"use client"

import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { Settings, Play, MoreHorizontal, Copy, Trash2 } from 'lucide-react';
import { FunctionConfigModal } from './function-config-modal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NodeActionsContext, AssistantIdContext } from '../conversation-flow-canvas';

export const FunctionNode = memo(({ id, data }: NodeProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    

    const config = data?.config;
    const { setNodes } = useReactFlow();
    const nodeActions = React.useContext(NodeActionsContext);
    const assistantId = React.useContext(AssistantIdContext);

    const handleSave = (newConfig: any) => {
        setNodes((nds) => nds.map((node) => {
            if (node.id === id) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        config: newConfig,
                        title: newConfig.name 

                    }
                }
            }
            return node;
        }));
    };

    return (
        <>
            <div
                className="relative w-[300px] bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-200 transition-colors group"
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
                        <div className="p-1.5 bg-blue-50 rounded-md">
                            <Settings className="h-4 w-4 text-blue-500" />
                        </div>
                        <span className="font-semibold text-gray-900">
                            {config ? config.name : "Function"}
                        </span>
                    </div>

                    <div className="flex items-center gap-1">
                        {}
                        <button
                            className="p-1 hover:bg-gray-100 rounded transition-colors opacity-0 group-hover:opacity-100"
                            onClick={() => setIsModalOpen(true)}
                        >
                            <Settings className="h-4 w-4 text-gray-500" />
                        </button>

                        {isHovered && nodeActions && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="opacity-70 hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100 outline-none">
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
                </div>

                <div className="px-4 pb-4">
                    {config ? (
                        <div className="text-xs text-gray-600 space-y-1">
                            <p className="font-medium text-gray-900">{config.apiEndpoint?.method} {config.apiEndpoint?.url}</p>
                            <p className="line-clamp-2">{config.description}</p>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="w-full py-6 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-lg hover:border-blue-200 hover:bg-blue-50/50 transition-all group/add"
                        >
                            <span className="text-sm font-medium text-gray-500 group-hover/add:text-blue-500">Select Function</span>
                        </button>
                    )}
                </div>

                <Handle
                    type="source"
                    position={Position.Right}
                    className="!w-3 !h-3 !bg-white !border-2 !border-gray-800"
                    style={{ right: -6, top: "50%", transform: "translateY(-50%)" }}
                />
            </div>

            <FunctionConfigModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                initialConfig={config}
                onSave={handleSave}
                assistantId={assistantId}
            />
        </>
    );
});

FunctionNode.displayName = "FunctionNode";
