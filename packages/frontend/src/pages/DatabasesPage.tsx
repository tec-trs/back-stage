import { useState } from 'react';
import { Link } from 'react-router-dom';

import { DatabaseFormDialog } from '../features/databases/DatabaseFormDialog';
import { DatabaseImportDialog } from '../features/databases/DatabaseImportDialog';
import { useBulkDeleteDatabases } from '../features/databases/use-bulk-delete-databases';
import { useDatabases } from '../features/databases/use-databases';
import type { Database } from '../features/databases/use-databases';
import { Badge } from '../shared/components/Badge';
import { Button } from '../shared/components/Button';
import { ConfirmDialog } from '../shared/components/ConfirmDialog';
import { EmptyState } from '../shared/components/EmptyState';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { CopyIcon, PencilIcon, PlusIcon, TrashIcon, UploadIcon } from '../shared/components/icons';
import { PageHeader } from '../shared/components/PageHeader';
import { Spinner } from '../shared/components/Spinner';
import { CRITICALITY_LABELS } from '../shared/constants/labels';
import { exportToCsv } from '../shared/utils/export-csv';

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  active: 'success',
  maintenance: 'warning',
  provisioning: 'default',
  deactivated: 'danger',
  deprecated: 'warning',
};

export function DatabasesPage() {
  const { data, isLoading, isError, error } = useDatabases({ page: 1, pageSize: 100 });
  const bulkDelete = useBulkDeleteDatabases();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editing, setEditing] = useState<Database | null>(null);
  const [duplicating, setDuplicating] = useState<Database | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const items = data?.items ?? [];
  const selectedItems = items.filter((d) => selectedIds.has(d.id));
  const singleSelected = selectedItems.length === 1 ? selectedItems[0] : null;
  const allVisible = items.length > 0 && items.every((d) => selectedIds.has(d.id));

  function toggleAll(): void {
    if (allVisible) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((d) => d.id)));
    }
  }

  function toggleOne(id: string): void {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function openCreate(): void {
    setEditing(null);
    setDuplicating(null);
    setIsFormOpen(true);
  }

  function openEdit(db: Database): void {
    setEditing(db);
    setDuplicating(null);
    setIsFormOpen(true);
  }

  function openDuplicate(db: Database): void {
    setEditing(null);
    setDuplicating(db);
    setIsFormOpen(true);
  }

  function closeForm(): void {
    setIsFormOpen(false);
    setEditing(null);
    setDuplicating(null);
    setSelectedIds(new Set());
  }

  async function handleConfirmDelete(): Promise<void> {
    if (selectedItems.length === 0) return;
    await bulkDelete.mutateAsync(selectedItems.map((d) => d.id));
    setSelectedIds(new Set());
    setConfirmDeleteOpen(false);
  }

  function closeConfirmDelete(): void {
    setConfirmDeleteOpen(false);
    bulkDelete.reset();
  }

  const deleteLabel = selectedItems.length > 1 ? `Eliminar (${selectedItems.length})` : 'Eliminar';
  const singleName = singleSelected?.displayName ?? singleSelected?.name;
  const deleteMessage =
    selectedItems.length === 1
      ? `Tem certeza que deseja eliminar o banco "${singleName}"? Esta acao nao pode ser desfeita.`
      : `Tem certeza que deseja eliminar ${selectedItems.length} bancos de dados? Esta acao nao pode ser desfeita.`;

  return (
    <div>
      <PageHeader
        title="Bancos de Dados"
        description="Gerencie bancos de dados, dependencias e impacto na infraestrutura"
      />

      <DatabaseFormDialog isOpen={isFormOpen} onClose={closeForm} database={editing} prefill={duplicating} />
      <DatabaseImportDialog isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Eliminar Banco de Dados"
        message={deleteMessage}
        confirmLabel="Eliminar"
        onConfirm={handleConfirmDelete}
        onCancel={closeConfirmDelete}
        isPending={bulkDelete.isPending}
        error={bulkDelete.isError ? (bulkDelete.error?.message ?? 'Erro ao eliminar') : null}
      />

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded border border-line bg-surface/40 p-2">
        <Button size="sm" icon={<PlusIcon />} onClick={openCreate}>
          Incluir Banco
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<UploadIcon />}
          onClick={() => setIsImportOpen(true)}
          title="Importar bancos de dados em massa a partir de arquivo CSV"
        >
          Importar
        </Button>
        <div className="mx-1 h-6 w-px bg-surface-raised" />
        <Button
          size="sm"
          variant="secondary"
          icon={<PencilIcon />}
          disabled={!singleSelected}
          onClick={() => singleSelected && openEdit(singleSelected)}
        >
          Editar
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<CopyIcon />}
          disabled={!singleSelected}
          onClick={() => singleSelected && openDuplicate(singleSelected)}
        >
          Duplicar
        </Button>
        <Button
          size="sm"
          variant="danger"
          icon={<TrashIcon />}
          disabled={selectedItems.length === 0 || bulkDelete.isPending}
          onClick={() => setConfirmDeleteOpen(true)}
        >
          {deleteLabel}
        </Button>
        <span className="ml-auto text-xs text-slate-500">
          {selectedItems.length > 0
            ? selectedItems.length === 1
              ? `Selecionado: ${singleSelected?.displayName ?? singleSelected?.name}`
              : `${selectedItems.length} bancos selecionados`
            : 'Selecione bancos para editar ou eliminar.'}
        </span>
        <Button
          size="sm"
          variant="secondary"
          disabled={items.length === 0}
          onClick={() =>
            exportToCsv(
              'bancos-de-dados.csv',
              items.map((db) => ({
                Nome: db.displayName ?? db.name,
                Engine: db.engine,
                Versao: db.version ?? '',
                Servidor: db.hostedOnServerHostname ?? '',
                Ambiente: db.environment,
                Criticidade: CRITICALITY_LABELS[db.criticality] ?? db.criticality,
                Status: db.status,
                Equipe: db.ownerTeam ?? '',
              })),
            )
          }
        >
          Exportar CSV
        </Button>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {isError && <ErrorMessage message={error?.message ?? 'Erro ao carregar bancos de dados'} />}

      {!isLoading && !isError && items.length === 0 && (
        <EmptyState
          title="Nenhum banco de dados cadastrado"
          description="Cadastre o primeiro banco de dados para comecar a mapear sua infraestrutura."
        />
      )}

      {!isLoading && !isError && items.length > 0 && (
        <div className="overflow-x-auto rounded border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-surface/60">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allVisible}
                    onChange={toggleAll}
                    className="h-4 w-4 accent-signal"
                    aria-label="Selecionar todos"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Engine</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Servidor</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Ambiente</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Criticidade</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((db) => {
                const isSelected = selectedIds.has(db.id);
                return (
                  <tr
                    key={db.id}
                    onClick={() => toggleOne(db.id)}
                    className={`cursor-pointer border-b border-line/50 transition-colors last:border-0 ${
                      isSelected ? 'bg-signal/10' : 'hover:bg-surface/60'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(db.id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Selecionar ${db.displayName ?? db.name}`}
                        className="h-4 w-4 accent-signal"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-100">
                      <Link
                        to={`/databases/${db.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:underline"
                      >
                        {db.displayName ?? db.name}
                      </Link>
                      {db.version && (
                        <span className="ml-2 text-xs text-slate-500">{db.version}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">{db.engine}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {db.hostedOnServerHostname ?? <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{db.environment}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {CRITICALITY_LABELS[db.criticality] ?? db.criticality}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[db.status] ?? 'default'}>{db.status}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
