
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Hexagon } from 'lucide-react';

export const BeginNode = memo(({ data }: NodeProps) => {
    return (
        <div className="relative px-5 py-2.5 bg-[#8B5CF6] rounded-full shadow-lg flex items-center gap-3 border-2 border-[#7C3AED] hover:shadow-indigo-200/50 transition-shadow group">
            <div className="text-white shrink-0 relative flex items-center justify-center">
                <Hexagon className="h-6 w-6" strokeWidth={2.5} />
                <div className="absolute w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            </div>
            <span className="text-xl font-bold text-white pr-1 tracking-tight">
                Begin
            </span>

            <Handle
                type="source"
                position={Position.Right}
                className="!w-4 !h-4 !bg-white !border-2 !border-gray-800 hover:!scale-110 transition-transform"
                style={{ right: -8, zIndex: 20 }}
            />
        </div>
    );
});

BeginNode.displayName = "BeginNode";
