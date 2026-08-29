import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '../shared/components/Button';
import { EmptyState } from '../shared/components/EmptyState';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { Modal } from '../shared/components/Modal';
import { PageHeader } from '../shared/components/PageHeader';
import { PlusIcon } from '../shared/components/icons';
import { Spinner } from '../shared/components/Spinner';
import { useCreateRelationshipMap, useRelationshipMaps } from '../features/relationship-maps/use-relationship-maps';

const inputClass =
  'rounded-md border border-slate-700 bg-canvas px-3 py-2 text-slate-100 outline-none focus:border-slate-500';

function CreateMapDialog({ isOpen, onClose }: { isOpen: boolean; onClose: (createdId?: string) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const createMap = useCreateRelationshipMap();

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    createMap.mutate(
      { name: name.trim(), description: description.trim() || undefined },
      {
        onSuccess: (map) => {
          setName('');
          setDescription('');
          createMap.reset();
          onClose(map.id);
        },
      },
    );
  }

  function handleClose(): void {
    setName('');
    setDescription('');
    createMap.reset();
    onClose();
  }

  return (
    <Modal title="Novo Mapa" isOpen={isOpen} onClose={handleClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-xs text-slate-500">
          Um mapa agrupa, sob um nome, uma seleção de relacionamentos reais do inventário — para
          documentar uma arquitetura, um fluxo ou uma dependência específica.
        </p>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Nome *</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Arquitetura TOTVS GPS"
            className={inputClass}
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Descrição (opcional)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Para que serve este mapa?"
            className={`${inputClass} resize-none`}
            rows={2}
          />
        </label>

        {createMap.isError && (
          <ErrorMessage
            message={createMap.error instanceof Error ? createMap.error.message : 'Erro ao criar mapa'}
          />
        )}

        <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createMap.isPending || !name.trim()}>
            {createMap.isPending ? 'Criando...' : 'Criar Mapa'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function RelationshipMapsPage() {
  const { data, isLoading, isError, error } = useRelationshipMaps();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader
        title="Mapas"
        description="Coleções nomeadas de relacionamentos reais do inventário, para documentar arquiteturas e fluxos específicos"
        actions={
          <Button icon={<PlusIcon />} onClick={() => setIsCreateOpen(true)}>
            Novo Mapa
          </Button>
        }
      />

      <CreateMapDialog
        isOpen={isCreateOpen}
        onClose={(createdId) => {
          setIsCreateOpen(false);
          if (createdId) navigate(`/relationship-maps/${createdId}`);
        }}
      />

      {isLoading && <Spinner />}
      {isError && (
        <ErrorMessage message={error instanceof Error ? error.message : 'Erro ao carregar mapas'} />
      )}
      {data && data.length === 0 && (
        <EmptyState
          title="Nenhum mapa cadastrado"
          description='Crie um mapa e comece a adicionar relacionamentos com "Novo Mapa".'
        />
      )}

      {data && data.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium">Nome</th>
                <th className="px-4 py-2 font-medium">Descrição</th>
                <th className="px-4 py-2 font-medium">Relacionamentos</th>
                <th className="px-4 py-2 font-medium">Atualizado em</th>
              </tr>
            </thead>
            <tbody>
              {data.map((map) => (
                <tr key={map.id} className="border-t border-slate-800 hover:bg-slate-900/50">
                  <td className="px-4 py-2">
                    <Link to={`/relationship-maps/${map.id}`} className="font-medium text-slate-100 hover:underline">
                      {map.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-400">{map.description || '—'}</td>
                  <td className="px-4 py-2 font-mono text-slate-300">{map.memberCount}</td>
                  <td className="px-4 py-2 text-slate-500">
                    {new Date(map.updatedAt).toLocaleDateString('pt-BR')}
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
