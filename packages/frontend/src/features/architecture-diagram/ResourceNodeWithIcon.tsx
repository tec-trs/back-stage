import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';

import { getIconComponent } from './ResourceIcons';
import { MAX_VISIBLE_NODE_SERVICES, type NodeServiceSummary } from './nodeSizing';
import { RESOURCE_COLORS, type ResourceType } from './types';

const HANDLE_CLASS = '!h-2 !w-2 !border-2 !border-slate-500 !bg-slate-700';

export function ResourceNodeWithIcon(props: NodeProps) {
  const data = props.data as {
    label?: string;
    resourceType?: ResourceType;
    description?: string;
    services?: NodeServiceSummary[];
  };
  const resourceType: ResourceType = data?.resourceType ?? 'service';
  const color = RESOURCE_COLORS[resourceType] ?? RESOURCE_COLORS.service;
  const IconComponent = getIconComponent(resourceType);
  const label = data?.label || 'Recurso';
  const description =
    data?.description && data.description.trim().toLowerCase() !== label.trim().toLowerCase()
      ? data.description
      : undefined;

  const services = resourceType === 'server' ? data?.services ?? [] : [];
  const visibleServices = services.slice(0, MAX_VISIBLE_NODE_SERVICES);
  const hiddenServiceCount = services.length - visibleServices.length;

  return (
    <div
      className={`flex flex-col items-center gap-1.5 ${services.length > 0 ? 'w-[176px]' : 'w-[120px]'}`}
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

      {services.length > 0 && (
        <div
          className="w-full rounded-md border border-dashed px-1.5 py-1.5"
          style={{ borderColor: `${color}55`, backgroundColor: `${color}0d` }}
        >
          <div className="flex flex-col gap-1">
            {visibleServices.map((svc, i) => (
              <div
                key={`${svc.name}-${i}`}
                className="flex items-center gap-1 rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] text-slate-300"
                title={`${svc.name} — ${svc.status === 'active' ? 'ativo' : 'inativo'}`}
              >
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${svc.status === 'active' ? 'bg-emerald-400' : 'bg-slate-500'}`}
                />
                <span className="truncate font-mono">{svc.name}</span>
              </div>
            ))}
            {hiddenServiceCount > 0 && (
              <div className="text-center text-[9px] text-slate-500">
                +{hiddenServiceCount} serviço{hiddenServiceCount > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      )}

      <Handle type="source" position={Position.Right} className={HANDLE_CLASS} />
    </div>
  );
}
