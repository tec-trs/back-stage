import { useState } from 'react';
import { Button } from '../../shared/components/Button';
import { Modal } from '../../shared/components/Modal';
import { useUrls } from '../urls/use-urls';
import { useApplications } from '../applications/use-applications';
import { useServers } from '../servers/use-servers';
import { useDatabases } from '../databases/use-databases';
import { useServices } from '../services/use-services';
import type { ResourceType } from './types';
import { RESOURCE_LABELS } from './types';

interface ToolBarWithDataProps {
  onAddNode: (type: ResourceType, label: string, description?: string, resourceId?: string) => void;
  onClear: () => void;
  onExport: () => void;
  onImport: () => void;
  onSaveToDatabase: () => void;
  onLoadFromDatabase: () => void;
  onExportImage: () => void;
}

export function ToolBarWithData({
  onAddNode,
  onClear,
  onExport,
  onImport,
  onSaveToDatabase,
  onLoadFromDatabase,
  onExportImage,
}: ToolBarWithDataProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ResourceType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: urlsData, isLoading: urlsLoading, error: urlsError } = useUrls({ page: 1, pageSize: 1000 });
  const { data: appsData, isLoading: appsLoading, error: appsError } = useApplications();
  const { data: serversData, isLoading: serversLoading, error: serversError } = useServers();
  const { data: databasesData, isLoading: dbsLoading, error: dbsError } = useDatabases();
  const { data: servicesData, isLoading: svcLoading, error: svcError } = useServices();

  // Extrair arrays corretamente de cada hook
  const urls = Array.isArray(urlsData?.items) ? urlsData.items : Array.isArray(urlsData) ? urlsData : [];
  const apps = Array.isArray(appsData?.items) ? appsData.items : Array.isArray(appsData) ? appsData : [];
  const servers = Array.isArray(serversData?.items) ? serversData.items : Array.isArray(serversData) ? serversData : [];
  const databases = Array.isArray(databasesData?.items) ? databasesData.items : Array.isArray(databasesData) ? databasesData : [];
  const services = Array.isArray(servicesData?.items) ? servicesData.items : Array.isArray(servicesData) ? servicesData : [];

  const isLoading = urlsLoading || appsLoading || serversLoading || dbsLoading || svcLoading;

  // Debug
  console.log('ToolBar Data:', {
    urls: urls.length,
    apps: apps.length,
    servers: servers.length,
    databases: databases.length,
    services: services.length,
    urlsError,
    appsError,
    serversError,
    dbsError,
    svcError,
  });

  const types: ResourceType[] = ['url', 'application', 'service', 'database', 'server'];

  const getResourceList = () => {
    const term = searchTerm.toLowerCase();
    switch (selectedType) {
      case 'url':
        return urls.filter((u: any) => u.label?.toLowerCase().includes(term));
      case 'application':
        return apps.filter((a: any) => a.label?.toLowerCase().includes(term));
      case 'service':
        return services.filter((s: any) => s.label?.toLowerCase().includes(term));
      case 'database':
        return databases.filter((d: any) => d.label?.toLowerCase().includes(term));
      case 'server':
        return servers.filter((s: any) => s.label?.toLowerCase().includes(term));
      default:
        return [];
    }
  };

  const handleSelectResource = (resource: any) => {
    if (!selectedType) return;
    onAddNode(
      selectedType,
      resource.label || resource.name,
      resource.description || resource.url || resource.hostname,
      resource.id
    );
    setSearchTerm('');
    setSelectedType(null);
    setIsOpen(false);
  };

  const resourceList = getResourceList();

  return (
    <>
      <div className="flex gap-2 p-4 bg-surface border-b border-line flex-wrap">
        <Button size="sm" onClick={() => setIsOpen(true)}>
          + Adicionar Nó
        </Button>

        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={onSaveToDatabase}>
            💾 Salvar
          </Button>
          <Button size="sm" variant="secondary" onClick={onLoadFromDatabase}>
            📂 Carregar
          </Button>
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={onExportImage}>
            📸 Exportar Imagem
          </Button>
          <Button size="sm" variant="secondary" onClick={onExport}>
            📥 Exportar JSON
          </Button>
          <Button size="sm" variant="secondary" onClick={onImport}>
            📤 Importar JSON
          </Button>
        </div>

        <Button size="sm" variant="secondary" onClick={onClear}>
          🗑️ Limpar
        </Button>
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Adicionar Nó" size="lg">
        <div className="space-y-4 p-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Tipo de Recurso</label>
            <div className="grid grid-cols-3 gap-2">
              {types.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedType(type);
                    setSearchTerm('');
                  }}
                  className={`px-3 py-2 rounded text-sm transition ${
                    selectedType === type
                      ? 'bg-signal text-[#1a1204]'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {RESOURCE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {selectedType && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Buscar {RESOURCE_LABELS[selectedType]}
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={`Pesquise por ${RESOURCE_LABELS[selectedType].toLowerCase()}...`}
                  className="w-full px-3 py-2 bg-surface-raised border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-signal"
                />
              </div>

              <div className="bg-surface-raised p-2 rounded text-xs text-slate-400 mb-2">
                📊 Total disponível: {selectedType === 'url' ? urls.length : selectedType === 'application' ? apps.length : selectedType === 'service' ? services.length : selectedType === 'database' ? databases.length : selectedType === 'server' ? servers.length : 0}
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1">
                {isLoading ? (
                  <div className="text-center py-6 text-slate-400">
                    ⏳ Carregando recursos...
                  </div>
                ) : resourceList.length > 0 ? (
                  resourceList.map((resource: any) => (
                    <button
                      key={resource.id}
                      onClick={() => handleSelectResource(resource)}
                      className="w-full text-left px-3 py-2 rounded bg-surface-raised text-slate-100 hover:bg-slate-700 transition flex flex-col"
                    >
                      <span className="font-semibold">{resource.label || resource.name}</span>
                      {(resource.url || resource.hostname || resource.description) && (
                        <span className="text-xs text-slate-400">
                          {resource.url || resource.hostname || resource.description}
                        </span>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-400 space-y-2">
                    <div>❌ Nenhum recurso encontrado</div>
                    <div className="text-xs">
                      Pesquisa: "{searchTerm}"
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex gap-2 justify-end pt-4 border-t border-line">
            <Button variant="secondary" size="sm" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
