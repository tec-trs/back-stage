import { type FormEvent, useEffect, useState } from 'react';

import { Button } from '../../shared/components/Button';
import { ErrorMessage } from '../../shared/components/ErrorMessage';
import { Modal } from '../../shared/components/Modal';
import type { CreateApplicationTypeInput } from './use-create-application-type';
import { useCreateApplicationType } from './use-create-application-type';
import type { UpdateApplicationTypeInput } from './use-update-application-type';
import { useUpdateApplicationType } from './use-update-application-type';
import type { ApplicationTypeSummary } from './use-application-types';

const SLUG_RE = /^[a-z0-9_-]*$/;

const inputClass =
  'rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-slate-500';

interface FormState {
  slug: string;
  name: string;
  description: string;
  isActive: boolean;
}

function emptyForm(): FormState {
  return { slug: '', name: '', description: '', isActive: true };
}

function formFrom(item: ApplicationTypeSummary): FormState {
  return {
    slug: item.slug,
    name: item.name,
    description: item.description ?? '',
    isActive: item.isActive,
  };
}

export function ApplicationTypeFormDialog({
  isOpen,
  onClose,
  applicationType,
}: {
  isOpen: boolean;
  onClose: () => void;
  applicationType?: ApplicationTypeSummary | null;
}) {
  const isEditMode = Boolean(applicationType);
  const create = useCreateApplicationType();
  const update = useUpdateApplicationType();
  const mutation = isEditMode ? update : create;

  const [form, setForm] = useState<FormState>(emptyForm());
  const [slugError, setSlugError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setForm(applicationType ? formFrom(applicationType) : emptyForm());
      setSlugError(null);
      create.reset();
      update.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, applicationType]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]): void {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();

    if (!isEditMode) {
      if (form.slug.length < 2 || !SLUG_RE.test(form.slug)) {
        setSlugError('Minimo 2 caracteres: letras minusculas, numeros, hifen e underscore');
        return;
      }
    }
    setSlugError(null);

    if (isEditMode && applicationType) {
      const input: UpdateApplicationTypeInput = {
        id: applicationType.id,
        name: form.name,
        description: form.description.trim() || null,
        isActive: form.isActive,
      };
      update.mutate(input, { onSuccess: onClose });
      return;
    }

    const input: CreateApplicationTypeInput = {
      slug: form.slug,
      name: form.name,
      description: form.description.trim() || null,
      isActive: form.isActive,
    };
    create.mutate(input, { onSuccess: onClose });
  }

  return (
    <Modal
      title={isEditMode ? 'Editar Tipo de Aplicacao' : 'Incluir Tipo de Aplicacao'}
      isOpen={isOpen}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Slug (identificador) *</span>
          <input
            required
            disabled={isEditMode}
            value={form.slug}
            onChange={(e) => {
              setField('slug', e.target.value);
              if (slugError) setSlugError(null);
            }}
            placeholder="api_backend"
            className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-70 font-mono`}
          />
          {isEditMode ? (
            <span className="text-xs text-slate-500">O slug nao pode ser alterado apos o cadastro.</span>
          ) : (
            slugError && <span className="text-xs text-red-400">{slugError}</span>
          )}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Nome *</span>
          <input
            required
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="API / Backend"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Descricao</span>
          <textarea
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            rows={2}
            className={inputClass}
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setField('isActive', e.target.checked)}
            className="rounded border-slate-700 bg-slate-950"
          />
          Ativo
        </label>

        {mutation.isError && (
          <ErrorMessage
            message={mutation.error instanceof Error ? mutation.error.message : 'Erro ao salvar'}
          />
        )}

        <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Salvando...' : isEditMode ? 'Salvar alteracoes' : 'Criar tipo'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
