import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { AuditTimeline } from '../features/audit/AuditTimeline';
import { AddRelationshipDialog } from '../features/resource-graph/AddRelationshipDialog';
import { ImpactAnalysisPanel } from '../features/resource-graph/ImpactAnalysisPanel';
import { useSubgraph } from '../features/resource-graph/use-resource-graph';
import { useDatabase, useDatabasePorts, useAddDatabasePort, useUpdateDatabasePort, useRemoveDatabasePort } from '../features/databases/use-databases';
import { Badge } from '../shared/components/Badge';
import { Button } from '../shared/components/Button';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { NotFoundError } from '../shared/components/NotFoundError';
import { ChevronLeftIcon, TrashIcon, EditIcon, CheckIcon, XIcon } from '../shared/components/icons';
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

interface PortFormData {
  port: number | string;
  parameters: string;
}

interface EditingPortId {
  id: string;
}

export function DatabaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: database, isLoading, isError } = useDatabase(id ?? '');
  const { data: subgraph, isLoading: isSubgraphLoading } = useSubgraph('database', id ?? null, 2);
  const { data: ports, refetch: refetchPorts } = useDatabasePorts(id ?? null);
  
  const [activeTab, setActiveTab] = useState<'identificacao' | 'parametros'>('identificacao');
  const [isRelationshipDialogOpen, setIsRelationshipDialogOpen] = useState(false);
  const [newPortForm, setNewPortForm] = useState<PortFormData>({ port: '', parameters: '' });
  const [editingPortId, setEditingPortId] = useState<EditingPortId | null>(null);
  const [editingParameters, setEditingParameters] = useState('');
  const [isAddingPort, setIsAddingPort] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addPort = useAddDatabasePort();
  const updatePort = useUpdateDatabasePort();
  const removePort = useRemoveDatabasePort();

  const handleAddPort = async () => {
    if (!id || !newPortForm.port) {
      setError('Porta é obrigatória');
      return;
    }

    try {
      setError(null);
      await addPort(id, Number(newPortForm.port), newPortForm.parameters || null);
      setNewPortForm({ port: '', parameters: '' });
      setIsAddingPort(false);
      await refetchPorts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar porta');
    }
  };

  const handleUpdatePort = async (portId: string) => {
    if (!id) return;

    try {
      setError(null);
      await updatePort(id, portId, editingParameters || null);
      setEditingPortId(null);
      await refetchPorts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar porta');
    }
  };

  const handleRemovePort = async (portId: string) => {
    if (!id) return;

    try {
      setError(null);
      await removePort(id, portId);
      await refetchPorts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover porta');
    }
  };

  const startEditingPort = (portId: string, currentParameters: string | null) => {
    setEditingPortId({ id: portId });
    setEditingParameters(currentParameters || '');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return <NotFoundError resourceType="banco de dados" backLink="/databases" backLabel="Voltar aos bancos de dados" />;
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

      {/* Tabs */}
      <div className="border-b border-line">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('identificacao')}
            className={`pb-3 text-sm font-medium transition-colors ${
              activeTab === 'identificacao'
                ? 'border-b-2 border-blue-500 text-slate-100'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Identificação
          </button>
          <button
            onClick={() => setActiveTab('parametros')}
            className={`pb-3 text-sm font-medium transition-colors ${
              activeTab === 'parametros'
                ? 'border-b-2 border-blue-500 text-slate-100'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Parâmetros
          </button>
        </div>
      </div>

      {/* Identificacao Tab */}
      {activeTab === 'identificacao' && (
        <>
          {/* Informacoes Gerais */}
          <section>
            <h2 className="mb-3 text-base font-semibold text-slate-200">Informacoes Gerais</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded border border-line p-4 text-sm sm:grid-cols-3">
              <Field label="Engine" value={database.engine} />
              <Field label="Nome Físico" value={database.physicalName || database.name} />
              <Field label="Nome Lógico" value={database.logicalName} />
              <Field label="Caminho" value={database.path} />
              <Field label="Ambiente" value={database.environment} />
              <Field label="Status" value={database.status} />
            </dl>
          </section>

          {/* Backup */}
          <section>
            <h2 className="mb-3 text-base font-semibold text-slate-200">Backup</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded border border-line p-4 text-sm sm:grid-cols-3">
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
              <div className="h-80 overflow-hidden rounded border border-line">
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
              <p className="rounded border border-line p-6 text-center text-sm text-slate-500">
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
        </>
      )}

      {/* Parametros Tab */}
      {activeTab === 'parametros' && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-200">Portas Configuradas</h2>
            {!isAddingPort && (
              <Button
                size="sm"
                onClick={() => setIsAddingPort(true)}
              >
                + Adicionar Porta
              </Button>
            )}
          </div>

          {error && (
            <div className="mb-4 rounded border border-red-900 bg-red-950 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {/* Add Port Form */}
          {isAddingPort && (
            <div className="mb-6 flex flex-col gap-4 rounded border border-line p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-400">Porta</label>
                  <input
                    type="number"
                    min="1"
                    max="65535"
                    value={newPortForm.port}
                    onChange={(e) => setNewPortForm({ ...newPortForm, port: e.target.value })}
                    className="w-full rounded border border-line bg-surface px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                    placeholder="Ex: 5432"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-400">Parâmetros</label>
                  <input
                    type="text"
                    value={newPortForm.parameters}
                    onChange={(e) => setNewPortForm({ ...newPortForm, parameters: e.target.value })}
                    className="w-full rounded border border-line bg-surface px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                    placeholder="Ex: max_connections=100"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAddPort}
                >
                  Salvar
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setIsAddingPort(false);
                    setNewPortForm({ port: '', parameters: '' });
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Ports Table */}
          {ports && ports.length > 0 ? (
            <div className="overflow-x-auto rounded border border-line">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface">
                    <th className="px-4 py-3 text-left text-slate-400">Porta</th>
                    <th className="px-4 py-3 text-left text-slate-400">Parâmetros</th>
                    <th className="px-4 py-3 text-left text-slate-400">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {ports.map((port) => (
                    <tr key={port.id} className="border-b border-line hover:bg-surface">
                      <td className="px-4 py-3 text-slate-100">{port.port}</td>
                      <td className="px-4 py-3 text-slate-300">
                        {editingPortId?.id === port.id ? (
                          <input
                            type="text"
                            value={editingParameters}
                            onChange={(e) => setEditingParameters(e.target.value)}
                            className="w-full rounded border border-line bg-surface-raised px-2 py-1 text-slate-100 focus:border-blue-500 focus:outline-none"
                          />
                        ) : (
                          <span className="text-slate-400">{port.parameters || '—'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {editingPortId?.id === port.id ? (
                            <>
                              <button
                                onClick={() => handleUpdatePort(port.id)}
                                className="inline-flex items-center gap-1 text-xs text-green-400 hover:text-green-300"
                              >
                                <CheckIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setEditingPortId(null)}
                                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-300"
                              >
                                <XIcon className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEditingPort(port.id, port.parameters)}
                                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                              >
                                <EditIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleRemovePort(port.id)}
                                className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded border border-line p-6 text-center text-sm text-slate-500">
              Nenhuma porta configurada. Clique no botão "+ Adicionar Porta" para começar.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
