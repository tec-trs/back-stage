import { Link, useParams } from 'react-router-dom';

import { useServer } from '../features/servers/use-server';
import { Badge } from '../shared/components/Badge';
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
  const { data, isLoading, isError, error } = useServer(id);

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
          <p className="text-slate-400">{data.description ?? 'Sem descricao.'}</p>

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
            <h2 className="mb-2 text-lg font-medium text-slate-200">Responsabilidade</h2>
            <dl className="grid grid-cols-2 gap-3 rounded-lg border border-slate-800 p-4 text-sm">
              <Field label="Time responsavel" value={data.ownerTeam} />
            </dl>
          </section>
        </div>
      )}
    </div>
  );
}
