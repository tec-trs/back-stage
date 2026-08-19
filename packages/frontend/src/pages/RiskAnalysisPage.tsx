import { useNavigate } from 'react-router-dom';

import { useCriticalResources } from '../features/resource-graph/use-resource-graph';
import { Badge } from '../shared/components/Badge';
import { Button } from '../shared/components/Button';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { PageHeader } from '../shared/components/PageHeader';
import { Spinner } from '../shared/components/Spinner';

type ResourceType = 'server' | 'application' | 'database' | 'url';

const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  server: 'Servidor',
  application: 'Aplicação',
  database: 'Banco de Dados',
  url: 'URL',
};

const CRITICALITY_COLORS: Record<string, { bg: string; text: string }> = {
  critical: { bg: 'bg-red-900/40', text: 'text-red-400' },
  high: { bg: 'bg-orange-900/40', text: 'text-orange-400' },
  medium: { bg: 'bg-amber-900/40', text: 'text-amber-400' },
  low: { bg: 'bg-slate-800', text: 'text-slate-400' },
};

export function RiskAnalysisPage() {
  const navigate = useNavigate();
  const { data: critical, isLoading, isError, error } = useCriticalResources();

  if (isError) {
    return (
      <>
        <PageHeader
          title="Análise de Risco"
          description="Recursos críticos que afetam mais dependentes se caírem"
        />
        <ErrorMessage
          message={error instanceof Error ? error.message : 'Erro ao carregar recursos críticos'}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Análise de Risco"
        description="Recursos críticos que afetam mais dependentes se caírem"
      />

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : !critical || critical.length === 0 ? (
        <div className="rounded-lg border border-slate-800 p-8 text-center">
          <p className="text-slate-400">Nenhum recurso crítico encontrado</p>
          <p className="mt-2 text-sm text-slate-500">
            Todos os recursos têm zero dependentes
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium w-12">#</th>
                <th className="px-4 py-3 font-medium">Recurso</th>
                <th className="px-4 py-3 font-medium">Ambiente</th>
                <th className="px-4 py-3 font-medium">Criticidade</th>
                <th className="px-4 py-3 font-medium text-right">Diretos</th>
                <th className="px-4 py-3 font-medium text-right">Total Afetado</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {critical.map((resource, index) => {
                const criticColor =
                  CRITICALITY_COLORS[resource.criticality as string] ||
                  CRITICALITY_COLORS.low;

                return (
                  <tr
                    key={`${resource.resourceType}:${resource.resourceId}`}
                    className="border-t border-slate-800 hover:bg-slate-800/30"
                  >
                    <td className="px-4 py-3 text-slate-500 font-mono">
                      {String(index + 1).padStart(2, '0')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Badge tone="default" className="text-xs capitalize">
                          {resource.resourceType}
                        </Badge>
                        <button
                          onClick={() =>
                            navigate(
                              `/${resource.resourceType === 'url' ? 'urls' : resource.resourceType + 's'}/${resource.resourceId}`,
                            )
                          }
                          className="text-sky-400 hover:underline font-medium"
                        >
                          {resource.label}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {resource.environment ? (
                        <Badge tone="default" className="text-xs capitalize">
                          {resource.environment}
                        </Badge>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {resource.criticality ? (
                        <Badge
                          tone="default"
                          className={`text-xs capitalize ${criticColor.bg} ${criticColor.text}`}
                        >
                          {resource.criticality}
                        </Badge>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-orange-400">
                        {resource.directDependents}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-red-400 text-base">
                        {resource.totalImpacted}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          navigate(
                            `/impact/${resource.resourceType}/${resource.resourceId}`,
                          )
                        }
                      >
                        Simular
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
        <h3 className="font-semibold text-slate-200">ℹ️ Sobre esta análise</h3>
        <p className="mt-2 text-sm text-slate-400">
          Cada recurso é ranqueado por "impacto total": quantos outros recursos seriam
          afetados se este caísse. "Diretos" são os dependentes imediatos (1 nível);
          "Total" inclui todas as cascatas até 10 níveis de profundidade.
        </p>
        <p className="mt-2 text-sm text-slate-400">
          🚨 <strong>Não presuma que é SPOF real</strong> — redundância, failover automático
          e clustering podem não estar capturados aqui. Use como guia para investigação,
          não como verdade única.
        </p>
      </div>
    </div>
  );
}
