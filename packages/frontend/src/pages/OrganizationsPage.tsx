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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkPending, setIsBulkPending] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const items = data ?? [];
  const selectedItems = items.filter((o) => selectedIds.has(o.id));
  const singleSelected = selectedItems.length === 1 ? selectedItems[0] : null;
  const deletableItems = selectedItems.filter((o) => o.slug !== 'default');
  const allVisible = items.length > 0 && items.every((o) => selectedIds.has(o.id));

  function toggleAll(): void {
    if (allVisible) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((o) => o.id)));
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

  async function handleConfirmDelete(): Promise<void> {
    if (deletableItems.length === 0) return;
    setIsBulkPending(true);
    try {
      for (const org of deletableItems) {
        await deleteOrg.mutateAsync(org.id);
      }
      setSelectedIds(new Set());
      setConfirmDeleteOpen(false);
    } finally {
      setIsBulkPending(false);
    }
  }

  const deleteLabel = deletableItems.length > 1 ? `Remover (${deletableItems.length})` : 'Remover';
  const deleteMessage =
    deletableItems.length === 1
      ? `Tem certeza que deseja remover a organizacao "${deletableItems[0]?.name}" (${deletableItems[0]?.slug})? Esta acao nao pode ser desfeita.`
      : `Tem certeza que deseja remover ${deletableItems.length} organizacoes? Esta acao nao pode ser desfeita.`;

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
        message={deleteMessage}
        confirmLabel="Remover"
        onConfirm={handleConfirmDelete}
        onCancel={() => { setConfirmDeleteOpen(false); deleteOrg.reset(); }}
        isPending={isBulkPending || deleteOrg.isPending}
        error={deleteOrg.isError ? (deleteOrg.error?.message ?? 'Erro ao remover') : null}
      />

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded border border-line bg-surface/40 p-2">
        <Button size="sm" icon={<PlusIcon />} onClick={openCreate}>
          Incluir Organizacao
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
          variant="danger"
          icon={<TrashIcon />}
          disabled={deletableItems.length === 0 || isBulkPending}
          onClick={() => setConfirmDeleteOpen(true)}
          title={
            selectedItems.length > 0 && deletableItems.length === 0
              ? 'A organizacao padrao nao pode ser removida'
              : undefined
          }
        >
          {deleteLabel}
        </Button>
        <span className="ml-auto text-xs text-slate-500">
          {selectedItems.length > 0
            ? selectedItems.length === 1
              ? `Selecionado: ${singleSelected?.name}`
              : `${selectedItems.length} organizacoes selecionadas`
            : 'Selecione organizacoes para editar ou remover.'}
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
                <th className="px-4 py-3 text-left font-medium text-slate-400">Slug</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Plano</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Criado em</th>
              </tr>
            </thead>
            <tbody>
              {items.map((org) => {
                const isSelected = selectedIds.has(org.id);
                return (
                  <tr
                    key={org.id}
                    onClick={() => toggleOne(org.id)}
                    className={`cursor-pointer border-b border-line/50 transition-colors last:border-0 ${
                      isSelected ? 'bg-signal/10' : 'hover:bg-surface/60'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(org.id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Selecionar ${org.name}`}
                        className="h-4 w-4 accent-signal"
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
