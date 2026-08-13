import { useAuditLogs } from '../features/audit/use-audit-logs';
import { EmptyState } from '../shared/components/EmptyState';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { PageHeader } from '../shared/components/PageHeader';
import { Spinner } from '../shared/components/Spinner';

export function AuditPage() {
  const { data, isLoading, isError, error } = useAuditLogs();

  return (
    <div>
      <PageHeader
        title="Trilha de Auditoria"
        description="Historico de eventos e alteracoes na plataforma"
      />

      {isLoading && <Spinner />}
      {isError && (
        <ErrorMessage
          message={error instanceof Error ? error.message : 'Erro ao carregar audit trail'}
        />
      )}
      {data && data.items.length === 0 && (
        <EmptyState
          title="Nenhum evento registrado"
          description="Acoes na plataforma aparecerao aqui."
        />
      )}

      {data && data.items.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium">Acao</th>
                <th className="px-4 py-2 font-medium">Recurso</th>
                <th className="px-4 py-2 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((entry) => (
                <tr key={entry.id} className="border-t border-slate-800">
                  <td className="px-4 py-2 text-slate-100">{entry.action}</td>
                  <td className="px-4 py-2 text-slate-400">{entry.resourceType}</td>
                  <td className="px-4 py-2 text-slate-500">
                    {new Date(entry.createdAt).toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
