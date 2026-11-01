
import React, { memo, useState, useContext, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import {
    MessageSquare,
    MoreHorizontal,
    Copy,
    Trash2,
    Pencil,
    Sparkles,
    Share2
} from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { NodeActionsContext } from '../conversation-flow-canvas';
import { Textarea } from '@/components/ui/textarea';

export const SMSNode = memo(({ id, data }: NodeProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleValue, setTitleValue] = useState(data?.title || "SMS");

    const nodeActions = useContext(NodeActionsContext);
    const { setNodes } = useReactFlow();
    const titleInputRef = useRef<HTMLInputElement>(null);

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

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            content: e.target.value,
                        },
                    };
                }
                return node;
            })
        );
    };

    return (
        <div
            className="relative w-[380px] bg-[#FFF1ED] rounded-[24px] shadow-sm border border-transparent hover:border-orange-200 transition-colors group p-1"
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
                <div className="flex items-center gap-2 group/title flex-1">
                    <MessageSquare className="h-5 w-5 text-orange-600 shrink-0" />
                    {isEditingTitle ? (
                        <input
                            ref={titleInputRef}
                            value={titleValue}
                            onChange={(e) => setTitleValue(e.target.value)}
                            onBlur={handleSaveTitle}
                            onKeyDown={handleKeyDown}
                            className="bg-white border border-orange-200 rounded px-1 w-full text-lg font-semibold text-orange-800 outline-none focus:ring-1 focus:ring-orange-400"
                        />
                    ) : (
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-xl font-medium text-orange-800 truncate">
                                {titleValue}
                            </span>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsEditingTitle(true); }}
                                className="opacity-0 group-hover/title:opacity-100 transition-opacity p-0.5"
                            >
                                <Pencil className="h-4 w-4 text-orange-500" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    {isHovered && nodeActions && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="opacity-70 hover:opacity-100 transition-opacity p-1 rounded hover:bg-orange-100 outline-none">
                                    <MoreHorizontal className="h-5 w-5 text-orange-500" />
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

            <div className="p-2 space-y-2">
                {}
                <div className="bg-white rounded-[18px] shadow-sm">
                    <Textarea
                        value={data?.content || ""}
                        onChange={handleContentChange}
                        placeholder="Type your SMS message here..."
                        className="min-h-[140px] w-full border-none focus-visible:ring-0 resize-none bg-transparent p-4 text-sm text-slate-700 placeholder:text-slate-400 placeholder:italic nodrag"
                    />
                </div>

                {}
                <div className="bg-white rounded-[18px] p-3 shadow-sm">
                    <div className="flex items-center gap-2 mb-3 text-slate-400">
                        <Share2 className="h-4 w-4" />
                        <span className="text-sm font-medium text-slate-400">Transition</span>
                    </div>

                    <div className="space-y-2">
                        {}
                        <div className="group/item relative flex items-center w-full">
                            <div className="flex-1 relative flex items-center justify-between p-2.5 rounded text-xs font-medium border border-transparent transition-colors cursor-pointer bg-slate-50 text-slate-700 hover:border-slate-200 min-w-0">
                                <div className="flex items-center gap-2.5 w-full min-w-0">
                                    <Sparkles className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                    <span className="truncate flex-1">Sent successfully</span>
                                </div>
                            </div>
                            <Handle
                                type="source"
                                position={Position.Right}
                                id="sent-success"
                                className="!w-3 !h-3 !bg-white !border-2 !border-gray-800"
                                style={{ right: -28, zIndex: 20 }}
                            />
                        </div>

                        {}
                        <div className="group/item relative flex items-center w-full">
                            <div className="flex-1 relative flex items-center justify-between p-2.5 rounded text-xs font-medium border border-transparent transition-colors cursor-pointer bg-slate-50 text-slate-700 hover:border-slate-200 min-w-0">
                                <div className="flex items-center gap-2.5 w-full min-w-0">
                                    <Sparkles className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                    <span className="truncate flex-1">Failed to send</span>
                                </div>
                            </div>
                            <Handle
                                type="source"
                                position={Position.Right}
                                id="sent-failed"
                                className="!w-3 !h-3 !bg-white !border-2 !border-gray-800"
                                style={{ right: -28, zIndex: 20 }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

SMSNode.displayName = "SMSNode";
