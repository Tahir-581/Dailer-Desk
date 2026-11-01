
import React, { memo, useState, useContext, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import {
    Braces,
    Plus,
    MoreHorizontal,
    Copy,
    Trash2,
    Pencil,
    GripVertical,
    Trash,
    Sparkles,
    List,
    Share2
} from 'lucide-react';
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

const SortableItem = ({
    id,
    idx,
    value,
    type,
    editingIndex,
    editValue,
    setEditValue,
    onSave,
    onKeyDown,
    onEdit,
    onDelete,
    icon: Icon
}: any) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: `${type}-${idx}` });

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
                    className="opacity-0 group-hover/item:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-400 shrink-0"
                >
                    <GripVertical className="h-3.5 w-3.5" />
                </div>

                <div className={`flex-1 relative flex items-center justify-between p-2.5 rounded text-xs font-medium border border-transparent transition-colors cursor-pointer bg-slate-50 text-slate-700 hover:border-slate-200 min-w-0`}>
                    <div className="flex items-center gap-2.5 w-full min-w-0">
                        {Icon && <Icon className="h-3.5 w-3.5 text-slate-400 shrink-0" />}

                        {editingIndex === idx ? (
                            <input
                                ref={inputRef}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={onSave}
                                onKeyDown={(e) => onKeyDown(e, type)}
                                className="bg-white border border-slate-200 rounded px-1 w-full outline-none focus:ring-1 focus:ring-slate-400"
                            />
                        ) : (
                            <span className="truncate flex-1">{value}</span>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 ml-2 shrink-0">
                        <div className="opacity-0 group-hover/item:opacity-100 flex items-center gap-1 transition-opacity">
                            <button
                                onClick={(e) => onEdit(idx, value, e)}
                                className="p-1 hover:bg-white rounded transition-colors text-slate-400 hover:text-slate-600"
                            >
                                <Pencil className="h-3 w-3" />
                            </button>
                            <button
                                onClick={(e) => onDelete(idx, e)}
                                className="p-1 hover:bg-white rounded transition-colors text-slate-400 hover:text-red-500"
                            >
                                <Trash className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {type === 'transition' && (
                <Handle
                    type="source"
                    position={Position.Right}
                    id={`transition-${idx}`}
                    className="!w-3 !h-3 !bg-white !border-2 !border-gray-800"
                    style={{ right: -28, zIndex: 20 }}
                />
            )}
        </div>
    );
};

