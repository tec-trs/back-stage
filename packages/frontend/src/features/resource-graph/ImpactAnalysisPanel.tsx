import { useState } from 'react';

import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { ErrorMessage } from '../../shared/components/ErrorMessage';
import { Spinner } from '../../shared/components/Spinner';
import { CRITICALITY_LABELS } from '../../shared/constants/labels';

import type { ImpactNode, ImpactResult } from './use-resource-graph';
import { useSimulateImpact } from './use-resource-graph';

type ResourceType = 'server' | 'application' | 'database' | 'url' | 'vip';

const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  server:      'Servidores',
  application: 'Aplicacoes',
  database:    'Bancos de dados',
  url:         'URLs',
  vip:         'VIPs',
};

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  active:       'success',
  maintenance:  'warning',
  provisioning: 'default',
  deactivated:  'danger',
  deprecated:   'warning',
  inactive:     'warning',
  error:        'danger',
};

function ImpactSummary({ result }: { result: ImpactResult }) {
  if (result.totalImpacted === 0) {
    return (
      <div className="rounded-md border border-emerald-900/50 bg-emerald-950/20 p-4 text-center">
        <p className="text-sm font-medium text-emerald-400">Nenhum recurso afetado</p>
        <p className="mt-1 text-xs text-slate-500">
          Este recurso nao possui dependentes diretos ou indiretos.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Resumo por tipo */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(Object.entries(result.byType) as [ResourceType, number][])
          .filter(([, count]) => count > 0)
          .map(([type, count]) => (
            <div
              key={type}
              className="flex flex-col items-center rounded-md border border-slate-800 bg-slate-900/40 p-3"
            >
              <span className="text-2xl font-bold text-amber-400">{count}</span>
              <span className="mt-1 text-center text-xs text-slate-400">
                {RESOURCE_TYPE_LABELS[type]}
              </span>
            </div>
          ))}
      </div>

      {/* Recursos por profundidade */}
      <div className="flex flex-col gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Recursos impactados ({result.totalImpacted} total)
        </h4>
        {(Object.entries(result.byDepth) as [string, ImpactNode[]][])
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([depth, nodes]) => (
            <div key={depth}>
              <p className="mb-1 text-xs text-slate-500">
                Nivel {depth} —{' '}
                {depth === '1' ? 'dependentes diretos' : `${depth} saltos`}
              </p>
              <div className="flex flex-col gap-1">
                {nodes.map((node) => (
                  <div
                    key={`${node.resourceType}:${node.resourceId}`}
                    className="flex items-center gap-3 rounded-md border border-slate-800 bg-slate-900/30 px-3 py-2"
                  >
                    <span className="shrink-0 rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs capitalize text-slate-400">
                      {node.resourceType}
                    </span>
                    <span className="flex-1 truncate text-sm text-slate-100">{node.label}</span>
                    {node.criticality && (
                      <span className="shrink-0 text-xs text-slate-500">
                        {CRITICALITY_LABELS[node.criticality] ?? node.criticality}
                      </span>
                    )}
                    {node.status && (
                      <Badge tone={STATUS_TONE[node.status] ?? 'default'} className="shrink-0">
                        {node.status}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export function ImpactAnalysisPanel({
  resourceType,
  resourceId,
  resourceLabel,
  onResult,
  onReset,
}: {
  resourceType: ResourceType;
  resourceId: string;
  resourceLabel: string;
  onResult?: (result: ImpactResult, sourceId: string) => void;
  onReset?: () => void;
}) {
  const simulateImpact = useSimulateImpact();
  const [result, setResult] = useState<ImpactResult | null>(null);
  const [hasRun, setHasRun] = useState(false);

  function handleSimulate(): void {
    simulateImpact.mutate(
      { resourceType, resourceId },
      {
        onSuccess: (data) => {
          setResult(data);
          setHasRun(true);
          onResult?.(data, resourceId);
        },
      },
    );
  }

  function handleReset(): void {
    setResult(null);
    setHasRun(false);
    simulateImpact.reset();
    onReset?.();
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Analise de Impacto</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Simule o que acontece se{' '}
            <span className="text-slate-300">{resourceLabel}</span> for desligado
          </p>
        </div>
        <div className="flex gap-2">
          {hasRun && (
            <Button type="button" size="sm" variant="secondary" onClick={handleReset}>
              Limpar
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            onClick={handleSimulate}
            disabled={simulateImpact.isPending}
          >
            {simulateImpact.isPending ? 'Simulando...' : 'Simular parada'}
          </Button>
        </div>
      </div>

      {simulateImpact.isPending && (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      )}

      {simulateImpact.isError && (
        <ErrorMessage
          message={
            simulateImpact.error instanceof Error
              ? simulateImpact.error.message
              : 'Erro ao simular impacto'
          }
        />
      )}

      {!simulateImpact.isPending && result && <ImpactSummary result={result} />}
    </div>
  );
}
