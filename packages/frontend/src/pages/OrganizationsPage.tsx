import { useState } from 'react';

import { OrgFormDialog } from '../features/organizations/OrgFormDialog';
import { useDeleteOrganization } from '../features/organizations/use-delete-organization';
import { useOrganizations } from '../features/organizations/use-organizations';
import type { OrganizationSummary } from '../features/organizations/use-organizations';
import { Badge } from '../shared/components/Badge';
import { Button } from '../shared/components/Button';
import { ConfirmDialog } from '../shared/components/ConfirmDialog';
import { EmptyState } from '../shared/components/EmptyState';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { PencilIcon, PlusIcon, TrashIcon } from '../shared/components/icons';
import { PageHeader } from '../shared/components/PageHeader';
import { Spinner } from '../shared/components/Spinner';

const PLAN_LABEL: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
};

const PLAN_TONE: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  free: 'default',
  starter: 'default',
  professional: 'warning',
  enterprise: 'success',
};

export function OrganizationsPage() {
  const { data, isLoading, isError, error } = useOrganizations();
  const deleteOrg = useDeleteOrganization();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<OrganizationSummary | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const items = data ?? [];
  const selected = items.find((o) => o.id === selectedId) ?? null;

  function openCreate(): void {
    setEditing(null);
    setIsFormOpen(true);
  }

  function openEdit(org: OrganizationSummary): void {
    setEditing(org);
    setIsFormOpen(true);
  }

  function closeForm(): void {
    setIsFormOpen(false);
    setEditing(null);
  }

  function handleConfirmDelete(): void {
    if (!selected) return;
    deleteOrg.mutate(selected.id, {
      onSuccess: () => {
        setSelectedId(null);
        setConfirmDeleteOpen(false);
      },
    });
  }

  return (
    <div>
      <PageHeader
        title="Organizacoes"
        description="Gerencie os clientes e organizacoes da plataforma"
      />

      <OrgFormDialog isOpen={isFormOpen} onClose={closeForm} organization={editing} />

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Remover organizacao"
        message={`Tem certeza que deseja remover a organizacao "${selected?.name}" (${selected?.slug})? Esta acao nao pode ser desfeita.`}
        confirmLabel="Remover"
        onConfirm={handleConfirmDelete}
        onCancel={() => { setConfirmDeleteOpen(false); deleteOrg.reset(); }}
        isPending={deleteOrg.isPending}
        error={deleteOrg.isError ? (deleteOrg.error?.message ?? 'Erro ao remover') : null}
      />

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 p-2">
        <Button size="sm" icon={<PlusIcon />} onClick={openCreate}>
          Incluir Organizacao
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
          disabled={!selected || deleteOrg.isPending || selected.slug === 'default'}
          onClick={() => setConfirmDeleteOpen(true)}
          title={selected?.slug === 'default' ? 'A organizacao padrao nao pode ser removida' : undefined}
        >
          Remover
        </Button>
        <span className="ml-auto text-xs text-slate-500">
          {selected
            ? `Selecionado: ${selected.name}`
            : 'Selecione uma organizacao para editar ou remover.'}
        </span>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {isError && <ErrorMessage message={error?.message ?? 'Erro ao carregar organizacoes'} />}

      {!isLoading && !isError && items.length === 0 && (
        <EmptyState
          title="Nenhuma organizacao cadastrada"
          description="Inclua organizacoes para gerenciar clientes na plataforma."
        />
      )}

      {!isLoading && !isError && items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60">
                <th className="w-10 px-4 py-3" />
                <th className="px-4 py-3 text-left font-medium text-slate-400">Slug</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Plano</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Criado em</th>
              </tr>
            </thead>
            <tbody>
              {items.map((org) => {
                const isSelected = org.id === selectedId;
                return (
                  <tr
                    key={org.id}
                    onClick={() => setSelectedId(isSelected ? null : org.id)}
                    className={`cursor-pointer border-b border-slate-800/50 transition-colors last:border-0 ${
                      isSelected ? 'bg-sky-950/40' : 'hover:bg-slate-900/60'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="radio"
                        name="selected-org"
                        checked={isSelected}
                        onChange={() => setSelectedId(isSelected ? null : org.id)}
                        aria-label={`Selecionar ${org.name}`}
                        className="h-4 w-4 accent-sky-500"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">{org.slug}</td>
                    <td className="px-4 py-3 font-medium text-slate-100">{org.name}</td>
                    <td className="px-4 py-3">
                      <Badge tone={PLAN_TONE[org.plan] ?? 'default'}>
                        {PLAN_LABEL[org.plan] ?? org.plan}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(org.createdAt).toLocaleDateString('pt-BR')}
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
