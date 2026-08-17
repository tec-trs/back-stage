import { useParams, useNavigate } from 'react-router-dom';
import { useDatabase } from '../features/databases/use-databases.js';
import { useSubgraph, useSimulateImpact } from '../features/resource-graph/use-resource-graph.js';
import { Badge } from '../shared/components/Badge.js';
import { Button } from '../shared/components/Button.js';
import { ErrorMessage } from '../shared/components/ErrorMessage.js';
import { ChevronLeftIcon } from '../shared/components/icons.js';
import { Spinner } from '../shared/components/Spinner.js';
import { useState } from 'react';
import { ResourceGraph } from '../shared/components/ResourceGraph.js';

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <>
      <dt className="text-slate-500">{label}</dt>
      <dd>{value === null || value === undefined || value === '' ? '-' : value}</dd>
    </>
  );
}

export function DatabaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: database, isLoading, isError, error } = useDatabase(id || '');
  const { data: subgraph, isLoading: isSubgraphLoading } = useSubgraph('database', id || null, 2);
  const simulateImpact = useSimulateImpact();
  const [showImpact, setShowImpact] = useState(false);
  const [impactData, setImpactData] = useState<any>(null);

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorMessage message={(error as Error)?.message || 'Erro ao carregar banco de dados'} />;
  if (!database) return <ErrorMessage message="Banco de dados não encontrado" />;

  async function handleSimulateImpact() {
    try {
      const result = await simulateImpact.mutateAsync({
        resourceType: 'database',
        resourceId: id || '',
      });
      setImpactData(result);
      setShowImpact(true);
    } catch (err) {
      console.error('Erro ao simular impacto:', err);
    }
  }

  const impactedNodeIds = impactData
    ? (new Set(impactData.impactedResources.map((r: any) => r.resourceId)) as Set<string>)
    : (new Set() as Set<string>);

  return (
    <div>
      <button
        onClick={() => navigate('/databases')}
        className="text-sm text-slate-400 hover:underline flex items-center gap-2 mb-4"
      >
        <ChevronLeftIcon className="w-4 h-4" />
        Voltar aos bancos de dados
      </button>

      {isLoading && <Spinner />}
      {isError && (
        <ErrorMessage
          message={(error as Error)?.message || 'Erro ao carregar banco de dados'}
        />
      )}

      {database && (
        <div className="mt-4 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-100">
              {database.displayName || database.name}
            </h1>
            <Badge tone={database.status === 'active' ? 'success' : 'warning'}>
              {database.status}
            </Badge>
          </div>
          <p className="text-slate-400">{database.description ?? 'Sem descrição.'}</p>

          <section>
            <h2 className="mb-2 text-lg font-medium text-slate-200">Informações Gerais</h2>
            <dl className="grid grid-cols-2 gap-3 rounded-lg border border-slate-800 p-4 text-sm">
              <Field label="Engine" value={database.engine} />
              <Field label="Versão" value={database.version} />
              <Field label="Porta" value={database.port} />
              <Field label="Ambiente" value={database.environment} />
              <div>
                <dt className="text-slate-500">Status</dt>
                <dd>
                  <Badge tone={database.status === 'active' ? 'success' : 'warning'} className="inline-block mt-1">
                    {database.status}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Criticidade</dt>
                <dd>
                  <Badge
                    tone={
                      database.criticality === 'critical'
                        ? 'danger'
                        : database.criticality === 'high'
                          ? 'warning'
                          : 'default'
                    }
                    className="inline-block mt-1"
                  >
                    {database.criticality}
                  </Badge>
                </dd>
              </div>
            </dl>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-medium text-slate-200">Backup</h2>
            <dl className="grid grid-cols-2 gap-3 rounded-lg border border-slate-800 p-4 text-sm">
              <Field label="Backup Habilitado" value={database.hasBackup ? 'Sim' : 'Não'} />
              <Field label="Política" value={database.backupPolicy} />
              <Field
                label="Último Backup"
                value={
                  database.lastBackupAt
                    ? new Date(database.lastBackupAt).toLocaleDateString('pt-BR')
                    : '-'
                }
              />
            </dl>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-slate-200">Dependências</h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSimulateImpact}
                disabled={simulateImpact.isPending}
              >
                {simulateImpact.isPending ? 'Simulando...' : 'Simular Impacto'}
              </Button>
            </div>

            {isSubgraphLoading ? (
              <Spinner />
            ) : subgraph ? (
              <div className="border border-slate-800 rounded-lg h-96 overflow-hidden">
                <ResourceGraph
                  nodes={subgraph.nodes}
                  edges={subgraph.edges}
                  mode={showImpact ? 'impact' : 'subgraph'}
                  impactedNodeIds={impactedNodeIds}
                  onNodeNavigate={(nodeId, resourceType) => {
                    navigate(`/${resourceType === 'server' ? 'servers' : resourceType + 's'}/${nodeId}`);
                  }}
                />
              </div>
            ) : null}
          </section>

          {showImpact && impactData && (
            <section className="bg-red-950/20 rounded-lg border border-red-800 p-6 space-y-4">
              <h3 className="font-semibold text-red-200">Análise de Impacto</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-red-400">Total Afetado:</span>
                  <p className="font-bold text-lg text-red-200">{impactData.totalImpacted}</p>
                </div>
                {Object.entries(impactData.byType).map(([type, count]: any) => (
                  <div key={type}>
                    <span className="text-red-400">{type}:</span>
                    <p className="font-medium text-red-200">{count}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
