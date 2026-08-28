import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { getIconComponent } from './ResourceIcons';

const shapeClasses: Record<string, string> = {
  url: 'rounded-full',
  application: 'rounded-lg',
  service: 'rounded',
  database: 'rounded-sm',
  server: 'rounded-md',
};

const colors: Record<string, { bg: string; text: string }> = {
  url: { bg: '#fbbf24', text: '#000' },
  application: { bg: '#a78bfa', text: '#fff' },
  service: { bg: '#60a5fa', text: '#fff' },
  database: { bg: '#f472b6', text: '#fff' },
  server: { bg: '#34d399', text: '#000' },
};

export function ResourceNodeWithIcon(props: NodeProps) {
  const data = props.data as any;
  const resourceType = data?.resourceType || 'service';
  const color = colors[resourceType] || colors.service;
  const IconComponent = getIconComponent(resourceType);

  return (
    <div
      className={`
        px-3 py-2 shadow-lg border-2 transition-all flex flex-col items-center gap-1
        ${(shapeClasses as any)[resourceType] || 'rounded'}
        ${props.selected ? 'border-sky-400 shadow-sky-500/50' : 'border-opacity-50'}
      `}
      style={{
        backgroundColor: color.bg,
        borderColor: color.bg,
        minWidth: '100px',
      }}
    >
      <Handle type="target" position={Position.Top} />

      <div style={{ color: color.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IconComponent />
      </div>

      <div
        className="text-center font-semibold text-xs"
        style={{ color: color.text, maxWidth: '90px' }}
      >
        <div className="truncate">{data?.label || 'Node'}</div>
        {data?.description && (
          <div style={{ opacity: 0.7, fontSize: '10px', marginTop: '2px' }} className="truncate">
            {data.description}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
