import { useState } from 'react';
import { Link } from 'react-router-dom';

import { ApplicationFormDialog } from '../features/applications/ApplicationFormDialog';
import { ApplicationImportDialog } from '../features/applications/ApplicationImportDialog';
import { useBulkDeleteApplications } from '../features/applications/use-bulk-delete-applications';
import { useApplications } from '../features/applications/use-applications';
import type { ApplicationSummary } from '../features/applications/use-applications';
import { useSetApplicationStatus } from '../features/applications/use-set-application-status';
import { Badge } from '../shared/components/Badge';
import { Button } from '../shared/components/Button';
import { ConfirmDialog } from '../shared/components/ConfirmDialog';
import { EmptyState } from '../shared/components/EmptyState';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { CopyIcon, PencilIcon, PlusIcon, PowerIcon, TrashIcon, UploadIcon } from '../shared/components/icons';
import { PageHeader } from '../shared/components/PageHeader';
import { Spinner } from '../shared/components/Spinner';
import {
  translateApplicationStatus,
  translateAppType,
  translateCriticality,
} from '../shared/constants/labels';

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  active: 'success',
  developing: 'default',
  maintenance: 'warning',
  deprecated: 'warning',
  deactivated: 'danger',
};

const CRITICALITY_TONE: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  critical: 'danger',
  high: 'warning',
  medium: 'default',
  low: 'default',
};

