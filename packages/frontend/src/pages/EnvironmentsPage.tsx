import { useState } from 'react';

import { EnvironmentFormDialog } from '../features/environments/EnvironmentFormDialog';
import { useDeleteEnvironment } from '../features/environments/use-delete-environment';
import { useEnvironments } from '../features/environments/use-environments';
import type { EnvironmentSummary } from '../features/environments/use-environments';
import { useUpdateEnvironment } from '../features/environments/use-update-environment';
import { Badge } from '../shared/components/Badge';
import { Button } from '../shared/components/Button';
import { ConfirmDialog } from '../shared/components/ConfirmDialog';
import { EmptyState } from '../shared/components/EmptyState';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { PencilIcon, PlusIcon, PowerIcon, TrashIcon } from '../shared/components/icons';
import { PageHeader } from '../shared/components/PageHeader';
import { Spinner } from '../shared/components/Spinner';

const COLOR_LABEL: Record<string, string> = {
  danger: 'Vermelho',
  warning: 'Amarelo',
  success: 'Verde',
  default: 'Cinza',
};

export function EnvironmentsPage() {
  const { data, isLoading, isError, error } = useEnvironments();
  const deleteEnvironment = useDeleteEnvironment();
  const updateEnvironment = useUpdateEnvironment();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEnvironment, setEditingEnvironment] = useState<EnvironmentSummary | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const items = data ?? [];
  const selected = items.find((e) => e.id === selectedId) ?? null;

  function openCreate(): void {
    setEditingEnvironment(null);
    setIsFormOpen(true);
  }

  function openEdit(env: EnvironmentSummary): void {
    setEditingEnvironment(env);
    setIsFormOpen(true);
  }

  function closeDialog(): void {
    setIsFormOpen(false);
    setEditingEnvironment(null);
  }

  function handleToggleActive(): void {
    if (!selected) return;
    updateEnvironment.mutate({
      id: selected.id,
      isActive: !selected.isActive,
    });
  }

  function handleDeleteSelected(): void {
    if (selected) setConfirmDeleteOpen(true);
  }

  function handleConfirmDelete(): void {
    if (!selected) return;
    deleteEnvironment.mutate(selected.id, {
      onSuccess: () => {
        setSelectedId(null);
        setConfirmDeleteOpen(false);
      },
    });
  }

  function closeConfirmDelete(): void {
    setConfirmDeleteOpen(false);
    deleteEnvironment.reset();
  }

  return (
    <div>
      <PageHeader
        title="Ambientes"
        description="Ambientes de infraestrutura utilizados por servidores e implantacoes"
      />

      <EnvironmentFormDialog
        isOpen={isFormOpen}
        onClose={closeDialog}
        environment={editingEnvironment}
      />

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Eliminar ambiente"
        message={`Tem certeza que deseja eliminar o ambiente "${selected?.name}" (${selected?.slug})? Servidores e implantacoes que referenciam este slug nao serao afetados imediatamente.`}
        confirmLabel="Eliminar"
        onConfirm={handleConfirmDelete}
        onCancel={closeConfirmDelete}
        isPending={deleteEnvironment.isPending}
        error={
          deleteEnvironment.isError
            ? (deleteEnvironment.error?.message ?? 'Erro ao eliminar ambiente')
            : null
        }
      />

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 p-2">
        <Button size="sm" icon={<PlusIcon />} onClick={openCreate} title="Incluir novo ambiente">
          Incluir Ambiente
        </Button>
        <div className="mx-1 h-6 w-px bg-slate-800" />
        <Button
          size="sm"
          variant="secondary"
          icon={<PencilIcon />}
          disabled={!selected}
          onClick={() => selected && openEdit(selected)}
          title={selected ? `Editar ${selected.name}` : 'Selecione um ambiente para editar'}
        >
          Editar
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<PowerIcon />}
          disabled={!selected || updateEnvironment.isPending}
          onClick={handleToggleActive}
          title={
            selected
              ? selected.isActive
                ? `Desativar ${selected.name}`
                : `Ativar ${selected.name}`
              : 'Selecione um ambiente'
          }
        >
          {selected?.isActive ? 'Desativar' : 'Ativar'}
        </Button>
        <Button
          size="sm"
          variant="danger"
          icon={<TrashIcon />}
          disabled={!selected || deleteEnvironment.isPending}
          onClick={handleDeleteSelected}
          title={selected ? `Eliminar ${selected.name}` : 'Selecione um ambiente para eliminar'}
        >
          Eliminar
        </Button>
        <span className="ml-auto text-xs text-slate-500">
          {selected
            ? `Selecionado: ${selected.name} (${selected.slug})`
            : 'Selecione um ambiente para editar, ativar/desativar ou eliminar.'}
        </span>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {isError && <ErrorMessage message={error?.message ?? 'Erro ao carregar ambientes'} />}

      {!isLoading && !isError && items.length === 0 && (
        <EmptyState
          title="Nenhum ambiente cadastrado"
          description="Inclua ambientes para utilizar nos cadastros de servidores e implantacoes."
        />
      )}

      {!isLoading && !isError && items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60">
                <th className="w-10 px-4 py-3" />
                <th className="px-4 py-3 text-left font-medium text-slate-400">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Slug</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Descricao</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Cor</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Situacao</th>
              </tr>
            </thead>
            <tbody>
              {items.map((env) => {
                const isSelected = env.id === selectedId;
                return (
                  <tr
                    key={env.id}
                    onClick={() => setSelectedId(isSelected ? null : env.id)}
                    className={`cursor-pointer border-b border-slate-800/50 transition-colors last:border-0 ${
                      isSelected ? 'bg-sky-950/40' : 'hover:bg-slate-900/60'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="radio"
                        name="selected-env"
                        checked={isSelected}
                        onChange={() => setSelectedId(isSelected ? null : env.id)}
                        aria-label={`Selecionar ${env.name}`}
                        className="h-4 w-4 accent-sky-500"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-100">{env.name}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{env.slug}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {env.description ?? <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={env.color}>{COLOR_LABEL[env.color] ?? env.color}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={env.isActive ? 'success' : 'danger'}>
                        {env.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
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
