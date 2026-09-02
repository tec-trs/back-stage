import { type FormEvent, useEffect, useState } from 'react';

import { Button } from '../../shared/components/Button';
import { ErrorMessage } from '../../shared/components/ErrorMessage';
import { Modal } from '../../shared/components/Modal';

import type { DatabaseEngine } from './use-database-engines';
import { useCreateDatabaseEngine, useUpdateDatabaseEngine } from './use-database-engines';

const inputClass =
  'rounded border border-line bg-canvas px-3 py-2 text-slate-100 outline-none focus:border-slate-500';

interface FormState {
  slug: string;
  name: string;
  description: string;
  defaultPort: string;
  isActive: boolean;
}

function emptyForm(): FormState {
  return {
    slug: '',
    name: '',
    description: '',
    defaultPort: '',
    isActive: true,
  };
}

function formFromEngine(engine: DatabaseEngine): FormState {
  return {
    slug: engine.slug,
    name: engine.name,
    description: engine.description ?? '',
    defaultPort: engine.defaultPort?.toString() ?? '',
    isActive: engine.isActive,
  };
}

export function DatabaseEngineFormDialog({
  isOpen,
  onClose,
  engine,
}: {
  isOpen: boolean;
  onClose: () => void;
  engine?: DatabaseEngine | null;
}) {
  const isEditMode = Boolean(engine);
  const createEngine = useCreateDatabaseEngine();
  const updateEngine = useUpdateDatabaseEngine();
  const mutation = isEditMode ? updateEngine : createEngine;

  const [form, setForm] = useState<FormState>(emptyForm());

  useEffect(() => {
    if (isOpen) {
      setForm(engine ? formFromEngine(engine) : emptyForm());
      createEngine.reset();
      updateEngine.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, engine]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const payload = {
      slug: form.slug.trim(),
      name: form.name.trim(),
      description: form.description.trim() || null,
      defaultPort: form.defaultPort ? Number(form.defaultPort) : null,
      isActive: form.isActive,
    };

    if (isEditMode && engine) {
      updateEngine.mutate({ id: engine.id, ...payload }, { onSuccess: onClose });
      return;
    }

    createEngine.mutate(payload, { onSuccess: onClose });
  }

  return (
    <Modal
      title={isEditMode ? 'Editar Tipo de Banco' : 'Novo Tipo de Banco'}
      isOpen={isOpen}
      onClose={onClose}
      size="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-400">Slug *</span>
            <input
              required
              disabled={isEditMode}
              value={form.slug}
              onChange={(e) => setField('slug', e.target.value)}
              placeholder="postgresql"
              className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-70`}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-400">Nome *</span>
            <input
              required
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="PostgreSQL"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-400">Descricao</span>
            <textarea
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              rows={3}
              placeholder="PostgreSQL relational database"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-400">Porta Padrao</span>
            <input
              type="number"
              min={1}
              max={65535}
              value={form.defaultPort}
              onChange={(e) => setField('defaultPort', e.target.value)}
              placeholder="5432"
              className={inputClass}
            />
          </label>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => setField('isActive', e.target.checked)}
              className="h-4 w-4 accent-signal"
            />
            <label htmlFor="isActive" className="text-sm text-slate-400 cursor-pointer">
              Ativo
            </label>
          </div>
        </fieldset>

        {mutation.isError && (
          <ErrorMessage
            message={
              mutation.error instanceof Error
                ? mutation.error.message
                : 'Erro ao salvar tipo de banco'
            }
          />
        )}

        <div className="flex justify-end gap-3 border-t border-line pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending
              ? 'Salvando...'
              : isEditMode
                ? 'Salvar alteracoes'
                : 'Criar tipo de banco'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
