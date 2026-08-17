import { Link, useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';

import { useServer } from '../features/servers/use-server';
import { useSubgraph, useSimulateImpact } from '../features/resource-graph/use-resource-graph.js';
import { Badge } from '../shared/components/Badge';
import { Button } from '../shared/components/Button.js';
import { ResourceGraph } from '../shared/components/ResourceGraph.js';
import { ErrorMessage } from '../shared/components/ErrorMessage';
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
  const { data, isLoading, isError, error } = useServer(id);
  const { data: subgraph, isLoading: isSubgraphLoading } = useSubgraph('server', id || null, 2);
  const simulateImpact = useSimulateImpact();
  const [showImpact, setShowImpact] = useState(false);
  const [impactData, setImpactData] = useState<any>(null);

  const handleSimulateImpact = async () => {
    if (!id) return;
    try {
      const result = await simulateImpact.mutateAsync({
        resourceType: 'server',
        resourceId: id,
      });
      setImpactData(result);
      setShowImpact(true);
    } catch (err) {
      console.error('Erro ao simular impacto:', err);
    }
  };

  const impactedNodeIds = impactData
    ? new Set(impactData.impactedResources.map((r: any) => r.resourceId)) as Set<string>
    : new Set();

  return (
    <div>
      <Link to="/servers" className="text-sm text-slate-400 hover:underline">
        &larr; Voltar aos servidores
      </Link>

      {isLoading && <Spinner />}
      {isError && (
        <ErrorMessage
          message={error instanceof Error ? error.message : 'Erro ao carregar servidor'}
        />
      )}

      {data && (
        <div className="mt-4 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-100">
              {data.displayName ?? data.hostname}
            </h1>
            <Badge>{translateServerStatus(data.status)}</Badge>
          </div>
          <p className="text-slate-400">{data.description ?? 'Sem descrição.'}</p>

          <section>
            <h2 className="mb-2 text-lg font-medium text-slate-200">Identificacao</h2>
            <dl className="grid grid-cols-2 gap-3 rounded-lg border border-slate-800 p-4 text-sm">
              <Field label="Hostname" value={data.hostname} />
              <Field label="Tipo" value={translateServerType(data.serverType)} />
              <Field label="Provedor" value={translateProvider(data.provider)} />
              <Field label="Ambiente" value={translateEnvironment(data.environment)} />
            </dl>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-medium text-slate-200">Hardware</h2>
            <dl className="grid grid-cols-2 gap-3 rounded-lg border border-slate-800 p-4 text-sm">
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
              <div className="overflow-hidden rounded-lg border border-slate-800">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-900 text-slate-400">
                    <tr>
                      <th className="px-4 py-2 font-medium">Mount point</th>
                      <th className="px-4 py-2 font-medium">Capacidade</th>
                      <th className="px-4 py-2 font-medium">Tipo</th>
                      <th className="px-4 py-2 font-medium">Uso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.disks.map((disk) => (
                      <tr key={disk.id} className="border-t border-slate-800">
                        <td className="px-4 py-2 text-slate-100">{disk.mountPoint}</td>
                        <td className="px-4 py-2 text-slate-400">{disk.capacityGb} GB</td>
                        <td className="px-4 py-2 text-slate-400">{translateDiskType(disk.diskType)}</td>
                        <td className="px-4 py-2 text-slate-400">{translateDiskPurpose(disk.purpose)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-2 text-lg font-medium text-slate-200">Redes</h2>
            <dl className="grid grid-cols-2 gap-3 rounded-lg border border-slate-800 p-4 text-sm">
              <Field label="IPs privados" value={data.privateIps.join(', ') || null} />
              <Field label="IP publico" value={data.publicIp} />
              <Field label="Dominio" value={data.domain} />
              <Field label="Nome (FQDN)" value={data.fqdn} />
            </dl>
          </section>

          {data.services.length > 0 && (
            <section>
              <h2 className="mb-2 text-lg font-medium text-slate-200">Servicos</h2>
              <div className="flex flex-col gap-2">
                {data.services.map((svc) => (
                  <div key={svc.seq} className="rounded-lg border border-slate-800 text-sm">
                    {/* Cabeçalho */}
                    <div className="flex items-center gap-3 px-4 py-3">
                      <span className="font-mono text-xs text-slate-500">
                        #{String(svc.seq).padStart(3, '0')}
                      </span>
                      <span className="flex-1 font-medium text-slate-100">{svc.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          svc.status === 'active'
                            ? 'bg-green-900/50 text-green-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {svc.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>

                    {/* Detalhes */}
                    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 border-t border-slate-800 px-4 py-3">
                      <dt className="text-slate-500">Portas</dt>
                      <dd className="text-slate-300">
                        {svc.ports.length > 0 ? svc.ports.join(', ') : '-'}
                      </dd>

                      <dt className="text-slate-500">Cmd subir</dt>
                      <dd className="font-mono text-slate-300">
                        {svc.commandStart ?? '-'}
                      </dd>

                      <dt className="text-slate-500">Cmd parar</dt>
                      <dd className="font-mono text-slate-300">
                        {svc.commandStop ?? '-'}
                      </dd>

                      <dt className="text-slate-500">Cmd status</dt>
                      <dd className="font-mono text-slate-300">
                        {svc.commandStatus ?? '-'}
                      </dd>
                    </dl>

                    {svc.observations && (
                      <p className="border-t border-slate-800 px-4 py-2 text-xs text-slate-400">
                        {svc.observations}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-medium text-slate-200">Dependências e Relacionamentos</h2>
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
              <div className="text-center py-8 text-slate-400">Carregando dependências...</div>
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
            {showImpact && impactData && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm">
                <h3 className="font-semibold text-red-900 mb-2">Análise de Impacto</h3>
                <p className="text-red-700">
                  <span className="font-bold">{impactData.totalImpacted}</span> recurso(s) seria(m) afetado(s)
                </p>
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-2 text-lg font-medium text-slate-200">Responsabilidade</h2>
            <dl className="grid grid-cols-2 gap-3 rounded-lg border border-slate-800 p-4 text-sm">
              <Field label="Time responsável" value={data.ownerTeam} />
            </dl>
          </section>
        </div>
      )}
    </div>
  );
}
