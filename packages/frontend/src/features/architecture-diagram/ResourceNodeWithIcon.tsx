import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';

import { getIconComponent } from './ResourceIcons';
import { RESOURCE_COLORS, type ResourceType } from './types';

const HANDLE_CLASS = '!h-2 !w-2 !border-2 !border-slate-500 !bg-slate-700';

export function ResourceNodeWithIcon(props: NodeProps) {
  const data = props.data as { label?: string; resourceType?: ResourceType; description?: string };
  const resourceType: ResourceType = data?.resourceType ?? 'service';
  const color = RESOURCE_COLORS[resourceType] ?? RESOURCE_COLORS.service;
  const IconComponent = getIconComponent(resourceType);
  const label = data?.label || 'Recurso';
  const description =
    data?.description && data.description.trim().toLowerCase() !== label.trim().toLowerCase()
      ? data.description
      : undefined;

  return (
    <div
      className="flex w-[120px] flex-col items-center gap-1.5"
      title={description ? `${label} — ${description}` : label}
    >
      <Handle type="target" position={Position.Left} className={HANDLE_CLASS} />

      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border transition-shadow [&_svg]:h-5 [&_svg]:w-5 ${
          props.selected ? 'ring-2 ring-signal ring-offset-2 ring-offset-canvas' : ''
        }`}
        style={{ backgroundColor: `${color}1a`, borderColor: `${color}66`, color }}
      >
        <IconComponent />
      </div>

      <div className="w-full rounded bg-canvas/85 px-1 py-0.5 text-center">
        <p className="line-clamp-2 break-words font-mono text-[11px] font-medium leading-[1.15] text-slate-200">
          {label}
        </p>
        {description && (
          <p className="mt-0.5 truncate text-[10px] text-slate-500">{description}</p>
        )}
      </div>

      <Handle type="source" position={Position.Right} className={HANDLE_CLASS} />
    </div>
  );
}
