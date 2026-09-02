import { useNavigate, useParams } from 'react-router-dom';

import { ImpactAnalysisPanel } from '../features/resource-graph/ImpactAnalysisPanel';
import { ChevronLeftIcon } from '../shared/components/icons';

type ResourceType = 'server' | 'application' | 'database' | 'url';

const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  server: 'Servidor',
  application: 'Aplicacao',
  database: 'Banco de Dados',
  url: 'URL',
};

const RESOURCE_TYPE_PATHS: Record<ResourceType, string> = {
  server: 'servers',
  application: 'applications',
  database: 'databases',
  url: 'urls',
};

const VALID_TYPES: ResourceType[] = ['server', 'application', 'database', 'url'];

export function ImpactPage() {
  const { resourceType, resourceId } = useParams<{
    resourceType: string;
    resourceId: string;
  }>();
  const navigate = useNavigate();

  if (!resourceType || !VALID_TYPES.includes(resourceType as ResourceType) || !resourceId) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-slate-500">
        <p>Tipo de recurso invalido.</p>
        <button
          onClick={() => navigate('/inventory')}
          className="text-sm text-signal hover:underline"
        >
          Ir para Inventario
        </button>
      </div>
    );
  }

  const type = resourceType as ResourceType;
  const backPath = `/${RESOURCE_TYPE_PATHS[type]}/${resourceId}`;

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={() => navigate(backPath)}
        className="flex w-fit items-center gap-2 text-sm text-slate-400 hover:text-slate-200 hover:underline"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Voltar ao detalhe do {RESOURCE_TYPE_LABELS[type]}
      </button>

      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Analise de Impacto</h1>
        <p className="mt-1 text-sm text-slate-400">
          Simule o impacto de desligar este {RESOURCE_TYPE_LABELS[type]} sobre outros recursos do
          inventario.
        </p>
      </div>

      <ImpactAnalysisPanel
        resourceType={type}
        resourceId={resourceId}
        resourceLabel={`${RESOURCE_TYPE_LABELS[type]} (${resourceId.slice(0, 8)}...)`}
      />
    </div>
  );
}
