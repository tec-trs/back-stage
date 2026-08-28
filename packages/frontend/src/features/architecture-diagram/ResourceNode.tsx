import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { RESOURCE_COLORS } from './types';

const shapeClasses: Record<string, string> = {
  url: 'rounded-full',
  application: 'rounded-lg',
  service: 'rounded',
  database: 'rounded-sm',
  server: 'rounded-md',
};

export function ResourceNode(props: NodeProps) {
  const data = props.data as any;
  const bgColor = (RESOURCE_COLORS as any)[data?.resourceType] || '#60a5fa';
  const isDark = ['fbbf24', '34d399'].includes(bgColor.slice(1));
  const resourceType = data?.resourceType || 'service';

  return (
    <div
      className={`
        px-4 py-3 shadow-lg border-2 transition-all
        ${(shapeClasses as any)[resourceType] || 'rounded'}
        ${props.selected ? 'border-sky-400 shadow-sky-500/50' : 'border-opacity-50'}
        opacity-100
      `}
      style={{
        backgroundColor: bgColor,
        borderColor: bgColor,
      }}
    >
      <Handle type="target" position={Position.Top} />

      <div className={`text-center font-semibold text-xs ${isDark ? 'text-slate-900' : 'text-white'}`}>
        <div className="truncate max-w-[120px]">{data?.label || 'Node'}</div>
        {data?.description && (
          <div className={`text-xs opacity-75 truncate max-w-[120px] ${isDark ? 'text-slate-700' : 'text-slate-100'}`}>
            {data.description}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
