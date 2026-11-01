import React, { memo, useState, useContext, useRef, useEffect, useCallback } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { Hash, Plus, MoreHorizontal, Copy, Trash2, Pencil, Sparkles, GripVertical, Trash } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { NodeActionsContext } from '../conversation-flow-canvas';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableTransitionItem = ({
    idx,
    trans,
    editingIndex,
    editValue,
    setEditValue,
    handleSaveTransition,
    handleKeyDown,
    handleTransitionEdit,
    deleteTransition
}: any) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: `transition-${idx}` });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
    };

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editingIndex === idx && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingIndex, idx]);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="group/item relative flex items-center w-full"
        >
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <div
                    {...attributes}
                    {...listeners}
                    className="opacity-0 group-hover/item:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-400 shrink-0"
                >
                    <GripVertical className="h-3.5 w-3.5" />
                </div>

                <div className="flex-1 relative flex items-center justify-between p-2.5 rounded text-xs font-medium border border-transparent transition-colors cursor-pointer bg-slate-50 text-slate-700 hover:border-slate-200 min-w-0">
                    <div className="flex items-center gap-2.5 w-full min-w-0">
                        <svg className="text-slate-400 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" strokeDasharray="4 4"></circle>
                        </svg>

                        {editingIndex === idx ? (
                            <input
                                ref={inputRef}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleSaveTransition}
                                onKeyDown={(e) => handleKeyDown(e, 'transition')}
                                className="bg-white border border-pink-200 rounded px-1 w-full outline-none focus:ring-1 focus:ring-pink-400"
                            />
                        ) : (
                            <span className="truncate flex-1 lowercase first-letter:uppercase">{trans}</span>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 ml-2 shrink-0">
                        <div className="opacity-0 group-hover/item:opacity-100 flex items-center gap-1 transition-opacity">
                            <button
                                onClick={(e) => handleTransitionEdit(idx, trans, e)}
                                className="p-1 hover:bg-white rounded transition-colors text-slate-400 hover:text-pink-600"
                            >
                                <Pencil className="h-3 w-3" />
                            </button>
                            <button
                                onClick={(e) => deleteTransition(idx, e)}
                                className="p-1 hover:bg-white rounded transition-colors text-slate-400 hover:text-red-500"
                            >
                                <Trash className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <Handle
                type="source"
                position={Position.Right}
                id={`transition-${idx}`}
                className="!w-3 !h-3 !bg-white !border-2 !border-gray-800"
                style={{ right: -30, zIndex: 20 }}
            />
        </div>
    );
};

export const ConversationNode = memo(({ id, data }: NodeProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleValue, setTitleValue] = useState(data?.title || "Conversation");
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editValue, setEditValue] = useState("");

    const nodeActions = useContext(NodeActionsContext);
    const { setNodes } = useReactFlow();
    const titleInputRef = useRef<HTMLInputElement>(null);

    const transitions = data?.transitions || ["Describe the transition condition"];

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

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
                        data: { ...node.data, title: titleValue },
                    };
                }
                return node;
            })
        );
        setIsEditingTitle(false);
    };

    const addTransition = (e: React.MouseEvent) => {
        e.stopPropagation();
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            transitions: [...transitions, "Describe the transition condition"],
                        },
                    };
                }
                return node;
            })
        );
    };

    const deleteTransition = (idx: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === id) {
                    const newTransitions = transitions.filter((_: any, i: number) => i !== idx);
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            transitions: newTransitions,
                        },
                    };
                }
                return node;
            })
        );
    };

    const handleTransitionEdit = (idx: number, currentVal: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingIndex(idx);
        setEditValue(currentVal);
    };

    const handleSaveTransition = () => {
        if (editingIndex === null) return;
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === id) {
                    const newTransitions = [...transitions];
                    newTransitions[editingIndex] = editValue;
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            transitions: newTransitions,
                        },
                    };
                }
                return node;
            })
        );
        setEditingIndex(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent, type: 'transition' | 'title') => {
        if (e.key === 'Enter') {
            type === 'transition' ? handleSaveTransition() : handleSaveTitle();
        } else if (e.key === 'Escape') {
            type === 'transition' ? setEditingIndex(null) : setIsEditingTitle(false);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = parseInt(active.id.toString().split('-')[1]);
            const newIndex = parseInt(over.id.toString().split('-')[1]);

            setNodes((nds) =>
                nds.map((node) => {
                    if (node.id === id) {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                transitions: arrayMove(transitions, oldIndex, newIndex),
                            },
                        };
                    }
                    return node;
                })
            );
        }
    };

    return (
        <div
            className="relative w-[420px] bg-[#FFF1F2] rounded-2xl shadow-sm border border-transparent hover:border-pink-200 transition-colors group"
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
                    <div className="text-[#9D174D] shrink-0 font-bold text-lg">#</div>
                    {isEditingTitle ? (
                        <input
                            ref={titleInputRef}
                            value={titleValue}
                            onChange={(e) => setTitleValue(e.target.value)}
                            onBlur={handleSaveTitle}
                            onKeyDown={(e) => handleKeyDown(e, 'title')}
                            className="bg-white border border-pink-200 rounded px-1 w-full text-base font-bold text-[#9D174D] outline-none focus:ring-1 focus:ring-pink-400"
                        />
                    ) : (
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <span className="text-lg font-bold text-[#9D174D] truncate lowercase first-letter:uppercase">
                                {titleValue}
                            </span>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsEditingTitle(true); }}
                                className="opacity-0 group-hover/title:opacity-100 transition-opacity p-0.5"
                            >
                                <Pencil className="h-4 w-4 text-[#9D174D]" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    {isHovered && nodeActions && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="opacity-70 hover:opacity-100 transition-opacity p-1 rounded hover:bg-pink-100 outline-none">
                                    <MoreHorizontal className="h-5 w-5 text-gray-400" />
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

            <div className="px-3 pb-1 pt-2">
                <div className="bg-white rounded-xl h-44 shadow-sm border border-pink-50/30 w-full p-4 overflow-hidden relative">
                    <div className="text-[13px] text-slate-600 leading-relaxed overflow-hidden line-clamp-[7]">
                        {data?.instructions || data?.systemPrompt || (
                            <span className="text-slate-300 italic">No instructions provided yet... set them in the sidebar.</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-3">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-pink-50/30">
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
                        <button onClick={addTransition} className="hover:bg-gray-100 p-1 rounded-md transition-colors">
                            <Plus className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="space-y-3 nodrag">
                            <SortableContext
                                items={transitions.map((_: any, i: number) => `transition-${i}`)}
                                strategy={verticalListSortingStrategy}
                            >
                                {transitions.map((trans: string, idx: number) => (
                                    <SortableTransitionItem
                                        key={idx}
                                        idx={idx}
                                        trans={trans}
                                        editingIndex={editingIndex}
                                        editValue={editValue}
                                        setEditValue={setEditValue}
                                        handleSaveTransition={handleSaveTransition}
                                        handleKeyDown={handleKeyDown}
                                        handleTransitionEdit={handleTransitionEdit}
                                        deleteTransition={deleteTransition}
                                    />
                                ))}
                            </SortableContext>
                        </div>
                    </DndContext>
                </div>
            </div>
        </div>
    );
});

ConversationNode.displayName = "ConversationNode";
