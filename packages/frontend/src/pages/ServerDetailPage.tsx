import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useServer } from '../features/servers/use-server';
import { useUpdateServer } from '../features/servers/use-update-server';
import { ServiceEditModal } from '../features/servers/ServiceEditModal';
import {
  serviceInputToPayload,
  serviceToInput,
  servicesFromServer,
  type ServiceInput,
} from '../features/servers/service-input';
import { AddRelationshipDialog } from '../features/resource-graph/AddRelationshipDialog';
import { ImpactAnalysisPanel } from '../features/resource-graph/ImpactAnalysisPanel';
import { useSubgraph } from '../features/resource-graph/use-resource-graph';
import { Badge } from '../shared/components/Badge';
import { Button } from '../shared/components/Button';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { ResourceGraph } from '../shared/components/ResourceGraph';
import { NotFoundError } from '../shared/components/NotFoundError';
import { PencilIcon, PlusIcon, TrashIcon } from '../shared/components/icons';
import { Spinner } from '../shared/components/Spinner';
import {
  translateDiskPurpose,
  translateDiskType,
  translateEnvironment,
  translateProvider,
  translateServerStatus,
  translateServerType,
} from '../shared/constants/labels';

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <>
      <dt className="text-slate-500">{label}</dt>
      <dd>{value === null || value === undefined || value === '' ? '-' : value}</dd>
    </>
  );
}

