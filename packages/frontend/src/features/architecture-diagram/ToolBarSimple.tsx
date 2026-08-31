import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '../../shared/components/Button';
import {
  ChevronLeftIcon,
  DownloadIcon,
  LayersIcon,
  PlusIcon,
  TrashIcon,
  UploadIcon,
} from '../../shared/components/icons';
import { useApplications } from '../applications/use-applications';
import { useDatabaseGroups } from '../database-groups/use-database-groups';
import { useDatabases } from '../databases/use-databases';
import { useServers } from '../servers/use-servers';
import { useServices } from '../services/use-services';
import { useUrls } from '../urls/use-urls';

import type { NodeServiceSummary } from './nodeSizing';
import { RESOURCE_LABELS, type ResourceType } from './types';

interface ToolBarSimpleProps {
  onAddNode: (
    type: ResourceType,
    label: string,
    description?: string,
    resourceId?: string,
    services?: NodeServiceSummary[],
  ) => void;
  onClear: () => void;
  onExport: () => void;
  onImport: () => void;
  onOrganize: () => void;
  onSaveToDatabase: () => void;
  onLoadFromDatabase: () => void;
  onExportImage: () => void;
}

const SELECT_CLASS =
  'rounded-md border border-line bg-surface px-3 py-2 text-sm text-slate-100 cursor-pointer ' +
  'focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-signal/50';

