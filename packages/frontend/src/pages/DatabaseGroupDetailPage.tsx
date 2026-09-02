import { type FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { DatabaseGroupFormDialog } from '../features/database-groups/DatabaseGroupFormDialog';
import {
  useAddDatabaseGroupApplication,
  useAddDatabaseGroupMember,
  useDatabaseGroup,
  useDeleteDatabaseGroup,
  useRemoveDatabaseGroupApplication,
  useRemoveDatabaseGroupMember,
} from '../features/database-groups/use-database-groups';
import { useAllDatabases } from '../features/databases/use-databases';
import { ResourceSelector } from '../features/resource-graph/ResourceSelector';
import { Button } from '../shared/components/Button';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { PencilIcon, PlusIcon, TrashIcon } from '../shared/components/icons';
import { Modal } from '../shared/components/Modal';
import { PageHeader } from '../shared/components/PageHeader';
import { Spinner } from '../shared/components/Spinner';

const CRITICALITY_LABEL: Record<string, string> = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

// Bulk add: a checklist of every banco not already in the agrupador, instead
// of the single-pick ResourceSelector — picking 9+ bancos one at a time
// (reopening this dialog each time) is exactly the friction this agrupador
// feature was meant to remove. There's no bulk endpoint on the backend; each
// checked banco is added with its own request, run in parallel and settled
// together so one failure doesn't silently drop the rest.
function AddDatabasesDialog({
  isOpen,
  onClose,
  groupId,
  existingDatabaseIds,
}: {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  existingDatabaseIds: Set<string>;
}) {
  const { data: allDatabases, isLoading } = useAllDatabases();
  const addMember = useAddDatabaseGroupMember(groupId);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [submitError, setSubmitError] = useState<string | undefined>();

  const availableDatabases = useMemo(() => {
    const list = (allDatabases ?? []).filter((db) => !existingDatabaseIds.has(db.id));
    if (!search.trim()) return list;
    const term = search.toLowerCase();
    return list.filter((db) => (db.displayName || db.name).toLowerCase().includes(term));
  }, [allDatabases, existingDatabaseIds, search]);

  const allFilteredSelected = availableDatabases.length > 0 && availableDatabases.every((db) => selectedIds.has(db.id));

  function toggleOne(id: string): void {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllFiltered(): void {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        for (const db of availableDatabases) next.delete(db.id);
      } else {
        for (const db of availableDatabases) next.add(db.id);
      }
      return next;
    });
  }

  function handleClose(): void {
    setSearch('');
    setSelectedIds(new Set());
    setSubmitError(undefined);
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setSubmitError(undefined);

    const results = await Promise.allSettled(ids.map((databaseId) => addMember.mutateAsync(databaseId)));
    const succeededIds = new Set(ids.filter((_, i) => results[i].status === 'fulfilled'));
    const failedCount = ids.length - succeededIds.size;

    if (failedCount > 0) {
      // Leave the dialog open with only the failed bancos still checked, so
      // the user can retry without re-picking everything.
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of succeededIds) next.delete(id);
        return next;
      });
      setSubmitError(
        `${failedCount} de ${ids.length} banco(s) não foram adicionados — verifique e tente novamente.`,
      );
      return;
    }

    handleClose();
  }

  return (
    <Modal title="Adicionar Bancos ao Agrupador" isOpen={isOpen} onClose={handleClose} size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar banco..."
          autoFocus
          className="rounded border border-line bg-canvas px-3 py-2 text-slate-100 outline-none focus:border-slate-500"
        />

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : availableDatabases.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            {search ? 'Nenhum banco encontrado' : 'Todos os bancos do inventário já estão neste agrupador'}
          </p>
        ) : (
          <div className="flex flex-col rounded border border-line">
            <label className="flex cursor-pointer items-center gap-2 border-b border-line bg-surface/60 px-3 py-2 text-xs font-medium text-slate-400">
              <input
                type="checkbox"
                checked={allFilteredSelected}
                onChange={toggleAllFiltered}
                className="h-4 w-4 accent-signal"
              />
              Selecionar todos ({availableDatabases.length})
            </label>
            <div className="max-h-72 overflow-y-auto">
              {availableDatabases.map((db) => {
                const isSelected = selectedIds.has(db.id);
                return (
                  <div
                    key={db.id}
                    onClick={() => toggleOne(db.id)}
                    className={`flex cursor-pointer items-center gap-2 border-b border-line/50 px-3 py-2 text-sm last:border-0 ${
                      isSelected ? 'bg-signal/10' : 'hover:bg-surface/60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(db.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Selecionar ${db.displayName || db.name}`}
                      className="h-4 w-4 accent-signal"
                    />
                    <span className="font-medium text-slate-200">{db.displayName || db.name}</span>
                    {db.hostedOnServerHostname && (
                      <span className="ml-auto text-xs text-slate-500">{db.hostedOnServerHostname}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {submitError && <ErrorMessage message={submitError} />}

        <div className="flex items-center justify-between border-t border-line pt-4">
          <span className="text-xs text-slate-500">
            {selectedIds.size > 0 ? `${selectedIds.size} selecionado(s)` : ''}
          </span>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={addMember.isPending || selectedIds.size === 0}>
              {addMember.isPending ? 'Adicionando...' : `Adicionar${selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}`}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function AddApplicationDialog({
  isOpen,
  onClose,
  groupId,
}: {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
}) {
  const [applicationId, setApplicationId] = useState('');
  const addApplication = useAddDatabaseGroupApplication(groupId);

  function handleClose(): void {
    setApplicationId('');
    addApplication.reset();
    onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!applicationId) return;
    addApplication.mutate(applicationId, { onSuccess: () => handleClose() });
  }

  return (
    <Modal title="Novo Relacionamento (Aplicação)" isOpen={isOpen} onClose={handleClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-xs text-slate-500">
          Marca esta aplicação como usuária deste agrupador, independente de já existir um
          relacionamento real cadastrado para cada banco individualmente.
        </p>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Aplicação *</span>
          <ResourceSelector
            resourceType="application"
            value={applicationId}
            onChange={setApplicationId}
            placeholder="Buscar aplicação..."
          />
        </label>
        {addApplication.isError && (
          <ErrorMessage
            message={addApplication.error instanceof Error ? addApplication.error.message : 'Erro ao documentar aplicação'}
          />
        )}
        <div className="flex justify-end gap-3 border-t border-line pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={addApplication.isPending || !applicationId}>
            {addApplication.isPending ? 'Adicionando...' : 'Adicionar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function DatabaseGroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: group, isLoading, isError, error } = useDatabaseGroup(id ?? null);
  const removeMember = useRemoveDatabaseGroupMember(id ?? '');
  const removeApplication = useRemoveDatabaseGroupApplication(id ?? '');
  const deleteGroup = useDeleteDatabaseGroup();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAddApplicationOpen, setIsAddApplicationOpen] = useState(false);

  const existingDatabaseIds = useMemo(
    () => new Set((group?.members ?? []).map((m) => m.databaseId)),
    [group],
  );

  function handleDeleteGroup(): void {
    if (!id) return;
    if (!confirm(`Tem certeza que deseja eliminar o agrupador "${group?.name}"? Os bancos em si não são afetados.`)) return;
    deleteGroup.mutate(id, { onSuccess: () => navigate('/database-groups') });
  }

  if (isLoading) {
    return (
      <div>
        <Link to="/database-groups" className="text-sm text-slate-400 hover:underline">
          &larr; Voltar aos agrupadores
        </Link>
        <Spinner />
      </div>
    );
  }

  if (isError || !group) {
    return (
      <div>
        <Link to="/database-groups" className="text-sm text-slate-400 hover:underline">
          &larr; Voltar aos agrupadores
        </Link>
        <ErrorMessage message={error instanceof Error ? error.message : 'Agrupador não encontrado'} />
      </div>
    );
  }

  return (
    <div>
      <Link to="/database-groups" className="text-sm text-slate-400 hover:underline">
        &larr; Voltar aos agrupadores
      </Link>

      <PageHeader
        title={group.name}
        description={group.description || 'Sem descrição'}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsAddApplicationOpen(true)}>
              + Relacionamento
            </Button>
            <Button variant="secondary" size="sm" icon={<PencilIcon />} onClick={() => setIsEditOpen(true)}>
              Editar
            </Button>
            <Button variant="ghost-danger" size="sm" icon={<TrashIcon />} onClick={handleDeleteGroup}>
              Eliminar Agrupador
            </Button>
          </div>
        }
      />

      <DatabaseGroupFormDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        group={group}
      />
      <AddDatabasesDialog
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        groupId={group.id}
        existingDatabaseIds={existingDatabaseIds}
      />
      <AddApplicationDialog
        isOpen={isAddApplicationOpen}
        onClose={() => setIsAddApplicationOpen(false)}
        groupId={group.id}
      />

      <div className="mb-4 mt-6 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300">Bancos ({group.members.length})</h2>
        <Button size="sm" icon={<PlusIcon />} onClick={() => setIsAddMemberOpen(true)}>
          Adicionar Banco
        </Button>
      </div>

      {group.members.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 rounded border border-dashed border-line p-10 text-center">
          <p className="font-medium text-slate-200">Este agrupador ainda não tem bancos</p>
          <p className="text-sm text-slate-500">Use &quot;Adicionar Banco&quot; para começar a documentar este conjunto.</p>
        </div>
      ) : (
        <div className="mb-8 overflow-hidden rounded border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium">Nome</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Criticidade</th>
                <th className="px-4 py-2 font-medium">Hospedado em</th>
                <th className="w-10 px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {group.members.map((member) => (
                <tr key={member.id} className="border-t border-line">
                  <td className="px-4 py-2 font-medium text-slate-200">{member.displayName || member.name}</td>
                  <td className="px-4 py-2 text-slate-400 capitalize">{member.status || '—'}</td>
                  <td className="px-4 py-2 text-slate-400">
                    {member.criticality ? CRITICALITY_LABEL[member.criticality] ?? member.criticality : '—'}
                  </td>
                  <td className="px-4 py-2 text-slate-400">{member.hostedOnServerLabel || '—'}</td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => removeMember.mutate(member.id)}
                      className="text-slate-500 hover:text-red-400"
                      title="Remover deste agrupador"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300">
          Aplicações que usam este agrupador ({group.applications.length})
        </h2>
      </div>

      {group.applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 rounded border border-dashed border-line p-10 text-center">
          <p className="font-medium text-slate-200">Nenhuma aplicação documentada ainda</p>
          <p className="text-sm text-slate-500">
            Use &quot;+ Relacionamento&quot;, no topo da página, para registrar quem usa este agrupador.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium">Nome</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="w-10 px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {group.applications.map((link) => (
                <tr key={link.id} className="border-t border-line">
                  <td className="px-4 py-2 font-medium text-slate-200">{link.displayName || link.applicationId}</td>
                  <td className="px-4 py-2 text-slate-400 capitalize">{link.status || '—'}</td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => removeApplication.mutate(link.id)}
                      className="text-slate-500 hover:text-red-400"
                      title="Remover deste agrupador"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
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
