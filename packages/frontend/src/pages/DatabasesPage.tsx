import { useState } from 'react';
import { Link } from 'react-router-dom';

import { DatabaseFormDialog } from '../features/databases/DatabaseFormDialog';
import { useDeleteDatabase } from '../features/databases/use-delete-database';
import { useDatabases } from '../features/databases/use-databases';
import type { Database } from '../features/databases/use-databases';
import { Badge } from '../shared/components/Badge';
import { Button } from '../shared/components/Button';
import { ConfirmDialog } from '../shared/components/ConfirmDialog';
import { EmptyState } from '../shared/components/EmptyState';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { PencilIcon, PlusIcon, TrashIcon } from '../shared/components/icons';
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
  const deleteDatabase = useDeleteDatabase();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Database | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const items = data?.items ?? [];
  const selected = items.find((d) => d.id === selectedId) ?? null;

  function openCreate(): void {
    setEditing(null);
    setIsFormOpen(true);
  }

  function openEdit(db: Database): void {
    setEditing(db);
    setIsFormOpen(true);
  }

  function closeForm(): void {
    setIsFormOpen(false);
    setEditing(null);
  }

  function handleConfirmDelete(): void {
    if (!selected) return;
    deleteDatabase.mutate(selected.id, {
      onSuccess: () => {
        setSelectedId(null);
        setConfirmDeleteOpen(false);
      },
    });
  }

  function closeConfirmDelete(): void {
    setConfirmDeleteOpen(false);
    deleteDatabase.reset();
  }

  return (
    <div>
      <PageHeader
        title="Bancos de Dados"
        description="Gerencie bancos de dados, dependencias e impacto na infraestrutura"
      />

      <DatabaseFormDialog isOpen={isFormOpen} onClose={closeForm} database={editing} />

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Eliminar Banco de Dados"
        message={`Tem certeza que deseja eliminar o banco "${selected?.displayName ?? selected?.name}"? Esta acao nao pode ser desfeita.`}
        confirmLabel="Eliminar"
        onConfirm={handleConfirmDelete}
        onCancel={closeConfirmDelete}
        isPending={deleteDatabase.isPending}
        error={deleteDatabase.isError ? (deleteDatabase.error?.message ?? 'Erro ao eliminar') : null}
      />

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 p-2">
        <Button size="sm" icon={<PlusIcon />} onClick={openCreate}>
          Incluir Banco
        </Button>
        <div className="mx-1 h-6 w-px bg-slate-800" />
        <Button
          size="sm"
          variant="secondary"
          icon={<PencilIcon />}
          disabled={!selected}
          onClick={() => selected && openEdit(selected)}
        >
          Editar
        </Button>
        <Button
          size="sm"
          variant="danger"
          icon={<TrashIcon />}
          disabled={!selected || deleteDatabase.isPending}
          onClick={() => setConfirmDeleteOpen(true)}
        >
          Eliminar
        </Button>
        <span className="ml-auto text-xs text-slate-500">
          {selected
            ? `Selecionado: ${selected.displayName ?? selected.name}`
            : 'Selecione um banco para editar ou eliminar.'}
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
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60">
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
                const isSelected = db.id === selectedId;
                return (
                  <tr
                    key={db.id}
                    onClick={() => setSelectedId(isSelected ? null : db.id)}
                    className={`cursor-pointer border-b border-slate-800/50 transition-colors last:border-0 ${
                      isSelected ? 'bg-slate-800' : 'hover:bg-slate-900/60'
                    }`}
                  >
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
