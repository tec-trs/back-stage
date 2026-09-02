import { type FormEvent, useEffect, useState } from 'react';

import { Button } from '../../shared/components/Button';
import { ErrorMessage } from '../../shared/components/ErrorMessage';
import { Modal } from '../../shared/components/Modal';
import type { CreateEnvironmentInput } from './use-create-environment';
import { useCreateEnvironment } from './use-create-environment';
import type { UpdateEnvironmentInput } from './use-update-environment';
import { useUpdateEnvironment } from './use-update-environment';
import type { EnvironmentColor, EnvironmentSummary } from './use-environments';

const COLOR_OPTIONS: { value: EnvironmentColor; label: string }[] = [
  { value: 'danger', label: 'Vermelho (Produção)' },
  { value: 'warning', label: 'Amarelo (Homologação)' },
  { value: 'success', label: 'Verde (Seguro)' },
  { value: 'default', label: 'Cinza (Outros)' },
];

const SLUG_RE = /^[a-z0-9_-]*$/;

interface FormState {
  slug: string;
  name: string;
  description: string;
  color: EnvironmentColor;
  isActive: boolean;
}

function emptyForm(): FormState {
  return { slug: '', name: '', description: '', color: 'default', isActive: true };
}

function fromEnvironment(env: EnvironmentSummary): FormState {
  return {
    slug: env.slug,
    name: env.name,
    description: env.description ?? '',
    color: env.color,
    isActive: env.isActive,
  };
}

interface EnvironmentFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  environment: EnvironmentSummary | null;
}

export function EnvironmentFormDialog({ isOpen, onClose, environment }: EnvironmentFormDialogProps) {
  const isEditing = environment !== null;
  const createEnvironment = useCreateEnvironment();
  const updateEnvironment = useUpdateEnvironment();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [slugError, setSlugError] = useState('');

  const mutation = isEditing ? updateEnvironment : createEnvironment;
  const isPending = mutation.isPending;
  const isError = mutation.isError;
  const errorMessage = mutation.error?.message ?? null;

  useEffect(() => {
    if (isOpen) {
      setForm(isEditing ? fromEnvironment(environment) : emptyForm());
      setSlugError('');
      mutation.reset();
    }
  }, [isOpen, isEditing, environment]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSlugChange(value: string): void {
    if (!SLUG_RE.test(value)) return;
    setField('slug', value);
    if (value && value.length < 2) {
      setSlugError('Slug deve ter pelo menos 2 caracteres');
    } else {
      setSlugError('');
    }
  }

  function handleSubmit(e: FormEvent): void {
    e.preventDefault();
    if (slugError) return;

    if (isEditing) {
      const input: UpdateEnvironmentInput = {
        id: environment.id,
        name: form.name,
        description: form.description || null,
        color: form.color,
        isActive: form.isActive,
      };
      updateEnvironment.mutate(input, { onSuccess: onClose });
    } else {
      const input: CreateEnvironmentInput = {
        slug: form.slug,
        name: form.name,
        description: form.description || null,
        color: form.color,
        isActive: form.isActive,
      };
      createEnvironment.mutate(input, { onSuccess: onClose });
    }
  }

  const inputClass =
    'w-full rounded border border-line bg-surface-raised px-3 py-2 text-sm text-slate-200 focus:border-slate-500 focus:outline-none disabled:opacity-50';

  return (
    <Modal
      title={isEditing ? `Editar Ambiente — ${environment.slug}` : 'Incluir Ambiente'}
      isOpen={isOpen}
      onClose={onClose}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Slug */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400">
            Slug *{' '}
            <span className="font-normal text-slate-500">(identificador unico, ex: production)</span>
          </label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            disabled={isEditing}
            placeholder="ex: production, staging"
            required
            className={`${inputClass} ${isEditing ? 'cursor-not-allowed opacity-60' : ''}`}
          />
          {slugError && <p className="text-xs text-red-400">{slugError}</p>}
          {isEditing && (
            <p className="text-xs text-slate-500">
              O slug nao pode ser alterado apos a criacao pois e referenciado em servidores e aplicacoes.
            </p>
          )}
        </div>

        {/* Nome */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400">Nome *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="ex: Produção, Homologação"
            required
            maxLength={100}
            className={inputClass}
          />
        </div>

        {/* Descricao */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400">Descricao</label>
          <textarea
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Descricao opcional do ambiente"
            className={inputClass}
          />
        </div>

        {/* Cor e Ativo em linha */}
        <div className="flex gap-4">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-slate-400">Cor / Icone</label>
            <select
              value={form.color}
              onChange={(e) => setField('color', e.target.value as EnvironmentColor)}
              className={inputClass}
            >
              {COLOR_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col justify-end space-y-1 pb-0.5">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setField('isActive', e.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-surface-raised text-blue-500"
              />
              Ambiente ativo
            </label>
          </div>
        </div>

        {isError && <ErrorMessage message={errorMessage ?? 'Erro ao salvar ambiente'} />}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={isPending || !!slugError}>
            {isPending ? 'Salvando...' : isEditing ? 'Salvar alteracoes' : 'Incluir'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
