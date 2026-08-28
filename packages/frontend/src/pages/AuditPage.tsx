import { useState } from 'react';

import type { AuditLogFilters } from '../features/audit/use-audit-logs';
import { useAuditLogs } from '../features/audit/use-audit-logs';
import { useDeleteAuditLogs } from '../features/audit/use-delete-audit-logs';
import { Button } from '../shared/components/Button';
import { ConfirmDialog } from '../shared/components/ConfirmDialog';
import { EmptyState } from '../shared/components/EmptyState';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { TrashIcon } from '../shared/components/icons';
import { PageHeader } from '../shared/components/PageHeader';
import { Spinner } from '../shared/components/Spinner';

const RESOURCE_TYPES = [
  'server', 'application', 'user', 'audit_log', 'policy', 'service',
];

export function AuditPage() {
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [actionInput, setActionInput] = useState('');
  const [resourceTypeInput, setResourceTypeInput] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const { data, isLoading, isError, error } = useAuditLogs(filters);
  const deleteAuditLogs = useDeleteAuditLogs();

  const items = data?.items ?? [];
  const allSelected = items.length > 0 && items.every((e) => selectedIds.has(e.id));
  const someSelected = selectedIds.size > 0;

  function applyFilters() {
    setFilters({
      action: actionInput.trim() || undefined,
      resourceType: resourceTypeInput || undefined,
    });
    setSelectedIds(new Set());
  }

  function clearFilters() {
    setActionInput('');
    setResourceTypeInput('');
    setFilters({});
    setSelectedIds(new Set());
  }

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((e) => e.id)));
    }
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleConfirmDelete() {
    deleteAuditLogs.mutate([...selectedIds], {
      onSuccess: () => {
        setSelectedIds(new Set());
        setConfirmDeleteOpen(false);
      },
    });
  }

  const inputClass =
    'rounded-md border border-slate-700 bg-canvas px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-slate-500';

  return (
    <div>
      <PageHeader
        title="Trilha de Auditoria"
        description="Historico de eventos e alteracoes na plataforma"
      />

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Eliminar registros"
        message={`Tem certeza que deseja eliminar ${selectedIds.size} registro(s) de auditoria? Esta acao nao pode ser desfeita.`}
        confirmLabel="Eliminar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
        isPending={deleteAuditLogs.isPending}
      />

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-slate-800 bg-slate-900/40 p-3">
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          Acao (contém)
          <input
            value={actionInput}
            onChange={(e) => setActionInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            placeholder="server.created..."
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          Tipo de recurso
          <select
            value={resourceTypeInput}
            onChange={(e) => setResourceTypeInput(e.target.value)}
            className={inputClass}
          >
            <option value="">Todos</option>
            {RESOURCE_TYPES.map((rt) => (
              <option key={rt} value={rt}>{rt}</option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <Button size="sm" onClick={applyFilters}>Filtrar</Button>
          <Button size="sm" variant="secondary" onClick={clearFilters}>Limpar</Button>
        </div>
        {someSelected && (
          <Button
            size="sm"
            variant="danger"
            icon={<TrashIcon />}
            onClick={() => setConfirmDeleteOpen(true)}
            disabled={deleteAuditLogs.isPending}
            className="ml-auto"
          >
            Eliminar ({selectedIds.size})
          </Button>
        )}
      </div>

      {isLoading && <Spinner />}
      {isError && (
        <ErrorMessage
          message={error instanceof Error ? error.message : 'Erro ao carregar audit trail'}
        />
      )}
      {!isLoading && !isError && items.length === 0 && (
        <EmptyState
          title="Nenhum evento registrado"
          description="Acoes na plataforma aparecerao aqui."
        />
      )}

      {items.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="w-10 px-4 py-2">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 accent-sky-500"
                    aria-label="Selecionar todos"
                  />
                </th>
                <th className="px-4 py-2 font-medium">Acao</th>
                <th className="px-4 py-2 font-medium">Recurso</th>
                <th className="px-4 py-2 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {items.map((entry) => (
                <tr
                  key={entry.id}
                  onClick={() => toggleOne(entry.id)}
                  className={`cursor-pointer border-t border-slate-800 ${
                    selectedIds.has(entry.id) ? 'bg-sky-950/40' : 'hover:bg-slate-900/50'
                  }`}
                >
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(entry.id)}
                      onChange={() => toggleOne(entry.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 accent-sky-500"
                    />
                  </td>
                  <td className="px-4 py-2 text-slate-100">{entry.action}</td>
                  <td className="px-4 py-2 text-slate-400">{entry.resourceType}</td>
                  <td className="px-4 py-2 text-slate-500">
                    {new Date(entry.createdAt).toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && (
            <p className="px-4 py-2 text-xs text-slate-500">
              {data.pagination.total} registro(s) no total
              {someSelected && ` · ${selectedIds.size} selecionado(s)`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
