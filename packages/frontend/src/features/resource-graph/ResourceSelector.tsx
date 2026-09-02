import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAllServers } from '../servers/use-servers';
import { useAllApplications } from '../applications/use-applications';
import { useAllDatabases } from '../databases/use-databases';
import { useAllUrls } from '../urls/use-urls';
import type { ResourceType } from './AddRelationshipDialog';
import { Spinner } from '../../shared/components/Spinner';

interface ResourceOption {
  id: string;
  label: string;
}

export interface ResourceSelectorProps {
  resourceType: ResourceType;
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

function getResourceLabel(resource: any, type: ResourceType): string {
  switch (type) {
    case 'server':
      return resource.displayName || resource.hostname;
    case 'application':
      return resource.displayName || resource.code || resource.id.substring(0, 8);
    case 'database':
      return resource.displayName || resource.name || resource.id.substring(0, 8);
    case 'url':
      return resource.label || resource.url || resource.id.substring(0, 8);
    default:
      return resource.id.substring(0, 8);
  }
}

interface PanelPosition {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
}

// Rough height budget (search box + a handful of result rows) used only to
// decide whether the panel should flip upward — the actual upward placement
// anchors to the trigger's own top edge (via `bottom`) so it grows naturally
// without needing an exact height.
const ESTIMATED_PANEL_HEIGHT = 260;
const VIEWPORT_MARGIN = 8;

export function ResourceSelector({
  resourceType,
  value,
  onChange,
  placeholder = 'Buscar...',
  disabled = false,
}: ResourceSelectorProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState<PanelPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Buscar recursos por tipo
  const servers = useAllServers();
  const applications = useAllApplications();
  const databases = useAllDatabases();
  const urls = useAllUrls();

  // Coletar dados conforme o tipo
  const resources = useMemo(() => {
    switch (resourceType) {
      case 'server':
        return servers.data ?? [];
      case 'application':
        return applications.data ?? [];
      case 'database':
        return databases.data ?? [];
      case 'url':
        return urls.data ?? [];
      default:
        return [];
    }
  }, [resourceType, servers.data, applications.data, databases.data, urls.data]);

  // Filtrar por busca
  const filteredOptions = useMemo<ResourceOption[]>(() => {
    if (!search.trim()) return resources.map((r: any) => ({ id: r.id, label: getResourceLabel(r, resourceType) }));

    const term = search.toLowerCase();
    return resources
      .map((r: any) => ({ id: r.id, label: getResourceLabel(r, resourceType) }))
      .filter((opt) => opt.label.toLowerCase().includes(term));
  }, [search, resources, resourceType]);

  // Selecionar opção
  const handleSelect = useCallback(
    (id: string) => {
      onChange(id);
      setIsOpen(false);
      setSearch('');
    },
    [onChange],
  );

  // Obter label da seleção atual
  const selectedLabel = useMemo(() => {
    const selected = filteredOptions.find((opt) => opt.id === value);
    return selected?.label || value.substring(0, 8);
  }, [value, filteredOptions]);

  const isLoading = servers.isLoading || applications.isLoading || databases.isLoading || urls.isLoading;

  // Places the results panel via a portal instead of a plain `absolute`
  // child. The old absolute-positioned panel was clipped by (and stacked
  // on top of content within) whatever scrollable ancestor it sat in — for
  // this selector that's a Modal's `overflow-y-auto` body, so when it was
  // used as the *last* field before a dialog's footer buttons, the open
  // panel had nowhere to go but directly on top of Cancelar/Confirmar.
  // Positioning `fixed` from the trigger's real screen coordinates, and
  // flipping upward when there isn't room below, fixes both the clipping
  // and the overlap.
  const positionPanel = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUp = spaceBelow < ESTIMATED_PANEL_HEIGHT && spaceAbove > spaceBelow;
    const left = Math.min(
      Math.max(VIEWPORT_MARGIN, rect.left),
      Math.max(VIEWPORT_MARGIN, window.innerWidth - rect.width - VIEWPORT_MARGIN),
    );

    setPanelPosition(
      openUp
        ? { left, width: rect.width, bottom: window.innerHeight - rect.top + 4 }
        : { left, width: rect.width, top: rect.bottom + 4 },
    );
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    positionPanel();

    function handleReposition(): void {
      positionPanel();
    }

    function handleOutsideClick(event: MouseEvent): void {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setIsOpen(false);
    }

    // capture: true so this also catches scrolling inside a modal's own
    // overflow-y-auto body, not just the window scrolling.
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, positionPanel]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled || isLoading}
        onClick={() => setIsOpen((open) => !open)}
        className="w-full rounded border border-line bg-canvas px-3 py-2 text-left text-slate-100 outline-none focus:border-slate-500 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-between"
      >
        <span className="truncate">{isLoading ? 'Carregando...' : selectedLabel || placeholder}</span>
        <span className="text-slate-500">▼</span>
      </button>

      {isOpen &&
        !disabled &&
        panelPosition &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: 'fixed',
              left: panelPosition.left,
              width: panelPosition.width,
              top: panelPosition.top,
              bottom: panelPosition.bottom,
            }}
            className="z-[60] rounded border border-line bg-canvas shadow-2xl ring-1 ring-white/10"
          >
            <div className="p-2 border-b border-line">
              <input
                type="text"
                placeholder={placeholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="w-full rounded px-2 py-1 border border-line bg-surface text-sm text-slate-100 outline-none focus:border-slate-500"
              />
            </div>

            <div className="max-h-48 overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Spinner />
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-slate-400">
                  {search ? 'Nenhum resultado encontrado' : 'Nenhum recurso disponível'}
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelect(option.id)}
                    className={`w-full px-3 py-2 text-left text-sm text-slate-100 hover:bg-surface-raised ${
                      value === option.id ? 'bg-surface-raised border-l-2 border-signal' : ''
                    }`}
                  >
                    {option.label}
                    <span className="ml-2 text-xs text-slate-500">{option.id.substring(0, 8)}</span>
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