export function ToolBarSimple({
  onAddNode,
  onClear,
  onExport,
  onImport,
  onOrganize,
  onSaveToDatabase,
  onLoadFromDatabase,
  onExportImage,
}: ToolBarSimpleProps) {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<ResourceType | null>(null);
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [isResourceDropdownOpen, setIsResourceDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsResourceDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: urlsData } = useUrls({ page: 1, pageSize: 100 });
  const { data: appsData } = useApplications();
  const { data: serversData } = useServers();
  const { data: databasesData } = useDatabases();
  const { data: servicesData } = useServices();
  const { data: databaseGroupsData } = useDatabaseGroups();

  const urls = Array.isArray(urlsData?.items) ? urlsData.items : [];
  const apps = Array.isArray(appsData?.items) ? appsData.items : [];
  const servers = Array.isArray(serversData?.items) ? serversData.items : [];
  const databases = Array.isArray(databasesData?.items) ? databasesData.items : [];
  const services = Array.isArray(servicesData?.items) ? servicesData.items : [];
  // Agrupadores de Bancos — um "db-group" aqui é um nó puramente visual
  // (assim como 'service'/'vip' já são): não vira um resource_relationships
  // real ao ser conectado a outro nó, só documenta que este agrupador
  // participa do diagrama.
  const databaseGroups = Array.isArray(databaseGroupsData) ? databaseGroupsData : [];

  const getResourceList = () => {
    switch (selectedType) {
      case 'url':
        return urls;
      case 'application':
        return apps;
      case 'service':
        return services;
      case 'database':
        return databases;
      case 'server':
        return servers;
      case 'db-group':
        return databaseGroups;
      default:
        return [];
    }
  };

  const handleAddNode = () => {
    if (!selectedType || !selectedResourceId) return;

    const list = getResourceList();
    const resource = list.find((r: any) => r.id === selectedResourceId) as any;

    if (resource) {
      const label = resource.label || resource.name || resource.displayName || resource.hostname || '';
      const rawSubtitle = resource.description || resource.url || resource.hostname || '';
      // Skip the subtitle entirely when it's just the label repeated (e.g. a
      // server whose hostname is also its label) — a duplicated line under
      // the icon reads as a bug, not as extra information.
      const subtitle = rawSubtitle && rawSubtitle.trim().toLowerCase() !== label.trim().toLowerCase()
        ? rawSubtitle
        : undefined;
      // Servers carry their registered services (servers.services) — pass them
      // along so the node renders the same nested-services box the live graph
      // and the Mapas graph show for the same server.
      const services: NodeServiceSummary[] | undefined =
        selectedType === 'server' ? (resource.services as NodeServiceSummary[] | undefined) : undefined;
      onAddNode(selectedType, label, subtitle, resource.id, services);
      setSelectedResourceId('');
    }
  };

  const resourceList = getResourceList();

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface p-3">
      <select
        value={selectedType || ''}
        onChange={(e) => {
          setSelectedType((e.target.value as ResourceType) || null);
          setSelectedResourceId('');
        }}
        className={SELECT_CLASS}
      >
        <option value="">-- Selecione tipo --</option>
        {(Object.entries(RESOURCE_LABELS) as Array<[ResourceType, string]>).map(([type, label]) => (
          <option key={type} value={type}>
            {label}
          </option>
        ))}
      </select>

      {selectedType && (
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsResourceDropdownOpen(!isResourceDropdownOpen)}
            className={`${SELECT_CLASS} flex w-52 items-center justify-between gap-2 text-left`}
          >
            <span className="truncate">
              {selectedResourceId
                ? (() => {
                    const selected = resourceList.find((r: any) => r.id === selectedResourceId) as any;
                    return (
                      selected?.label ||
                      selected?.name ||
                      selected?.displayName ||
                      selected?.hostname ||
                      'Selecione'
                    );
                  })()
                : '-- Selecione recurso --'}
            </span>
            <span className="shrink-0 text-xs text-slate-500">▾</span>
          </button>

          {isResourceDropdownOpen && (
            <div className="absolute top-full left-0 z-50 mt-1 max-h-48 w-52 overflow-y-auto rounded-md border border-line bg-surface-raised shadow-xl">
              <div
                className="cursor-pointer px-3 py-2 text-sm text-slate-400 hover:bg-slate-800"
                onClick={() => {
                  setSelectedResourceId('');
                  setIsResourceDropdownOpen(false);
                }}
              >
                -- Selecione recurso --
              </div>

              {resourceList.length > 0 ? (
                resourceList.map((resource: any) => (
                  <div
                    key={resource.id}
                    className={`cursor-pointer px-3 py-2 text-sm ${
                      selectedResourceId === resource.id
                        ? 'bg-signal/20 text-slate-100'
                        : 'text-slate-200 hover:bg-slate-800'
                    }`}
                    onClick={() => {
                      setSelectedResourceId(resource.id);
                      setIsResourceDropdownOpen(false);
                    }}
                  >
                    {resource.label || resource.name || resource.displayName || resource.hostname}
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-slate-500">Nenhum recurso encontrado</div>
              )}
            </div>
          )}
        </div>
      )}

      {selectedResourceId && (
        <Button size="sm" icon={<PlusIcon />} onClick={handleAddNode}>
          Adicionar
        </Button>
      )}

      <div className="flex-1" />

      <div className="flex gap-2">
        <Button size="sm" variant="secondary" icon={<LayersIcon />} onClick={onOrganize} title="Organiza o layout automaticamente">
          Organizar
        </Button>
        <Button size="sm" variant="secondary" onClick={onSaveToDatabase}>
          Salvar
        </Button>
        <Button size="sm" variant="secondary" onClick={onLoadFromDatabase}>
          Carregar
        </Button>
        <Button size="sm" variant="secondary" onClick={onExportImage}>
          Imagem
        </Button>
        <Button size="sm" variant="secondary" icon={<DownloadIcon />} onClick={onExport}>
          JSON
        </Button>
        <Button size="sm" variant="secondary" icon={<UploadIcon />} onClick={onImport}>
          Importar
        </Button>
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="ghost-danger" icon={<TrashIcon />} onClick={onClear}>
          Limpar
        </Button>
        <Button size="sm" variant="ghost" icon={<ChevronLeftIcon />} onClick={() => navigate('/infrastructure')}>
          Voltar
        </Button>
      </div>
    </div>
  );
}