export function ServerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useServer(id);
  const { data: subgraph, isLoading: isSubgraphLoading, isError: isSubgraphError, error: subgraphError } = useSubgraph('server', id ?? null, 2);
  const [isRelationshipDialogOpen, setIsRelationshipDialogOpen] = useState(false);
  const [simulationSourceId, setSimulationSourceId] = useState<string | undefined>();
  const [impactedByDepth, setImpactedByDepth] = useState<Map<string, number>>(new Map());
  const impactedNodeIds = useMemo(() => new Set(impactedByDepth.keys()), [impactedByDepth]);

  const updateServer = useUpdateServer();
  const [editingService, setEditingService] = useState<{ service: ServiceInput; index: number | null } | null>(null);

  function openAddService(): void {
    if (!data) return;
    const existing = servicesFromServer(data);
    const seq = existing.length > 0 ? Math.max(...existing.map((s) => s.seq)) + 1 : 1;
    setEditingService({
      service: {
        seq,
        name: '',
        commandStart: '',
        commandStop: '',
        commandStatus: '',
        ports: '',
        status: 'active',
        observations: '',
      },
      index: null,
    });
  }

  function saveService(updated: ServiceInput, index: number | null): void {
    if (!data) return;
    const current = servicesFromServer(data);
    const next = index === null ? [...current, updated] : current.map((s, i) => (i === index ? updated : s));
    updateServer.mutate(
      { id: data.id, services: next.map(serviceInputToPayload) },
      { onSuccess: () => setEditingService(null) },
    );
  }

  function removeService(index: number): void {
    if (!data) return;
    if (!confirm('Remover este servico do servidor?')) return;
    const current = servicesFromServer(data);
    const next = current.filter((_, i) => i !== index);
    updateServer.mutate({ id: data.id, services: next.map(serviceInputToPayload) });
  }

  return (
    <div>
      <Link to="/servers" className="text-sm text-slate-400 hover:underline">
        &larr; Voltar aos servidores
      </Link>

      {isLoading && <Spinner />}
      {isError && <NotFoundError resourceType="servidor" backLink="/servers" backLabel="Voltar aos servidores" />}

      {data && (
        <div className="mt-4 flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-slate-100">
                  {data.displayName ?? data.hostname}
                </h1>
                <Badge>{translateServerStatus(data.status)}</Badge>
              </div>
              <p className="mt-1 text-slate-400">{data.description ?? 'Sem descricao.'}</p>
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
            defaultSourceType="server"
            defaultSourceId={data.id}
            defaultSourceLabel={data.displayName ?? data.hostname}
          />

          <section>
            <h2 className="mb-2 text-lg font-medium text-slate-200">Identificacao</h2>
            <dl className="grid grid-cols-2 gap-3 rounded border border-line p-4 text-sm">
              <Field label="Hostname" value={data.hostname} />
              <Field label="Tipo" value={translateServerType(data.serverType)} />
              <Field label="Provedor" value={translateProvider(data.provider)} />
              <Field label="Ambiente" value={translateEnvironment(data.environment)} />
            </dl>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-medium text-slate-200">Hardware</h2>
            <dl className="grid grid-cols-2 gap-3 rounded border border-line p-4 text-sm">
              <Field label="CPU (nucleos)" value={data.cpuCores} />
              <Field label="RAM (GB)" value={data.ramGb} />
              <Field label="Hypervisor" value={data.hypervisor} />
              <Field
                label="SO"
                value={[data.osName, data.osVersion].filter(Boolean).join(' ') || null}
              />
            </dl>
          </section>

          {data.disks.length > 0 && (
            <section>
              <h2 className="mb-2 text-lg font-medium text-slate-200">Discos</h2>
              <div className="overflow-hidden rounded border border-line">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface text-slate-400">
                    <tr>
                      <th className="px-4 py-2 font-medium">Mount point</th>
                      <th className="px-4 py-2 font-medium">Capacidade</th>
                      <th className="px-4 py-2 font-medium">Tipo</th>
                      <th className="px-4 py-2 font-medium">Uso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.disks.map((disk) => (
                      <tr key={disk.id} className="border-t border-line">
                        <td className="px-4 py-2 text-slate-100">{disk.mountPoint}</td>
                        <td className="px-4 py-2 text-slate-400">{disk.capacityGb} GB</td>
                        <td className="px-4 py-2 text-slate-400">
                          {translateDiskType(disk.diskType)}
                        </td>
                        <td className="px-4 py-2 text-slate-400">
                          {translateDiskPurpose(disk.purpose)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-2 text-lg font-medium text-slate-200">Redes</h2>
            <dl className="grid grid-cols-2 gap-3 rounded border border-line p-4 text-sm">
              <Field label="IPs privados" value={data.privateIps.join(', ') || null} />
              <Field label="IP publico" value={data.publicIp} />
              <Field label="Dominio" value={data.domain} />
              <Field label="Nome (FQDN)" value={data.fqdn} />
            </dl>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-medium text-slate-200">Servicos</h2>
              <Button variant="secondary" size="sm" icon={<PlusIcon />} onClick={openAddService}>
                Servico
              </Button>
            </div>

            {updateServer.isError && (
              <div className="mb-2">
                <ErrorMessage
                  message={
                    updateServer.error instanceof Error ? updateServer.error.message : 'Erro ao salvar servico'
                  }
                />
              </div>
            )}

            {data.services.length === 0 ? (
              <p className="rounded border border-dashed border-line p-6 text-center text-sm text-slate-500">
                Nenhum servico cadastrado. Use &quot;Servico&quot; para registrar o que roda neste servidor (ex:
                tomcat, nginx).
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {data.services.map((svc, index) => (
                  <div key={svc.seq} className="rounded border border-line text-sm">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <span className="font-mono text-xs text-slate-500">
                        #{String(svc.seq).padStart(3, '0')}
                      </span>
                      <span className="flex-1 font-medium text-slate-100">{svc.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          svc.status === 'active'
                            ? 'bg-green-900/50 text-green-400'
                            : 'bg-surface-raised text-slate-400'
                        }`}
                      >
                        {svc.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingService({ service: serviceToInput(svc), index })}
                        className="text-slate-500 hover:text-slate-300"
                        title="Editar servico"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeService(index)}
                        className="text-slate-500 hover:text-red-400"
                        title="Remover servico"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 border-t border-line px-4 py-3">
                      <dt className="text-slate-500">Portas</dt>
                      <dd className="text-slate-300">
                        {svc.ports.length > 0 ? svc.ports.join(', ') : '-'}
                      </dd>
                      <dt className="text-slate-500">Cmd subir</dt>
                      <dd className="font-mono text-slate-300">{svc.commandStart ?? '-'}</dd>
                      <dt className="text-slate-500">Cmd parar</dt>
                      <dd className="font-mono text-slate-300">{svc.commandStop ?? '-'}</dd>
                      <dt className="text-slate-500">Cmd status</dt>
                      <dd className="font-mono text-slate-300">{svc.commandStatus ?? '-'}</dd>
                    </dl>
                    {svc.observations && (
                      <p className="border-t border-line px-4 py-2 text-xs text-slate-400">
                        {svc.observations}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {editingService && (
              <ServiceEditModal
                service={editingService.service}
                index={editingService.index}
                isWindows={(data.osName ?? '').toLowerCase().includes('windows')}
                onSave={saveService}
                onCancel={() => setEditingService(null)}
              />
            )}
          </section>

          {/* Hosted resources derived from the subgraph */}
          {subgraph && (() => {
            const hostedNodes = subgraph.edges
              .filter(
                (e) =>
                  e.relationType === 'hosts' &&
                  e.sourceType === 'server' &&
                  e.sourceId === data.id,
              )
              .map((e) => subgraph.nodes.find((n) => n.id === e.targetId))
              .filter(Boolean);

            if (hostedNodes.length === 0) return null;

            return (
              <section>
                <h2 className="mb-2 text-lg font-medium text-slate-200">Recursos Hospedados</h2>
                <div className="flex flex-col gap-2">
                  {hostedNodes.map((node) => {
                    if (!node) return null;
                    const path =
                      node.resourceType === 'database'
                        ? 'databases'
                        : node.resourceType === 'application'
                          ? 'applications'
                          : node.resourceType === 'url'
                            ? 'urls'
                            : 'servers';
                    return (
                      <div
                        key={node.id}
                        className="flex items-center gap-3 rounded border border-line bg-surface/30 px-4 py-2 text-sm"
                      >
                        <span className="shrink-0 rounded bg-surface-raised px-1.5 py-0.5 font-mono text-xs capitalize text-slate-400">
                          {node.resourceType}
                        </span>
                        <Link
                          to={`/${path}/${node.id}`}
                          className="flex-1 text-signal hover:underline"
                        >
                          {node.label}
                        </Link>
                        {node.status && (
                          <span className="shrink-0 text-xs text-slate-500">{node.status}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })()}

          <section>
            <h2 className="mb-2 text-lg font-medium text-slate-200">Dependencias</h2>
            {isSubgraphLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : isSubgraphError ? (
              <p className="rounded border border-red-900/50 bg-red-950/20 p-6 text-center text-sm text-red-400">
                Erro ao carregar dependencias{subgraphError instanceof Error ? `: ${subgraphError.message}` : ''}.
              </p>
            ) : subgraph && subgraph.nodes.length > 0 ? (
              <div className="h-96 overflow-hidden rounded border border-line">
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
              <p className="rounded border border-line p-6 text-center text-sm text-slate-500">
                Nenhuma dependencia mapeada. Use o botao "+ Relacionamento" para comecar.
              </p>
            )}
          </section>

          <ImpactAnalysisPanel
            resourceType="server"
            resourceId={data.id}
            resourceLabel={data.displayName ?? data.hostname}
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

          <section>
            <h2 className="mb-2 text-lg font-medium text-slate-200">Responsabilidade</h2>
            <dl className="grid grid-cols-2 gap-3 rounded border border-line p-4 text-sm">
              <Field label="Time responsavel" value={data.ownerTeam} />
            </dl>
          </section>
        </div>
      )}
    </div>
  );
}
