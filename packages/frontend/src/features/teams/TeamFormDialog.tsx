import { type FormEvent, useEffect, useState } from 'react';

import { Button } from '../../shared/components/Button';
import { ErrorMessage } from '../../shared/components/ErrorMessage';
import { Modal } from '../../shared/components/Modal';
import type { CreateTeamInput } from './use-create-team';
import { useCreateTeam } from './use-create-team';
import type { UpdateTeamInput } from './use-update-team';
import { useUpdateTeam } from './use-update-team';
import type { TeamSummary } from './use-teams';

const SLUG_RE = /^[a-z0-9_-]*$/;

const inputClass =
  'rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-slate-500';

interface FormState {
  name: string;
  slug: string;
  description: string;
}

function emptyForm(): FormState {
  return { name: '', slug: '', description: '' };
}

function formFrom(team: TeamSummary): FormState {
  return { name: team.name, slug: team.slug, description: team.description ?? '' };
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 255);
}

export function TeamFormDialog({
  isOpen,
  onClose,
  team,
}: {
  isOpen: boolean;
  onClose: () => void;
  team?: TeamSummary | null;
}) {
  const isEditMode = Boolean(team);
  const create = useCreateTeam();
  const update = useUpdateTeam();
  const mutation = isEditMode ? update : create;

  const [form, setForm] = useState<FormState>(emptyForm());
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(team ? formFrom(team) : emptyForm());
      setSlugError(null);
      setSlugTouched(false);
      create.reset();
      update.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, team]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]): void {
    setForm((curr) => ({ ...curr, [key]: value }));
  }

  function handleNameChange(value: string): void {
    setField('name', value);
    if (!isEditMode && !slugTouched) {
      setField('slug', toSlug(value));
    }
  }

  function handleSlugChange(value: string): void {
    setSlugTouched(true);
    setField('slug', value);
    if (slugError) setSlugError(null);
  }

  function validateSlug(): boolean {
    if (form.slug.length < 2 || !SLUG_RE.test(form.slug)) {
      setSlugError('Minimo 2 caracteres: letras minusculas, numeros, hifen e underscore');
      return false;
    }
    setSlugError(null);
    return true;
  }

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();

    if (!isEditMode && !validateSlug()) return;

    if (isEditMode && team) {
      const input: UpdateTeamInput = {
        id: team.id,
        name: form.name,
        description: form.description.trim() || null,
      };
      update.mutate(input, { onSuccess: onClose });
      return;
    }

    const input: CreateTeamInput = {
      name: form.name,
      slug: form.slug,
      description: form.description.trim() || null,
    };
    create.mutate(input, { onSuccess: onClose });
  }

  return (
    <Modal
      title={isEditMode ? 'Editar Time' : 'Incluir Time'}
      isOpen={isOpen}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Nome *</span>
          <input
            required
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Infraestrutura"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Slug (identificador) *</span>
          <input
            required
            disabled={isEditMode}
            value={form.slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            onBlur={isEditMode ? undefined : validateSlug}
            placeholder="infraestrutura"
            className={`${inputClass} font-mono disabled:cursor-not-allowed disabled:opacity-70`}
          />
          {isEditMode ? (
            <span className="text-xs text-slate-500">O slug nao pode ser alterado apos o cadastro.</span>
          ) : (
            slugError && <span className="text-xs text-red-400">{slugError}</span>
          )}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Descricao</span>
          <textarea
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            rows={3}
            placeholder="Responsavel pela infraestrutura de servidores e redes..."
            className={inputClass}
          />
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
            {mutation.isPending ? 'Salvando...' : isEditMode ? 'Salvar alteracoes' : 'Criar time'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
