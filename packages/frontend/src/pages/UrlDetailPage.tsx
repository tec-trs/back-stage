import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useUrl } from '../features/urls/use-urls';
import { AuditTimeline } from '../features/audit/AuditTimeline';
import { AddRelationshipDialog } from '../features/resource-graph/AddRelationshipDialog';
import { ImpactAnalysisPanel } from '../features/resource-graph/ImpactAnalysisPanel';
import { useSubgraph } from '../features/resource-graph/use-resource-graph';
import { Badge } from '../shared/components/Badge';
import { Button } from '../shared/components/Button';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { ChevronLeftIcon } from '../shared/components/icons';
import { ResourceGraph } from '../shared/components/ResourceGraph';
import { Spinner } from '../shared/components/Spinner';

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <>
      <dt className="text-slate-500">{label}</dt>
      <dd>{value === null || value === undefined || value === '' ? '-' : value}</dd>
    </>
  );
}

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  active: 'success',
  inactive: 'warning',
  deprecated: 'warning',
  error: 'danger',
};

const HEALTHCHECK_TONE: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  ok: 'success',
  error: 'danger',
  timeout: 'warning',
};

export function UrlDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: url, isLoading, isError, error } = useUrl(id ?? '');
  const { data: subgraph, isLoading: isSubgraphLoading } = useSubgraph('url', id ?? null, 2);
  const [isRelationshipDialogOpen, setIsRelationshipDialogOpen] = useState(false);
  const [simulationSourceId, setSimulationSourceId] = useState<string | undefined>();
  const [impactedByDepth, setImpactedByDepth] = useState<Map<string, number>>(new Map());
  const impactedNodeIds = useMemo(() => new Set(impactedByDepth.keys()), [impactedByDepth]);

  if (isLoading) return <Spinner />;
  if (isError)
    return <ErrorMessage message={(error as Error)?.message ?? 'Erro ao carregar URL'} />;
  if (!url) return <ErrorMessage message="URL nao encontrada" />;

  return (
    <div>
      <button
        onClick={() => navigate('/urls')}
        className="mb-4 flex items-center gap-2 text-sm text-slate-400 hover:underline"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Voltar as URLs
      </button>

      <div className="mt-4 flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-100">{url.label}</h1>
              <Badge tone={STATUS_TONE[url.status] ?? 'default'}>{url.status}</Badge>
            </div>
            <p className="mt-1 text-slate-400">{url.description ?? 'Sem descricao.'}</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsRelationshipDialogOpen(true)}
          >
            + Relacionamento
          </Button>
        </div>

        <AddRelationshipDialog
          isOpen={isRelationshipDialogOpen}
          onClose={() => setIsRelationshipDialogOpen(false)}
          defaultSourceType="url"
          defaultSourceId={url.id}
          defaultSourceLabel={url.label}
        />

        <section>
          <h2 className="mb-2 text-lg font-medium text-slate-200">URL e Configuracao</h2>
          <dl className="grid grid-cols-2 gap-3 rounded-lg border border-slate-800 p-4 text-sm">
            <div className="col-span-2">
              <dt className="text-slate-500">URL</dt>
              <dd>
                <a
                  href={url.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block break-all text-blue-400 hover:underline"
                >
                  {url.url}
                </a>
              </dd>
            </div>
            <Field label="Tipo" value={url.urlType} />
            <Field label="Metodo HTTP" value={url.method} />
            <div>
              <dt className="text-slate-500">Status</dt>
              <dd>
                <Badge tone={STATUS_TONE[url.status] ?? 'default'} className="mt-1 inline-block">
                  {url.status}
                </Badge>
              </dd>
            </div>
          </dl>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-medium text-slate-200">Seguranca</h2>
          <dl className="grid grid-cols-2 gap-3 rounded-lg border border-slate-800 p-4 text-sm">
            <Field label="Autenticacao Requerida" value={url.authRequired ? 'Sim' : 'Nao'} />
            <Field label="Metodo de Auth" value={url.authMethod} />
          </dl>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-medium text-slate-200">Monitoramento</h2>
          <dl className="grid grid-cols-2 gap-3 rounded-lg border border-slate-800 p-4 text-sm">
            <Field
              label="Healthcheck Habilitado"
              value={url.healthcheckEnabled ? 'Sim' : 'Nao'}
            />
            <div>
              <dt className="text-slate-500">Status do check</dt>
              <dd className="mt-0.5">
                {url.lastCheckStatus ? (
                  <Badge tone={HEALTHCHECK_TONE[url.lastCheckStatus] ?? 'default'}>
                    {url.lastCheckStatus}
                  </Badge>
                ) : (
                  <span className="text-slate-600">—</span>
                )}
              </dd>
            </div>
            <Field
              label="Ultima verificacao"
              value={
                url.lastCheckedAt
                  ? new Date(url.lastCheckedAt).toLocaleDateString('pt-BR')
                  : null
              }
            />
          </dl>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-medium text-slate-200">Proprietario</h2>
          <dl className="grid grid-cols-2 gap-3 rounded-lg border border-slate-800 p-4 text-sm">
            <Field label="Tipo de recurso" value={url.ownerResourceType} />
            <Field label="ID do recurso" value={url.ownerResourceId} />
          </dl>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-medium text-slate-200">Dependencias</h2>
          {isSubgraphLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : subgraph && subgraph.nodes.length > 0 ? (
            <div className="h-96 overflow-hidden rounded-lg border border-slate-800">
              <ResourceGraph
                nodes={subgraph.nodes}
                edges={subgraph.edges}
                mode="subgraph"
                impactedNodeIds={impactedNodeIds}
                impactedByDepth={impactedByDepth}
                simulationSourceId={simulationSourceId}
                onNodeNavigate={(nodeId, resourceType) => {
                  navigate(
                    `/${resourceType === 'server' ? 'servers' : resourceType + 's'}/${nodeId}`,
                  );
                }}
              />
            </div>
          ) : (
            <p className="rounded-lg border border-slate-800 p-6 text-center text-sm text-slate-500">
              Nenhuma dependencia mapeada. Use o botao "+ Relacionamento" para comecar.
            </p>
          )}
        </section>

        <ImpactAnalysisPanel
          resourceType="url"
          resourceId={url.id}
          resourceLabel={url.label}
          onResult={(result, sourceId) => {
            setSimulationSourceId(sourceId);
            setImpactedByDepth(
              new Map(result.impactedResources.map((r) => [r.resourceId, r.depth])),
            );
          }}
          onReset={() => {
            setSimulationSourceId(undefined);
            setImpactedByDepth(new Map());
          }}
        />

        <AuditTimeline resourceId={url.id} resourceType="url" />
      </div>
    </div>
  );
}
