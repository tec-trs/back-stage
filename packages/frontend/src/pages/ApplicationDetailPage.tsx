import { Link, useParams } from 'react-router-dom';

import { useApplication } from '../features/applications/use-application';
import { Badge } from '../shared/components/Badge';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { Spinner } from '../shared/components/Spinner';
import {
  translateApplicationStatus,
  translateAppType,
  translateCriticality,
  translateEnvironment,
} from '../shared/constants/labels';

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <>
      <dt className="text-slate-500">{label}</dt>
      <dd>{value === null || value === undefined || value === '' ? '-' : value}</dd>
    </>
  );
}

export function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error } = useApplication(id);

  return (
    <div>
      <Link to="/applications" className="text-sm text-slate-400 hover:underline">
        &larr; Voltar as aplicacoes
      </Link>

      {isLoading && <Spinner />}
      {isError && (
        <ErrorMessage
          message={error instanceof Error ? error.message : 'Erro ao carregar aplicacao'}
        />
      )}

      {data && (
        <div className="mt-4 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-100">{data.displayName}</h1>
            <Badge>{translateApplicationStatus(data.status)}</Badge>
            <Badge tone="warning">{translateCriticality(data.criticality)}</Badge>
          </div>
          <p className="text-slate-400">{data.description ?? 'Sem descricao.'}</p>

          <section>
            <h2 className="mb-2 text-lg font-medium text-slate-200">Identificacao</h2>
            <dl className="grid grid-cols-2 gap-3 rounded-lg border border-slate-800 p-4 text-sm">
              <Field label="Codigo" value={data.code} />
              <Field label="Tipo" value={translateAppType(data.appType)} />
              <Field label="Categoria de negocio" value={data.businessCategory} />
              <Field label="Linguagem" value={data.language} />
              <Field label="Framework" value={data.framework} />
              <Field label="Versao atual" value={data.currentVersion} />
            </dl>
          </section>

          {data.deployments.length > 0 && (
            <section>
              <h2 className="mb-2 text-lg font-medium text-slate-200">Implantacoes</h2>
              <div className="overflow-hidden rounded-lg border border-slate-800">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-900 text-slate-400">
                    <tr>
                      <th className="px-4 py-2 font-medium">Servidor</th>
                      <th className="px-4 py-2 font-medium">Ambiente</th>
                      <th className="px-4 py-2 font-medium">Versao</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.deployments.map((deployment) => (
                      <tr key={deployment.id} className="border-t border-slate-800">
                        <td className="px-4 py-2 text-slate-100">
                          {deployment.serverHostname ?? deployment.serverId}
                        </td>
                        <td className="px-4 py-2 text-slate-400">
                          {translateEnvironment(deployment.environment)}
                        </td>
                        <td className="px-4 py-2 text-slate-400">{deployment.deployedVersion ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {(data.dependsOn.length > 0 || data.dependents.length > 0) && (
            <section>
              <h2 className="mb-2 text-lg font-medium text-slate-200">Dependencias</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-slate-800 p-4">
                  <p className="mb-2 text-sm text-slate-400">Depende de</p>
                  {data.dependsOn.length === 0 && <p className="text-sm text-slate-600">-</p>}
                  <ul className="flex flex-col gap-1">
                    {data.dependsOn.map((dep) => (
                      <li key={dep.id}>
                        <Link to={`/applications/${dep.id}`} className="text-sky-400 hover:underline">
                          {dep.displayName}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-slate-800 p-4">
                  <p className="mb-2 text-sm text-slate-400">Dependentes</p>
                  {data.dependents.length === 0 && <p className="text-sm text-slate-600">-</p>}
                  <ul className="flex flex-col gap-1">
                    {data.dependents.map((dep) => (
                      <li key={dep.id}>
                        <Link to={`/applications/${dep.id}`} className="text-sky-400 hover:underline">
                          {dep.displayName}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-2 text-lg font-medium text-slate-200">Governanca</h2>
            <dl className="grid grid-cols-2 gap-3 rounded-lg border border-slate-800 p-4 text-sm">
              <Field label="Time responsavel" value={data.ownerTeam} />
              <Field label="Centro de custo" value={data.costCenter} />
              <Field label="SLA" value={data.sla} />
              <Field label="Custo mensal estimado" value={data.monthlyCostEstimate ?? null} />
            </dl>
          </section>
        </div>
      )}
    </div>
  );
}
