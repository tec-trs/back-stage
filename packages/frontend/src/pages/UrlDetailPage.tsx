import { useParams, useNavigate } from 'react-router-dom';
import { useUrl } from '../features/urls/use-urls.js';
import { Badge } from '../shared/components/Badge.js';
import { ErrorMessage } from '../shared/components/ErrorMessage.js';
import { ChevronLeftIcon } from '../shared/components/icons.js';
import { Spinner } from '../shared/components/Spinner.js';

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <>
      <dt className="text-slate-500">{label}</dt>
      <dd>{value === null || value === undefined || value === '' ? '-' : value}</dd>
    </>
  );
}

export function UrlDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: url, isLoading, isError, error } = useUrl(id || '');

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorMessage message={(error as Error)?.message || 'Erro ao carregar URL'} />;
  if (!url) return <ErrorMessage message="URL não encontrada" />;

  return (
    <div>
      <button
        onClick={() => navigate('/urls')}
        className="text-sm text-slate-400 hover:underline flex items-center gap-2 mb-4"
      >
        <ChevronLeftIcon className="w-4 h-4" />
        Voltar às URLs
      </button>

      <div className="mt-4 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-100">
            {url.label}
          </h1>
          <Badge tone={url.status === 'active' ? 'success' : 'warning'}>
            {url.status}
          </Badge>
        </div>
        <p className="text-slate-400">{url.description ?? 'Sem descrição.'}</p>

        <section>
          <h2 className="mb-2 text-lg font-medium text-slate-200">URL e Configuração</h2>
          <dl className="grid grid-cols-2 gap-3 rounded-lg border border-slate-800 p-4 text-sm">
            <div className="col-span-2">
              <dt className="text-slate-500">URL</dt>
              <dd>
                <a
                  href={url.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline break-all mt-1 block"
                >
                  {url.url}
                </a>
              </dd>
            </div>
            <Field label="Tipo" value={url.urlType} />
            <Field label="Método HTTP" value={url.method} />
            <div>
              <dt className="text-slate-500">Status</dt>
              <dd>
                <Badge tone={url.status === 'active' ? 'success' : 'warning'} className="inline-block mt-1">
                  {url.status}
                </Badge>
              </dd>
            </div>
          </dl>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-medium text-slate-200">Segurança</h2>
          <dl className="grid grid-cols-2 gap-3 rounded-lg border border-slate-800 p-4 text-sm">
            <Field label="Autenticação Requerida" value={url.authRequired ? 'Sim' : 'Não'} />
            <Field label="Método de Auth" value={url.authMethod} />
          </dl>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-medium text-slate-200">Monitoramento</h2>
          <dl className="grid grid-cols-2 gap-3 rounded-lg border border-slate-800 p-4 text-sm">
            <Field label="Healthcheck Habilitado" value={url.healthcheckEnabled ? 'Sim' : 'Não'} />
            <Field label="Status do Último Check" value={url.lastCheckStatus} />
            <Field
              label="Última Verificação"
              value={
                url.lastCheckedAt
                  ? new Date(url.lastCheckedAt).toLocaleDateString('pt-BR')
                  : '-'
              }
            />
          </dl>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-medium text-slate-200">Proprietário</h2>
          <dl className="grid grid-cols-2 gap-3 rounded-lg border border-slate-800 p-4 text-sm">
            <Field label="Tipo" value={url.ownerResourceType} />
            <Field label="ID" value={url.ownerResourceId} />
          </dl>
        </section>
      </div>
    </div>
  );
}
