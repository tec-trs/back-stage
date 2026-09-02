import { type FormEvent, useState } from 'react';
import { Button } from '../../shared/components/Button';
import { ErrorMessage } from '../../shared/components/ErrorMessage';
import { Modal } from '../../shared/components/Modal';
import {
  useCreateRelationshipRegistration,
  useUpdateRelationshipRegistration,
  type RelationshipRegistration,
} from './use-relationship-registrations';

const inputClass =
  'rounded border border-line bg-canvas px-3 py-2 text-slate-100 outline-none focus:border-slate-500';

interface RelationshipRegistrationDialogProps {
  isOpen: boolean;
  onClose: (createdId?: string) => void;
  registration?: RelationshipRegistration;
}

export function RelationshipRegistrationDialog({
  isOpen,
  onClose,
  registration,
}: RelationshipRegistrationDialogProps) {
  const [name, setName] = useState(registration?.name ?? '');
  const [description, setDescription] = useState(registration?.description ?? '');

  const createRegistration = useCreateRelationshipRegistration();
  const updateRegistration = useUpdateRelationshipRegistration(registration?.id ?? '');
  const isEditing = Boolean(registration);
  const mutation = isEditing ? updateRegistration : createRegistration;

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    mutation.mutate(
      { name: name.trim(), description: description.trim() || undefined },
      {
        onSuccess: (result) => {
          setName('');
          setDescription('');
          mutation.reset();
          onClose(isEditing ? undefined : result.id);
        },
      },
    );
  }

  function handleClose(): void {
    setName(registration?.name ?? '');
    setDescription(registration?.description ?? '');
    mutation.reset();
    onClose();
  }

  return (
    <Modal
      title={isEditing ? 'Editar Cadastro' : 'Novo Cadastro'}
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-xs text-slate-500">
          {isEditing
            ? 'Atualize o nome e descrição deste cadastro de relacionamentos.'
            : 'Um cadastro de relacionamentos agrupa relacionamentos reais do inventário sob um nome único para documentar dependências e fluxos específicos.'}
        </p>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Nome *</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Integração SAP-MySQL"
            className={inputClass}
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Descrição (opcional)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Para que serve este cadastro?"
            className={`${inputClass} resize-none`}
            rows={2}
          />
        </label>

        {mutation.isError && (
          <ErrorMessage
            message={mutation.error instanceof Error ? mutation.error.message : 'Erro ao salvar cadastro'}
          />
        )}

        <div className="flex justify-end gap-3 border-t border-line pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={mutation.isPending || !name.trim()}>
            {mutation.isPending ? (isEditing ? 'Salvando...' : 'Criando...') : isEditing ? 'Salvar' : 'Criar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
