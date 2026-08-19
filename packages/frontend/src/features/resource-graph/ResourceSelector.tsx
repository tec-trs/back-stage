import { useCallback, useMemo, useState } from 'react';
import { useServers } from '../servers/use-servers';
import { useApplications } from '../applications/use-applications';
import { useDatabases } from '../databases/use-databases';
import { useUrls } from '../urls/use-urls';
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
      return resource.name || resource.id.substring(0, 8);
    case 'database':
      return resource.name || resource.id.substring(0, 8);
    case 'url':
      return resource.label || resource.url || resource.id.substring(0, 8);
    default:
      return resource.id.substring(0, 8);
  }
}

export function ResourceSelector({
  resourceType,
  value,
  onChange,
  placeholder = 'Buscar...',
  disabled = false,
}: ResourceSelectorProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Buscar recursos por tipo
  const servers = useServers();
  const applications = useApplications();
  const databases = useDatabases();
  const urls = useUrls();

  // Coletar dados conforme o tipo
  const resources = useMemo(() => {
    switch (resourceType) {
      case 'server':
        return servers.data?.items ?? [];
      case 'application':
        return applications.data?.items ?? [];
      case 'database':
        return databases.data?.items ?? [];
      case 'url':
        return urls.data?.items ?? [];
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

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled || isLoading}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-left text-slate-100 outline-none focus:border-slate-500 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-between"
      >
        <span className="truncate">{isLoading ? 'Carregando...' : selectedLabel || placeholder}</span>
        <span className="text-slate-500">▼</span>
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border border-slate-700 bg-slate-950 shadow-lg">
          <div className="p-2 border-b border-slate-800">
            <input
              type="text"
              placeholder={placeholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full rounded px-2 py-1 border border-slate-700 bg-slate-900 text-sm text-slate-100 outline-none focus:border-slate-500"
            />
          </div>

          <div className="max-h-48 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Spinner />
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-slate-500">
                {search ? 'Nenhum resultado encontrado' : 'Nenhum recurso disponível'}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option.id)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-800 ${
                    value === option.id ? 'bg-slate-800 border-l-2 border-sky-400' : ''
                  }`}
                >
                  {option.label}
                  <span className="ml-2 text-xs text-slate-600">{option.id.substring(0, 8)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
