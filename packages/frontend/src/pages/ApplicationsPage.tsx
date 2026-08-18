import { useState } from 'react';
import { Link } from 'react-router-dom';

import { ApplicationFormDialog } from '../features/applications/ApplicationFormDialog';
import { ApplicationImportDialog } from '../features/applications/ApplicationImportDialog';
import { useApplications } from '../features/applications/use-applications';
import type { ApplicationSummary } from '../features/applications/use-applications';
import { useDeleteApplication } from '../features/applications/use-delete-application';
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
  const deleteApplication = useDeleteApplication();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<ApplicationSummary | null>(null);
  const [duplicatingApplication, setDuplicatingApplication] = useState<ApplicationSummary | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const selectedApplication =
    data?.items.find((item) => item.id === selectedApplicationId) ?? null;

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

  function handleEditSelected(): void {
    if (selectedApplication) {
      openEditDialog(selectedApplication);
    }
  }

  function handleDuplicateSelected(): void {
    if (selectedApplication) {
      openDuplicateDialog(selectedApplication);
    }
  }

  function handleToggleStatusSelected(): void {
    if (selectedApplication) {
      setApplicationStatus.mutate({
        id: selectedApplication.id,
        status: selectedApplication.status === 'deactivated' ? 'active' : 'deactivated',
      });
    }
  }

  function handleDeleteSelected(): void {
    if (selectedApplication) {
      setConfirmDeleteOpen(true);
    }
  }

  function handleConfirmDelete(): void {
    if (!selectedApplication) return;
    deleteApplication.mutate(selectedApplication.id, {
      onSuccess: () => {
        setSelectedApplicationId(null);
        setConfirmDeleteOpen(false);
      },
    });
  }

  function closeConfirmDelete(): void {
    setConfirmDeleteOpen(false);
    deleteApplication.reset();
  }

  return (
    <div>
      <PageHeader title="Aplicacoes" description="Catalogo de aplicacoes da plataforma" />

      <ApplicationFormDialog isOpen={isFormOpen} onClose={closeDialog} application={editingApplication} duplicateFrom={duplicatingApplication} />
      <ApplicationImportDialog isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Eliminar aplicacao"
        message={`Tem certeza que deseja eliminar a aplicacao "${selectedApplication?.displayName}"? Esta acao nao pode ser desfeita.`}
        confirmLabel="Eliminar"
        onConfirm={handleConfirmDelete}
        onCancel={closeConfirmDelete}
        isPending={deleteApplication.isPending}
        error={deleteApplication.isError ? (deleteApplication.error?.message ?? 'Erro ao eliminar aplicacao') : null}
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
          disabled={!selectedApplication}
          onClick={handleEditSelected}
          title={
            selectedApplication
              ? `Editar ${selectedApplication.displayName}`
              : 'Selecione uma aplicacao para editar'
          }
        >
          Editar
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<CopyIcon />}
          disabled={!selectedApplication}
          onClick={handleDuplicateSelected}
          title={
            selectedApplication
              ? `Duplicar ${selectedApplication.displayName}`
              : 'Selecione uma aplicacao para duplicar'
          }
        >
          Duplicar
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<PowerIcon />}
          disabled={!selectedApplication || setApplicationStatus.isPending}
          onClick={handleToggleStatusSelected}
          title={
            selectedApplication
              ? selectedApplication.status === 'deactivated'
                ? `Ativar ${selectedApplication.displayName}`
                : `Desativar ${selectedApplication.displayName}`
              : 'Selecione uma aplicacao para ativar ou desativar'
          }
        >
          {selectedApplication?.status === 'deactivated' ? 'Ativar' : 'Desativar'}
        </Button>
        <Button
          size="sm"
          variant="danger"
          icon={<TrashIcon />}
          disabled={!selectedApplication || deleteApplication.isPending}
          onClick={handleDeleteSelected}
          title={
            selectedApplication
              ? `Eliminar ${selectedApplication.displayName}`
              : 'Selecione uma aplicacao para eliminar'
          }
        >
          Eliminar
        </Button>
        <span className="ml-auto text-xs text-slate-500">
          {selectedApplication
            ? `Selecionado: ${selectedApplication.displayName}`
            : 'Selecione uma aplicacao na lista para editar, duplicar, ativar/desativar ou eliminar.'}
        </span>
      </div>

      {isLoading && <Spinner />}
      {isError && (
        <ErrorMessage
          message={error instanceof Error ? error.message : 'Erro ao carregar aplicacoes'}
        />
      )}
      {data && data.items.length === 0 && (
        <EmptyState title="Nenhuma aplicacao encontrada" description="Cadastre a primeira aplicacao." />
      )}

      {data && data.items.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="w-10 px-4 py-2" />
                <th className="px-4 py-2 font-medium">Código</th>
                <th className="px-4 py-2 font-medium">Nome</th>
                <th className="px-4 py-2 font-medium">Tipo</th>
                <th className="px-4 py-2 font-medium">Criticidade</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((application) => (
                <tr
                  key={application.id}
                  onClick={() => setSelectedApplicationId(application.id)}
                  className={`cursor-pointer border-t border-slate-800 ${
                    application.id === selectedApplicationId ? 'bg-sky-950/40' : 'hover:bg-slate-900/50'
                  }`}
                >
                  <td className="px-4 py-2">
                    <input
                      type="radio"
                      name="selected-application"
                      checked={application.id === selectedApplicationId}
                      onChange={() => setSelectedApplicationId(application.id)}
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
