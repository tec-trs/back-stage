import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { AuditTimeline } from '../features/audit/AuditTimeline';
import { AddRelationshipDialog } from '../features/resource-graph/AddRelationshipDialog';
import { ImpactAnalysisPanel } from '../features/resource-graph/ImpactAnalysisPanel';
import { useSubgraph } from '../features/resource-graph/use-resource-graph';
import { useDatabase } from '../features/databases/use-databases';
import { Badge } from '../shared/components/Badge';
import { Button } from '../shared/components/Button';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { ChevronLeftIcon } from '../shared/components/icons';
import { ResourceGraph } from '../shared/components/ResourceGraph';
import { Spinner } from '../shared/components/Spinner';
import { CRITICALITY_LABELS } from '../shared/constants/labels';

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  active: 'success',
  maintenance: 'warning',
  provisioning: 'default',
  deactivated: 'danger',
  deprecated: 'warning',
};

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <>
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-200">
        {value === null || value === undefined || value === '' ? (
          <span className="text-slate-600">—</span>
        ) : (
          value
        )}
      </dd>
    </>
  );
}

export function DatabaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: database, isLoading, isError, error } = useDatabase(id ?? '');
  const { data: subgraph, isLoading: isSubgraphLoading } = useSubgraph('database', id ?? null, 2);

  const [isRelationshipDialogOpen, setIsRelationshipDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return <ErrorMessage message={error?.message ?? 'Erro ao carregar banco de dados'} />;
  }

  if (!database) {
    return <ErrorMessage message="Banco de dados nao encontrado" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={() => navigate('/databases')}
        className="flex w-fit items-center gap-2 text-sm text-slate-400 hover:text-slate-200 hover:underline"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Voltar aos bancos de dados
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-100">
              {database.displayName ?? database.name}
            </h1>
            <Badge tone={STATUS_TONE[database.status] ?? 'default'}>{database.status}</Badge>
            <Badge
              tone={
                database.criticality === 'critical'
                  ? 'danger'
                  : database.criticality === 'high'
                    ? 'warning'
                    : 'default'
              }
            >
              {CRITICALITY_LABELS[database.criticality] ?? database.criticality}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-400">{database.description ?? 'Sem descricao.'}</p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setIsRelationshipDialogOpen(true)}
        >
          + Relacionamento
        </Button>
      </div>

      <AddRelationshipDialog
        isOpen={isRelationshipDialogOpen}
        onClose={() => setIsRelationshipDialogOpen(false)}
        defaultSourceType="database"
        defaultSourceId={database.id}
        defaultSourceLabel={database.displayName ?? database.name}
      />

      {/* Informacoes Gerais */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-200">Informacoes Gerais</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border border-slate-800 p-4 text-sm sm:grid-cols-3">
          <Field label="Engine" value={database.engine} />
          <Field label="Versao" value={database.version} />
          <Field label="Porta" value={database.port} />
          <Field label="Ambiente" value={database.environment} />
          <Field label="Servidor" value={database.hostedOnServerHostname} />
          <Field label="Host de conexao" value={database.connectionHost} />
          <Field label="Equipe" value={database.ownerTeam} />
          <Field label="Armazenamento" value={database.storageGb ? `${database.storageGb} GB` : null} />
          <Field
            label="Servico gerenciado"
            value={database.isManagedService ? 'Sim' : 'Nao'}
          />
        </dl>
      </section>

      {/* Backup */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-200">Backup</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border border-slate-800 p-4 text-sm sm:grid-cols-3">
          <Field label="Backup configurado" value={database.hasBackup ? 'Sim' : 'Nao'} />
          <Field label="Politica" value={database.backupPolicy} />
          <Field
            label="Ultimo backup"
            value={
              database.lastBackupAt
                ? new Date(database.lastBackupAt).toLocaleDateString('pt-BR')
                : null
            }
          />
        </dl>
      </section>

      {/* Grafo de dependencias */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-200">Dependencias</h2>
        {isSubgraphLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : subgraph && subgraph.nodes.length > 0 ? (
          <div className="h-80 overflow-hidden rounded-lg border border-slate-800">
            <ResourceGraph
              nodes={subgraph.nodes}
              edges={subgraph.edges}
              mode="subgraph"
              impactedNodeIds={new Set<string>()}
              onNodeNavigate={(nodeId, resourceType) => {
                const path =
                  resourceType === 'server'
                    ? 'servers'
                    : resourceType === 'application'
                      ? 'applications'
                      : resourceType === 'database'
                        ? 'databases'
                        : 'urls';
                navigate(`/${path}/${nodeId}`);
              }}
            />
          </div>
        ) : (
          <p className="rounded-lg border border-slate-800 p-6 text-center text-sm text-slate-500">
            Nenhuma dependencia mapeada. Use o botao "+ Relacionamento" para comecar.
          </p>
        )}
      </section>

      {/* Analise de impacto */}
      <ImpactAnalysisPanel
        resourceType="database"
        resourceId={database.id}
        resourceLabel={database.displayName ?? database.name}
      />

      <AuditTimeline resourceId={database.id} resourceType="database" />
    </div>
  );
}