export function ApplicationsPage() {
  const { data, isLoading, isError, error } = useApplications();
  const setApplicationStatus = useSetApplicationStatus();
  const bulkDelete = useBulkDeleteApplications();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<ApplicationSummary | null>(null);
  const [duplicatingApplication, setDuplicatingApplication] = useState<ApplicationSummary | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const items = data?.items ?? [];
  const selectedItems = items.filter((a) => selectedIds.has(a.id));
  const singleSelected = selectedItems.length === 1 ? selectedItems[0] : null;
  const allVisible = items.length > 0 && items.every((a) => selectedIds.has(a.id));

  function toggleAll(): void {
    if (allVisible) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((a) => a.id)));
    }
  }

  function toggleOne(id: string): void {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function openCreateDialog(): void {
    setEditingApplication(null);
    setIsFormOpen(true);
  }

  function openEditDialog(application: ApplicationSummary): void {
    setEditingApplication(application);
    setDuplicatingApplication(null);
    setIsFormOpen(true);
  }

  function openDuplicateDialog(application: ApplicationSummary): void {
    setEditingApplication(null);
    setDuplicatingApplication(application);
    setIsFormOpen(true);
  }

  function closeDialog(): void {
    setIsFormOpen(false);
    setEditingApplication(null);
    setDuplicatingApplication(null);
  }

  function handleToggleStatusSelected(): void {
    if (singleSelected) {
      setApplicationStatus.mutate({
        id: singleSelected.id,
        status: singleSelected.status === 'deactivated' ? 'active' : 'deactivated',
      });
    }
  }

  async function handleConfirmDelete(): Promise<void> {
    if (selectedItems.length === 0) return;
    await bulkDelete.mutateAsync(selectedItems.map((a) => a.id));
    setSelectedIds(new Set());
    setConfirmDeleteOpen(false);
  }

  function closeConfirmDelete(): void {
    setConfirmDeleteOpen(false);
    bulkDelete.reset();
  }

  const deleteLabel = selectedItems.length > 1 ? `Eliminar (${selectedItems.length})` : 'Eliminar';
  const deleteMessage =
    selectedItems.length === 1
      ? `Tem certeza que deseja eliminar a aplicacao "${singleSelected?.displayName}"? Esta acao nao pode ser desfeita.`
      : `Tem certeza que deseja eliminar ${selectedItems.length} aplicacoes? Esta acao nao pode ser desfeita.`;

  return (
    <div>
      <PageHeader title="Aplicacoes" description="Catalogo de aplicacoes da plataforma" />

      <ApplicationFormDialog isOpen={isFormOpen} onClose={closeDialog} application={editingApplication} duplicateFrom={duplicatingApplication} />
      <ApplicationImportDialog isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Eliminar aplicacao"
        message={deleteMessage}
        confirmLabel="Eliminar"
        onConfirm={handleConfirmDelete}
        onCancel={closeConfirmDelete}
        isPending={bulkDelete.isPending}
        error={bulkDelete.isError ? (bulkDelete.error?.message ?? 'Erro ao eliminar aplicacao') : null}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 p-2">
        <Button size="sm" icon={<PlusIcon />} onClick={openCreateDialog} title="Incluir uma nova aplicacao">
          Incluir Aplicacao
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<UploadIcon />}
          onClick={() => setIsImportOpen(true)}
          title="Importar aplicacoes em massa a partir de arquivo CSV"
        >
          Importar
        </Button>
        <div className="mx-1 h-6 w-px bg-slate-800" />
        <Button
          size="sm"
          variant="secondary"
          icon={<PencilIcon />}
          disabled={!singleSelected}
          onClick={() => singleSelected && openEditDialog(singleSelected)}
          title={singleSelected ? `Editar ${singleSelected.displayName}` : 'Selecione uma aplicacao para editar'}
        >
          Editar
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<CopyIcon />}
          disabled={!singleSelected}
          onClick={() => singleSelected && openDuplicateDialog(singleSelected)}
          title={singleSelected ? `Duplicar ${singleSelected.displayName}` : 'Selecione uma aplicacao para duplicar'}
        >
          Duplicar
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<PowerIcon />}
          disabled={!singleSelected || setApplicationStatus.isPending}
          onClick={handleToggleStatusSelected}
          title={
            singleSelected
              ? singleSelected.status === 'deactivated'
                ? `Ativar ${singleSelected.displayName}`
                : `Desativar ${singleSelected.displayName}`
              : 'Selecione uma aplicacao para ativar ou desativar'
          }
        >
          {singleSelected?.status === 'deactivated' ? 'Ativar' : 'Desativar'}
        </Button>
        <Button
          size="sm"
          variant="danger"
          icon={<TrashIcon />}
          disabled={selectedItems.length === 0 || bulkDelete.isPending}
          onClick={() => setConfirmDeleteOpen(true)}
          title={selectedItems.length > 0 ? `Eliminar ${selectedItems.length} aplicacao(oes)` : 'Selecione aplicacoes para eliminar'}
        >
          {deleteLabel}
        </Button>
        <span className="ml-auto text-xs text-slate-500">
          {selectedItems.length > 0
            ? selectedItems.length === 1
              ? `Selecionado: ${singleSelected?.displayName}`
              : `${selectedItems.length} aplicacoes selecionadas`
            : 'Selecione aplicacoes na lista para editar, duplicar, ativar/desativar ou eliminar.'}
        </span>
      </div>

      {isLoading && <Spinner />}
      {isError && (
        <ErrorMessage
          message={error instanceof Error ? error.message : 'Erro ao carregar aplicacoes'}
        />
      )}
      {data && items.length === 0 && (
        <EmptyState title="Nenhuma aplicacao encontrada" description="Cadastre a primeira aplicacao." />
      )}

      {data && items.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="w-10 px-4 py-2">
                  <input
                    type="checkbox"
                    checked={allVisible}
                    onChange={toggleAll}
                    className="h-4 w-4 accent-sky-500"
                    aria-label="Selecionar todos"
                  />
                </th>
                <th className="px-4 py-2 font-medium">Código</th>
                <th className="px-4 py-2 font-medium">Nome</th>
                <th className="px-4 py-2 font-medium">Tipo</th>
                <th className="px-4 py-2 font-medium">Criticidade</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((application) => (
                <tr
                  key={application.id}
                  onClick={() => toggleOne(application.id)}
                  className={`cursor-pointer border-t border-slate-800 ${
                    selectedIds.has(application.id) ? 'bg-sky-950/40' : 'hover:bg-slate-900/50'
                  }`}
                >
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(application.id)}
                      onChange={() => toggleOne(application.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Selecionar ${application.displayName}`}
                      className="h-4 w-4 accent-sky-500"
                    />
                  </td>
                  <td className="px-4 py-2 font-mono text-slate-300">{application.code}</td>
                  <td className="px-4 py-2">
                    <Link
                      to={`/applications/${application.id}`}
                      onClick={(event) => event.stopPropagation()}
                      className="text-slate-100 hover:underline"
                    >
                      {application.displayName}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-400">{translateAppType(application.appType)}</td>
                  <td className="px-4 py-2">
                    <Badge tone={CRITICALITY_TONE[application.criticality] ?? 'default'}>
                      {translateCriticality(application.criticality)}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">
                    <Badge tone={STATUS_TONE[application.status] ?? 'default'}>
                      {translateApplicationStatus(application.status)}
                    </Badge>
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
