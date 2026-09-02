import { useAuditLogs } from './use-audit-logs';
import { ErrorMessage } from '../../shared/components/ErrorMessage';
import { Spinner } from '../../shared/components/Spinner';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function actionLabel(action: string): string {
  const map: Record<string, string> = {
    'server.created': 'Criado',
    'server.updated': 'Atualizado',
    'server.deleted': 'Removido',
    'server.status_changed': 'Status alterado',
    'application.created': 'Criado',
    'application.updated': 'Atualizado',
    'application.deleted': 'Removido',
    'database.created': 'Criado',
    'database.updated': 'Atualizado',
    'database.deleted': 'Removido',
    'url.created': 'Criada',
    'url.updated': 'Atualizada',
    'url.deleted': 'Removida',
    'relationship.created': 'Relacionamento criado',
    'relationship.deleted': 'Relacionamento removido',
  };
  return map[action] ?? action;
}

function actionTone(action: string): string {
  if (action.endsWith('.deleted')) return 'text-red-400';
  if (action.endsWith('.created') || action.endsWith('.created')) return 'text-emerald-400';
  return 'text-amber-400';
}

export function AuditTimeline({
  resourceId,
  resourceType,
}: {
  resourceId: string;
  resourceType: string;
}) {
  const { data, isLoading, isError, error } = useAuditLogs({
    resourceId,
    resourceType,
    pageSize: 20,
  });

  const entries = data?.items ?? [];

  return (
    <section>
      <h2 className="mb-3 text-base font-semibold text-slate-200">Historico de Mudancas</h2>

      {isLoading && (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      )}

      {isError && (
        <ErrorMessage message={error?.message ?? 'Erro ao carregar historico'} />
      )}

      {!isLoading && !isError && entries.length === 0 && (
        <p className="rounded border border-line p-4 text-center text-sm text-slate-500">
          Nenhuma mudanca registrada para este recurso.
        </p>
      )}

      {!isLoading && !isError && entries.length > 0 && (
        <div className="relative flex flex-col gap-0 rounded border border-line overflow-hidden">
          {entries.map((entry, idx) => (
            <div
              key={entry.id}
              className={`flex items-start gap-4 px-4 py-3 text-sm ${
                idx < entries.length - 1 ? 'border-b border-line/60' : ''
              }`}
            >
              <div className="mt-0.5 flex-none">
                <span className={`font-mono text-xs ${actionTone(entry.action)}`}>●</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-200">{actionLabel(entry.action)}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {entry.actorUserId ? `Por ${entry.actorUserId.slice(0, 8)}...` : 'Sistema'} •{' '}
                  {formatDate(entry.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
