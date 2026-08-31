import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useCreateDatabaseGroup, useDatabaseGroups } from '../features/database-groups/use-database-groups';
import { Button } from '../shared/components/Button';
import { EmptyState } from '../shared/components/EmptyState';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { PlusIcon } from '../shared/components/icons';
import { Modal } from '../shared/components/Modal';
import { PageHeader } from '../shared/components/PageHeader';
import { Spinner } from '../shared/components/Spinner';

const inputClass =
  'rounded-md border border-slate-700 bg-canvas px-3 py-2 text-slate-100 outline-none focus:border-slate-500';

function CreateGroupDialog({ isOpen, onClose }: { isOpen: boolean; onClose: (createdId?: string) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const createGroup = useCreateDatabaseGroup();

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    createGroup.mutate(
      { name: name.trim(), description: description.trim() || undefined },
      {
        onSuccess: (group) => {
          setName('');
          setDescription('');
          createGroup.reset();
          onClose(group.id);
        },
      },
    );
  }

  function handleClose(): void {
    setName('');
    setDescription('');
    createGroup.reset();
    onClose();
  }

  return (
    <Modal title="Novo Agrupador de Bancos" isOpen={isOpen} onClose={handleClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-xs text-slate-500">
          Um agrupador reúne, sob um nome, um conjunto de bancos de dados do inventário — para
          documentar uma instância, empresa ou módulo, mesmo quando o mesmo banco também pertence a
          outro agrupador.
        </p>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Nome *</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: BANCOS BBF"
            className={inputClass}
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Descrição (opcional)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Para que serve este agrupador?"
            className={`${inputClass} resize-none`}
            rows={2}
          />
        </label>

        {createGroup.isError && (
          <ErrorMessage
            message={createGroup.error instanceof Error ? createGroup.error.message : 'Erro ao criar agrupador'}
          />
        )}

        <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createGroup.isPending || !name.trim()}>
            {createGroup.isPending ? 'Criando...' : 'Criar Agrupador'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function DatabaseGroupsPage() {
  const { data, isLoading, isError, error } = useDatabaseGroups();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader
        title="Agrupadores de Bancos"
        description="Coleções nomeadas de bancos de dados do inventário, para documentar instâncias, empresas ou módulos que fazem mais sentido discutidos em conjunto"
        actions={
          <Button icon={<PlusIcon />} onClick={() => setIsCreateOpen(true)}>
            Novo Agrupador
          </Button>
        }
      />

      <CreateGroupDialog
        isOpen={isCreateOpen}
        onClose={(createdId) => {
          setIsCreateOpen(false);
          if (createdId) navigate(`/database-groups/${createdId}`);
        }}
      />

      {isLoading && <Spinner />}
      {isError && (
        <ErrorMessage message={error instanceof Error ? error.message : 'Erro ao carregar agrupadores'} />
      )}
      {data && data.length === 0 && (
        <EmptyState
          title="Nenhum agrupador cadastrado"
          description='Crie um agrupador e comece a adicionar bancos com "Novo Agrupador".'
        />
      )}

      {data && data.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium">Nome</th>
                <th className="px-4 py-2 font-medium">Descrição</th>
                <th className="px-4 py-2 font-medium">Bancos</th>
                <th className="px-4 py-2 font-medium">Aplicações</th>
                <th className="px-4 py-2 font-medium">Atualizado em</th>
              </tr>
            </thead>
            <tbody>
              {data.map((group) => (
                <tr key={group.id} className="border-t border-slate-800 hover:bg-slate-900/50">
                  <td className="px-4 py-2">
                    <Link to={`/database-groups/${group.id}`} className="font-medium text-slate-100 hover:underline">
                      {group.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-400">{group.description || '—'}</td>
                  <td className="px-4 py-2 font-mono text-slate-300">{group.memberCount}</td>
                  <td className="px-4 py-2 font-mono text-slate-300">{group.applicationCount}</td>
                  <td className="px-4 py-2 text-slate-500">
                    {new Date(group.updatedAt).toLocaleDateString('pt-BR')}
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
