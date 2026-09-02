import { type FormEvent, useEffect, useState } from 'react';

import { Button } from '../../shared/components/Button';
import { ErrorMessage } from '../../shared/components/ErrorMessage';
import { Modal } from '../../shared/components/Modal';

import { useCreateDatabaseGroup, useUpdateDatabaseGroup } from './use-database-groups';
import type { DatabaseGroup } from './use-database-groups';

const inputClass =
  'rounded border border-line bg-canvas px-3 py-2 text-slate-100 outline-none focus:border-slate-500';

interface FormState {
  name: string;
  description: string;
}

function emptyForm(): FormState {
  return { name: '', description: '' };
}

function formFromGroup(group: DatabaseGroup): FormState {
  return { name: group.name, description: group.description ?? '' };
}

// Single create/edit dialog for Agrupadores de Bancos, mirroring the
// cadastro-de-servidores pattern (ServerFormDialog): one reusable form
// component driven by an optional `group` prop, triggered from the list
// page's toolbar (Incluir/Editar) — instead of the two separate ad-hoc
// dialogs that used to live one in the list page, one in the detail page.
export function DatabaseGroupFormDialog({
  isOpen,
  onClose,
  group,
}: {
  isOpen: boolean;
  onClose: (createdId?: string) => void;
  group?: DatabaseGroup | null;
}) {
  const isEditMode = Boolean(group);
  const createGroup = useCreateDatabaseGroup();
  const updateGroup = useUpdateDatabaseGroup(group?.id ?? '');
  const mutation = isEditMode ? updateGroup : createGroup;

  const [form, setForm] = useState<FormState>(emptyForm());

  useEffect(() => {
    if (isOpen) {
      setForm(group ? formFromGroup(group) : emptyForm());
      createGroup.reset();
      updateGroup.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, group]);

  function handleClose(): void {
    onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const payload = { name: form.name.trim(), description: form.description.trim() || undefined };

    if (isEditMode && group) {
      updateGroup.mutate(payload, { onSuccess: () => onClose() });
      return;
    }

    createGroup.mutate(payload, { onSuccess: (created) => onClose(created.id) });
  }

  return (
    <Modal title={isEditMode ? 'Editar Agrupador' : 'Incluir Agrupador de Bancos'} isOpen={isOpen} onClose={handleClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {!isEditMode && (
          <p className="text-xs text-slate-500">
            Um agrupador reúne, sob um nome, um conjunto de bancos de dados do inventário — para
            documentar uma instância, empresa ou módulo, mesmo quando o mesmo banco também pertence a
            outro agrupador.
          </p>
        )}

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Nome *</span>
          <input
            autoFocus
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ex: BANCOS BBF"
            className={inputClass}
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Descrição (opcional)</span>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Para que serve este agrupador?"
            className={`${inputClass} resize-none`}
            rows={2}
          />
        </label>

        {mutation.isError && (
          <ErrorMessage
            message={mutation.error instanceof Error ? mutation.error.message : 'Erro ao salvar agrupador'}
          />
        )}

        <div className="flex justify-end gap-3 border-t border-line pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={mutation.isPending || !form.name.trim()}>
            {mutation.isPending ? 'Salvando...' : isEditMode ? 'Salvar' : 'Criar Agrupador'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
