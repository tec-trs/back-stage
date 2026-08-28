import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Button } from '../../shared/components/Button';
import { useUrls } from '../urls/use-urls';
import { useApplications } from '../applications/use-applications';
import { useServers } from '../servers/use-servers';
import { useDatabases } from '../databases/use-databases';
import { useServices } from '../services/use-services';
import type { ResourceType } from './types';

interface ToolBarSimpleProps {
  onAddNode: (type: ResourceType, label: string, description?: string, resourceId?: string) => void;
  onClear: () => void;
  onExport: () => void;
  onImport: () => void;
  onSaveToDatabase: () => void;
  onLoadFromDatabase: () => void;
  onExportImage: () => void;
}

export function ToolBarSimple({
  onAddNode,
  onClear,
  onExport,
  onImport,
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

  const urls = Array.isArray(urlsData?.items) ? urlsData.items : [];
  const apps = Array.isArray(appsData?.items) ? appsData.items : [];
  const servers = Array.isArray(serversData?.items) ? serversData.items : [];
  const databases = Array.isArray(databasesData?.items) ? databasesData.items : [];
  const services = Array.isArray(servicesData?.items) ? servicesData.items : [];

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
      default:
        return [];
    }
  };

  const handleAddNode = () => {
    if (!selectedType || !selectedResourceId) return;

    const list = getResourceList();
    const resource = list.find((r: any) => r.id === selectedResourceId) as any;

    if (resource) {
      onAddNode(
        selectedType,
        resource.label || resource.name || resource.displayName || resource.hostname || '',
        resource.description || resource.url || resource.hostname || '',
        resource.id
      );
      setSelectedResourceId('');
    }
  };

  const resourceList = getResourceList();

  return (
    <div className="flex gap-2 p-4 bg-slate-900 border-b border-slate-700 flex-wrap items-center">
      <select
        value={selectedType || ''}
        onChange={(e) => {
          setSelectedType((e.target.value as ResourceType) || null);
          setSelectedResourceId('');
        }}
        className="px-3 py-2 bg-white text-black text-sm cursor-pointer rounded border border-slate-400"
      >
        <option value="">-- Selecione Tipo --</option>
        <option value="url">🌐 URLs</option>
        <option value="application">📱 Aplicações</option>
        <option value="service">⚙️ Serviços</option>
        <option value="database">🗄️ Bancos de Dados</option>
        <option value="server">🖥️ Servidores</option>
      </select>

      {selectedType && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsResourceDropdownOpen(!isResourceDropdownOpen)}
            className="px-3 py-2 bg-white text-black text-sm cursor-pointer rounded border border-slate-400 w-48 text-left flex justify-between items-center"
          >
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
              : '-- Selecione Recurso --'}
            <span className="text-xs">▼</span>
          </button>

          {isResourceDropdownOpen && (
            <div className="absolute top-full left-0 w-48 mt-1 bg-white border border-slate-400 rounded shadow-lg z-50 max-h-48 overflow-y-auto">
              <div
                className="px-3 py-2 bg-white text-black hover:bg-slate-100 cursor-pointer text-sm"
                onClick={() => {
                  setSelectedResourceId('');
                  setIsResourceDropdownOpen(false);
                }}
              >
                -- Selecione Recurso --
              </div>

              {resourceList.length > 0 ? (
                resourceList.map((resource: any) => (
                  <div
                    key={resource.id}
                    className={`px-3 py-2 text-black cursor-pointer text-sm ${
                      selectedResourceId === resource.id
                        ? 'bg-sky-500 text-white'
                        : 'bg-white hover:bg-slate-100'
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
                <div className="px-3 py-2 bg-white text-slate-500 text-sm">
                  Nenhum recurso encontrado
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {selectedResourceId && (
        <Button size="sm" onClick={handleAddNode}>
          + Adicionar
        </Button>
      )}

      <div className="flex-1" />

      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={onSaveToDatabase}>
          💾 Salvar
        </Button>
        <Button size="sm" variant="secondary" onClick={onLoadFromDatabase}>
          📂 Carregar
        </Button>
        <Button size="sm" variant="secondary" onClick={onExportImage}>
          📸 Imagem
        </Button>
        <Button size="sm" variant="secondary" onClick={onExport}>
          📥 JSON
        </Button>
        <Button size="sm" variant="secondary" onClick={onImport}>
          📤 Importar
        </Button>
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={onClear}>
          🗑️ Limpar
        </Button>
        <Button size="sm" variant="secondary" onClick={() => navigate('/infrastructure')}>
          ← Voltar
        </Button>
      </div>
    </div>
  );
}
