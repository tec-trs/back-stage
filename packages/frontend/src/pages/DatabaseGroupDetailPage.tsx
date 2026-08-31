import { type FormEvent, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import {
  useAddDatabaseGroupApplication,
  useAddDatabaseGroupMember,
  useDatabaseGroup,
  useDeleteDatabaseGroup,
  useRemoveDatabaseGroupApplication,
  useRemoveDatabaseGroupMember,
  useUpdateDatabaseGroup,
} from '../features/database-groups/use-database-groups';
import { ResourceSelector } from '../features/resource-graph/ResourceSelector';
import { Button } from '../shared/components/Button';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { PencilIcon, PlusIcon, TrashIcon } from '../shared/components/icons';
import { Modal } from '../shared/components/Modal';
import { PageHeader } from '../shared/components/PageHeader';
import { Spinner } from '../shared/components/Spinner';

const inputClass =
  'rounded-md border border-slate-700 bg-canvas px-3 py-2 text-slate-100 outline-none focus:border-slate-500';

const CRITICALITY_LABEL: Record<string, string> = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

function EditGroupDialog({
  isOpen,
  onClose,
  groupId,
  initialName,
  initialDescription,
}: {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  initialName: string;
  initialDescription: string;
}) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const updateGroup = useUpdateDatabaseGroup(groupId);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    updateGroup.mutate(
      { name: name.trim(), description: description.trim() || undefined },
      { onSuccess: () => onClose() },
    );
  }

  return (
    <Modal title="Editar Agrupador" isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Nome *</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Descrição (opcional)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputClass} resize-none`}
            rows={2}
          />
        </label>
        {updateGroup.isError && (
          <ErrorMessage
            message={updateGroup.error instanceof Error ? updateGroup.error.message : 'Erro ao salvar agrupador'}
          />
        )}
        <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={updateGroup.isPending || !name.trim()}>
            {updateGroup.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function AddMemberDialog({
  isOpen,
  onClose,
  groupId,
}: {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
}) {
  const [databaseId, setDatabaseId] = useState('');
  const addMember = useAddDatabaseGroupMember(groupId);

  function handleClose(): void {
    setDatabaseId('');
    addMember.reset();
    onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!databaseId) return;
    addMember.mutate(databaseId, { onSuccess: () => handleClose() });
  }

  return (
    <Modal title="Adicionar Banco ao Agrupador" isOpen={isOpen} onClose={handleClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Banco de Dados *</span>
          <ResourceSelector resourceType="database" value={databaseId} onChange={setDatabaseId} placeholder="Buscar banco..." />
        </label>
        {addMember.isError && (
          <ErrorMessage
            message={addMember.error instanceof Error ? addMember.error.message : 'Erro ao adicionar banco'}
          />
        )}
        <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={addMember.isPending || !databaseId}>
            {addMember.isPending ? 'Adicionando...' : 'Adicionar'}
          </Button>
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
    <Modal title="Documentar Aplicação neste Agrupador" isOpen={isOpen} onClose={handleClose}>
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
        <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
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
            <Button variant="secondary" size="sm" icon={<PencilIcon />} onClick={() => setIsEditOpen(true)}>
              Editar
            </Button>
            <Button variant="ghost-danger" size="sm" icon={<TrashIcon />} onClick={handleDeleteGroup}>
              Eliminar Agrupador
            </Button>
          </div>
        }
      />

      <EditGroupDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        groupId={group.id}
        initialName={group.name}
        initialDescription={group.description ?? ''}
      />
      <AddMemberDialog isOpen={isAddMemberOpen} onClose={() => setIsAddMemberOpen(false)} groupId={group.id} />
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
        <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-800 p-10 text-center">
          <p className="font-medium text-slate-200">Este agrupador ainda não tem bancos</p>
          <p className="text-sm text-slate-500">Use &quot;Adicionar Banco&quot; para começar a documentar este conjunto.</p>
        </div>
      ) : (
        <div className="mb-8 overflow-hidden rounded-lg border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400">
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
                <tr key={member.id} className="border-t border-slate-800">
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
        <Button size="sm" icon={<PlusIcon />} onClick={() => setIsAddApplicationOpen(true)}>
          Adicionar Aplicação
        </Button>
      </div>

      {group.applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-800 p-10 text-center">
          <p className="font-medium text-slate-200">Nenhuma aplicação documentada ainda</p>
          <p className="text-sm text-slate-500">
            Use &quot;Adicionar Aplicação&quot; para registrar quem usa este agrupador.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium">Nome</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="w-10 px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {group.applications.map((link) => (
                <tr key={link.id} className="border-t border-slate-800">
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
