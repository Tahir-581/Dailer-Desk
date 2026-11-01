
import React, { memo, useState, useContext, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { Square, MoreHorizontal, Copy, Trash2, Pencil } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { NodeActionsContext } from '../conversation-flow-canvas';

export const EndCallNode = memo(({ id, data }: NodeProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleValue, setTitleValue] = useState(data?.title || "End Call");
    const [isEditingMessage, setIsEditingMessage] = useState(false);
    const [messageValue, setMessageValue] = useState(data?.farewell_message || "Politely end the call");

    const nodeActions = useContext(NodeActionsContext);
    const { setNodes } = useReactFlow();
    const titleInputRef = useRef<HTMLInputElement>(null);
    const messageInputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isEditingTitle && titleInputRef.current) {
            titleInputRef.current.focus();
            titleInputRef.current.select();
        }
    }, [isEditingTitle]);

    useEffect(() => {
        if (isEditingMessage && messageInputRef.current) {
            messageInputRef.current.focus();
            messageInputRef.current.select();
        }
    }, [isEditingMessage]);

    const handleSaveTitle = () => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: { ...node.data, title: titleValue },
                    };
                }
                return node;
            })
        );
        setIsEditingTitle(false);
    };

    const handleSaveMessage = () => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: { ...node.data, farewell_message: messageValue },
                    };
                }
                return node;
            })
        );
        setIsEditingMessage(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && isEditingMessage) {
            handleSaveMessage();
        } else if (e.key === 'Enter' && isEditingTitle) {
            handleSaveTitle();
        } else if (e.key === 'Escape') {
            setIsEditingTitle(false);
            setIsEditingMessage(false);
        }
    };

    return (
        <div
            className="relative w-[420px] bg-[#F0F9FF] rounded-2xl shadow-sm border border-transparent hover:border-sky-100 transition-colors group p-1"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3.5 !h-3.5 !bg-white !border-2 !border-gray-800"
                style={{ left: -8, top: 44 }}
            />

            <div className="flex items-center justify-between p-4 pb-3">
                <div className="flex items-center gap-3 group/title flex-1 ml-2">
                    <div className="text-[#0E7490] shrink-0">
                        <Square className="h-5 w-5" />
                    </div>
                    {isEditingTitle ? (
                        <input
                            ref={titleInputRef}
                            value={titleValue}
                            onChange={(e) => setTitleValue(e.target.value)}
                            onBlur={handleSaveTitle}
                            onKeyDown={handleKeyDown}
                            className="bg-white border border-sky-200 rounded px-1 w-full text-lg font-medium text-[#164E63] outline-none focus:ring-1 focus:ring-sky-400"
                        />
                    ) : (
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <span className="text-[19px] font-medium text-[#164E63] truncate">
                                {titleValue}
                            </span>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsEditingTitle(true); }}
                                className="opacity-0 group-hover/title:opacity-100 transition-opacity p-0.5"
                            >
                                <Pencil className="h-4 w-4 text-sky-400" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    {isHovered && nodeActions && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="opacity-70 hover:opacity-100 transition-opacity p-1 rounded hover:bg-sky-100 outline-none text-sky-400">
                                    <MoreHorizontal className="h-5 w-5" />
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

            <div className="px-3 pb-3">
                <div className="bg-white rounded-xl min-h-[140px] shadow-sm border border-sky-50/50 w-full p-5 relative">
                    {isEditingMessage ? (
                        <textarea
                            ref={messageInputRef}
                            value={messageValue}
                            onChange={(e) => setMessageValue(e.target.value)}
                            onBlur={handleSaveMessage}
                            onKeyDown={handleKeyDown}
                            className="bg-white rounded w-full h-full text-[17px] text-slate-800 outline-none focus:ring-0 resize-none"
                            placeholder="Enter farewell message..."
                        />
                    ) : (
                        <div
                            className="w-full h-full cursor-pointer min-h-[100px]"
                            onClick={() => setIsEditingMessage(true)}
                        >
                            <span className="text-[17px] text-slate-800 leading-snug block">
                                {messageValue}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

EndCallNode.displayName = "EndCallNode";
