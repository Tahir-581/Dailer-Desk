
import React, { memo, useState, useContext, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { Bot, MoreHorizontal, Copy, Trash2, Pencil, Sparkles } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { NodeActionsContext } from '../conversation-flow-canvas';

export const AgentTransferNode = memo(({ id, data }: NodeProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleValue, setTitleValue] = useState(data?.title || "Agent Transfer Node");

    const nodeActions = useContext(NodeActionsContext);
    const { setNodes } = useReactFlow();
    const titleInputRef = useRef<HTMLInputElement>(null);

    const startHandleTop = 24;

    useEffect(() => {
        if (isEditingTitle && titleInputRef.current) {
            titleInputRef.current.focus();
            titleInputRef.current.select();
        }
    }, [isEditingTitle]);

    const handleSaveTitle = () => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            title: titleValue,
                        },
                    };
                }
                return node;
            })
        );
        setIsEditingTitle(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSaveTitle();
        } else if (e.key === 'Escape') {
            setIsEditingTitle(false);
        }
    };

    return (
        <div
            className="relative w-[420px] bg-[#FFF7ED] rounded-2xl shadow-sm border border-transparent hover:border-orange-100 transition-colors group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !bg-white !border-2 !border-gray-800"
                style={{ left: -6, top: startHandleTop }}
            />

            <div className="flex items-center justify-between p-4 pb-2">
                <div className="flex items-center gap-2 group/title flex-1">
                    <div className="text-orange-600 shrink-0">
                        <Bot className="h-6 w-6" />
                    </div>
                    {isEditingTitle ? (
                        <input
                            ref={titleInputRef}
                            value={titleValue}
                            onChange={(e) => setTitleValue(e.target.value)}
                            onBlur={handleSaveTitle}
                            onKeyDown={handleKeyDown}
                            className="bg-white border border-orange-200 rounded px-1 w-full text-base font-bold text-orange-900 outline-none focus:ring-1 focus:ring-orange-400"
                        />
                    ) : (
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <span className="text-lg font-bold text-orange-900 truncate">
                                {titleValue}
                            </span>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsEditingTitle(true); }}
                                className="opacity-0 group-hover/title:opacity-100 transition-opacity p-0.5"
                            >
                                <Pencil className="h-4 w-4 text-orange-600" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    {isHovered && nodeActions && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="opacity-70 hover:opacity-100 transition-opacity p-1 rounded hover:bg-orange-50 outline-none">
                                    <MoreHorizontal className="h-5 w-5 text-gray-500" />
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

            <div className="p-3">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-50/30">
                    <div className="flex items-center justify-between mb-4 text-gray-400 nodrag">
                        <div className="flex items-center gap-2">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="18" cy="5" r="3"></circle>
                                <circle cx="6" cy="12" r="3"></circle>
                                <circle cx="18" cy="19" r="3"></circle>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                            </svg>
                            <span className="text-[12px] font-semibold uppercase tracking-wider text-gray-400">Transition</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="group/item relative flex items-center gap-2">
                            <div className="w-3.5 shrink-0" />
                            <div className="flex-1 relative flex items-center justify-between p-2.5 rounded bg-orange-50/30 text-xs text-orange-700 font-medium border border-transparent hover:border-orange-100 transition-colors cursor-pointer">
                                <div className="flex items-center gap-2.5 w-full min-w-0">
                                    <Sparkles className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                                    <span className="truncate flex-1">Transfer failed</span>
                                </div>
                            </div>
                            <Handle
                                type="source"
                                position={Position.Right}
                                id="transfer-failed"
                                className="!w-3 !h-3 !bg-white !border-2 !border-gray-800"
                                style={{ right: -30, zIndex: 20 }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

AgentTransferNode.displayName = "AgentTransferNode";
