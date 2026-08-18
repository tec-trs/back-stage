import { type FormEvent, useEffect, useState } from 'react';

import { Button } from '../../shared/components/Button';
import { ErrorMessage } from '../../shared/components/ErrorMessage';
import { Modal } from '../../shared/components/Modal';
import { useCreateOrganization } from './use-create-organization';
import { useUpdateOrganization } from './use-update-organization';
import type { OrganizationSummary } from './use-organizations';

const PLAN_OPTIONS = [
  { value: 'free', label: 'Free' },
  { value: 'starter', label: 'Starter' },
  { value: 'professional', label: 'Professional' },
  { value: 'enterprise', label: 'Enterprise' },
];

const SLUG_RE = /^[a-z0-9-]*$/;

interface FormState {
  slug: string;
  name: string;
  plan: string;
}

function emptyForm(): FormState {
  return { slug: '', name: '', plan: 'free' };
}

function fromOrg(org: OrganizationSummary): FormState {
  return { slug: org.slug, name: org.name, plan: org.plan };
}

interface OrgFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  organization: OrganizationSummary | null;
}

export function OrgFormDialog({ isOpen, onClose, organization }: OrgFormDialogProps) {
  const isEditing = organization !== null;
  const create = useCreateOrganization();
  const update = useUpdateOrganization();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [slugError, setSlugError] = useState('');

  const mutation = isEditing ? update : create;
  const isPending = mutation.isPending;

  useEffect(() => {
    if (isOpen) {
      setForm(isEditing ? fromOrg(organization) : emptyForm());
      setSlugError('');
      mutation.reset();
    }
  }, [isOpen, isEditing, organization]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSlugChange(value: string): void {
    if (!SLUG_RE.test(value)) return;
    setField('slug', value);
    setSlugError(value && value.length < 2 ? 'Slug deve ter pelo menos 2 caracteres' : '');
  }

  function handleSubmit(e: FormEvent): void {
    e.preventDefault();
    if (slugError) return;

    if (isEditing) {
      update.mutate({ id: organization.id, name: form.name, plan: form.plan }, { onSuccess: onClose });
    } else {
      create.mutate({ slug: form.slug, name: form.name, plan: form.plan }, { onSuccess: onClose });
    }
  }

  const inputClass =
    'w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-slate-500 focus:outline-none disabled:opacity-50';

  return (
    <Modal
      title={isEditing ? `Editar Organizacao — ${organization.slug}` : 'Incluir Organizacao'}
      isOpen={isOpen}
      onClose={onClose}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400">
            Slug *{' '}
            <span className="font-normal text-slate-500">(apenas letras minusculas, numeros e hifens)</span>
          </label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            disabled={isEditing}
            placeholder="ex: cliente-abc"
            required
            className={`${inputClass} ${isEditing ? 'cursor-not-allowed opacity-60' : ''}`}
          />
          {slugError && <p className="text-xs text-red-400">{slugError}</p>}
          {isEditing && (
            <p className="text-xs text-slate-500">O slug nao pode ser alterado apos a criacao.</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400">Nome *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="ex: Empresa XYZ"
            required
            maxLength={255}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400">Plano</label>
          <select
            value={form.plan}
            onChange={(e) => setField('plan', e.target.value)}
            className={inputClass}
          >
            {PLAN_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {mutation.isError && (
          <ErrorMessage message={mutation.error?.message ?? 'Erro ao salvar organizacao'} />
        )}

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