export const ExtractVariableNode = memo(({ id, data }: NodeProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const [editingVarIndex, setEditingVarIndex] = useState<number | null>(null);
    const [editingTransIndex, setEditingTransIndex] = useState<number | null>(null);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editValue, setEditValue] = useState("");
    const [titleValue, setTitleValue] = useState(data?.title || "Extract Variables");

    const nodeActions = useContext(NodeActionsContext);
    const { setNodes } = useReactFlow();
    const titleInputRef = useRef<HTMLInputElement>(null);

    const variables = data?.variables || ["name"];
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

    const addVariable = (e: React.MouseEvent) => {
        e.stopPropagation();
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            variables: [...(node.data.variables || []), "new_variable"],
                        },
                    };
                }
                return node;
            })
        );
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
                            transitions: [...(node.data.transitions || []), "Describe the transition condition"],
                        },
                    };
                }
                return node;
            })
        );
    };

    const deleteItem = (type: 'variable' | 'transition', idx: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === id) {
                    const key = type === 'variable' ? 'variables' : 'transitions';
                    const newList = (node.data[key] || []).filter((_: any, i: number) => i !== idx);
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            [key]: newList,
                        },
                    };
                }
                return node;
            })
        );
    };

    const handleEdit = (type: 'variable' | 'transition', idx: number, currentVal: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (type === 'variable') {
            setEditingVarIndex(idx);
        } else {
            setEditingTransIndex(idx);
        }
        setEditValue(currentVal);
    };

    const handleSave = (type: 'variable' | 'transition') => {
        const editingIndex = type === 'variable' ? editingVarIndex : editingTransIndex;
        if (editingIndex === null) return;

        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === id) {
                    const key = type === 'variable' ? 'variables' : 'transitions';
                    const newList = [...(node.data[key] || [])];
                    newList[editingIndex] = editValue;
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            [key]: newList,
                        },
                    };
                }
                return node;
            })
        );
        type === 'variable' ? setEditingVarIndex(null) : setEditingTransIndex(null);
    };

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

    const handleKeyDown = (e: React.KeyboardEvent, type: 'variable' | 'transition' | 'title') => {
        if (e.key === 'Enter') {
            if (type === 'title') handleSaveTitle();
            else handleSave(type);
        } else if (e.key === 'Escape') {
            if (type === 'title') setIsEditingTitle(false);
            else type === 'variable' ? setEditingVarIndex(null) : setEditingTransIndex(null);
        }
    };

    const handleDragEnd = (event: DragEndEvent, type: 'variable' | 'transition') => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = parseInt(active.id.toString().split('-')[1]);
            const newIndex = parseInt(over.id.toString().split('-')[1]);
            const key = type === 'variable' ? 'variables' : 'transitions';

            setNodes((nds) =>
                nds.map((node) => {
                    if (node.id === id) {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                [key]: arrayMove(node.data[key] || [], oldIndex, newIndex),
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
            className="relative w-[380px] bg-[#E2E8F0] rounded-[24px] shadow-sm border border-transparent hover:border-slate-300 transition-colors group p-1"
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
                    <Braces className="h-5 w-5 text-slate-600 shrink-0" />
                    {isEditingTitle ? (
                        <input
                            ref={titleInputRef}
                            value={titleValue}
                            onChange={(e) => setTitleValue(e.target.value)}
                            onBlur={handleSaveTitle}
                            onKeyDown={(e) => handleKeyDown(e, 'title')}
                            className="bg-white border border-slate-200 rounded px-1 w-full text-lg font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-slate-400"
                        />
                    ) : (
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-xl font-medium text-slate-800 truncate">
                                {titleValue}
                            </span>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsEditingTitle(true); }}
                                className="opacity-0 group-hover/title:opacity-100 transition-opacity p-0.5"
                            >
                                <Pencil className="h-4 w-4 text-slate-500" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    {isHovered && nodeActions && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="opacity-70 hover:opacity-100 transition-opacity p-1 rounded hover:bg-slate-200 outline-none">
                                    <MoreHorizontal className="h-5 w-5 text-slate-500" />
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
                <div className="bg-white rounded-[18px] p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-3 text-slate-400">
                        <div className="flex items-center gap-2">
                            <List className="h-4 w-4" />
                            <span className="text-sm font-medium text-slate-400">Variables</span>
                        </div>
                        <button onClick={addVariable} className="hover:bg-slate-50 p-1 rounded-md transition-colors">
                            <Plus className="h-5 w-5 text-slate-600" />
                        </button>
                    </div>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(e) => handleDragEnd(e, 'variable')}
                    >
                        <div className="space-y-2 nodrag">
                            <SortableContext
                                items={variables.map((_: any, i: number) => `variable-${i}`)}
                                strategy={verticalListSortingStrategy}
                            >
                                {variables.map((val: string, idx: number) => (
                                    <SortableItem
                                        key={`var-${idx}`}
                                        idx={idx}
                                        value={val}
                                        type="variable"
                                        editingIndex={editingVarIndex}
                                        editValue={editValue}
                                        setEditValue={setEditValue}
                                        onSave={() => handleSave('variable')}
                                        onKeyDown={handleKeyDown}
                                        onEdit={(idx: number, val: string, e: any) => handleEdit('variable', idx, val, e)}
                                        onDelete={(idx: number, e: any) => deleteItem('variable', idx, e)}
                                        icon={Braces}
                                    />
                                ))}
                            </SortableContext>
                        </div>
                    </DndContext>
                </div>

                {}
                <div className="bg-white rounded-[18px] p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-3 text-slate-400">
                        <div className="flex items-center gap-2">
                            <Share2 className="h-4 w-4" />
                            <span className="text-sm font-medium text-slate-400">Transition</span>
                        </div>
                        <button onClick={addTransition} className="hover:bg-slate-50 p-1 rounded-md transition-colors">
                            <Plus className="h-5 w-5 text-slate-600" />
                        </button>
                    </div>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(e) => handleDragEnd(e, 'transition')}
                    >
                        <div className="space-y-2 nodrag">
                            <SortableContext
                                items={transitions.map((_: any, i: number) => `transition-${i}`)}
                                strategy={verticalListSortingStrategy}
                            >
                                {transitions.map((val: string, idx: number) => (
                                    <SortableItem
                                        key={`trans-${idx}`}
                                        idx={idx}
                                        value={val}
                                        type="transition"
                                        editingIndex={editingTransIndex}
                                        editValue={editValue}
                                        setEditValue={setEditValue}
                                        onSave={() => handleSave('transition')}
                                        onKeyDown={handleKeyDown}
                                        onEdit={(idx: number, val: string, e: any) => handleEdit('transition', idx, val, e)}
                                        onDelete={(idx: number, e: any) => deleteItem('transition', idx, e)}
                                        icon={Sparkles}
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

ExtractVariableNode.displayName = "ExtractVariableNode";
