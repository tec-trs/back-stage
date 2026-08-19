import { type FormEvent, useEffect, useState } from 'react';

import { Button } from '../../shared/components/Button';
import { ErrorMessage } from '../../shared/components/ErrorMessage';
import { Modal } from '../../shared/components/Modal';

import type { CreateRelationshipInput } from './use-resource-graph';
import { useCreateRelationship } from './use-resource-graph';

const inputClass =
  'rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-slate-500';

export type ResourceType = 'server' | 'application' | 'database' | 'url';

const RESOURCE_TYPES: Array<{ value: ResourceType; label: string }> = [
  { value: 'server', label: 'Servidor' },
  { value: 'application', label: 'Aplicacao' },
  { value: 'database', label: 'Banco de Dados' },
  { value: 'url', label: 'URL' },
];

const RELATION_TYPES: Array<{ value: string; label: string; description: string }> = [
  { value: 'hosts', label: 'Hospeda', description: 'Ex: Servidor hospeda banco de dados' },
  { value: 'depends_on', label: 'Depende de', description: 'Ex: Aplicacao depende de banco' },
  { value: 'connects_to', label: 'Conecta a', description: 'Ex: Aplicacao conecta a outra' },
  { value: 'exposes', label: 'Expoe', description: 'Ex: Aplicacao expoe URL/endpoint' },
  { value: 'consumes', label: 'Consome', description: 'Ex: Aplicacao consome servico externo' },
  { value: 'part_of', label: 'Parte de', description: 'Ex: Microsservico e parte de sistema' },
];

interface FormState {
  sourceType: ResourceType;
  sourceId: string;
  targetType: ResourceType;
  targetId: string;
  relationType: string;
  reason: string;
}

function emptyForm(
  defaultSourceType?: ResourceType,
  defaultSourceId?: string,
): FormState {
  return {
    sourceType: defaultSourceType ?? 'application',
    sourceId: defaultSourceId ?? '',
    targetType: 'server',
    targetId: '',
    relationType: 'depends_on',
    reason: '',
  };
}

export function AddRelationshipDialog({
  isOpen,
  onClose,
  defaultSourceType,
  defaultSourceId,
  defaultSourceLabel,
}: {
  isOpen: boolean;
  onClose: () => void;
  defaultSourceType?: ResourceType;
  defaultSourceId?: string;
  defaultSourceLabel?: string;
}) {
  const createRelationship = useCreateRelationship();
  const [form, setForm] = useState<FormState>(emptyForm(defaultSourceType, defaultSourceId));

  useEffect(() => {
    if (isOpen) {
      setForm(emptyForm(defaultSourceType, defaultSourceId));
      createRelationship.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, defaultSourceType, defaultSourceId]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const payload: CreateRelationshipInput = {
      sourceType: form.sourceType,
      sourceId: form.sourceId.trim(),
      targetType: form.targetType,
      targetId: form.targetId.trim(),
      relationType: form.relationType,
      reason: form.reason.trim() || undefined,
    };

    createRelationship.mutate(payload, { onSuccess: onClose });
  }

  const selectedRelation = RELATION_TYPES.find((r) => r.value === form.relationType);

  return (
    <Modal title="Adicionar Relacionamento" isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-xs text-slate-500">
          Crie uma relacao de dependencia entre dois recursos do inventario.
        </p>

        {/* Origem */}
        <fieldset className="flex flex-col gap-3 rounded-md border border-slate-800 p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Recurso Origem
          </legend>
          {defaultSourceLabel && (
            <p className="text-sm text-slate-300 font-medium">{defaultSourceLabel}</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Tipo *</span>
              <select
                value={form.sourceType}
                disabled={Boolean(defaultSourceType)}
                onChange={(e) => setField('sourceType', e.target.value as ResourceType)}
                className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {RESOURCE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">ID (UUID) *</span>
              <input
                required
                value={form.sourceId}
                disabled={Boolean(defaultSourceId)}
                onChange={(e) => setField('sourceId', e.target.value)}
                placeholder="xxxxxxxx-xxxx-..."
                className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
              />
            </label>
          </div>
        </fieldset>

        {/* Relacao */}
        <div className="flex flex-col gap-1">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-400">Tipo de relacao *</span>
            <select
              value={form.relationType}
              onChange={(e) => setField('relationType', e.target.value)}
              className={inputClass}
            >
              {RELATION_TYPES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          {selectedRelation && (
            <p className="text-xs text-slate-500">{selectedRelation.description}</p>
          )}
        </div>

        {/* Motivo */}
        <div className="flex flex-col gap-1">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-400">Motivo (opcional)</span>
            <textarea
              value={form.reason}
              onChange={(e) => setField('reason', e.target.value)}
              placeholder="Ex: X precisa acessar Y para autenticação"
              className={`${inputClass} resize-none`}
              rows={2}
            />
          </label>
        </div>

        {/* Destino */}
        <fieldset className="flex flex-col gap-3 rounded-md border border-slate-800 p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Recurso Destino
          </legend>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Tipo *</span>
              <select
                value={form.targetType}
                onChange={(e) => setField('targetType', e.target.value as ResourceType)}
                className={inputClass}
              >
                {RESOURCE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">ID (UUID) *</span>
              <input
                required
                value={form.targetId}
                onChange={(e) => setField('targetId', e.target.value)}
                placeholder="xxxxxxxx-xxxx-..."
                className={inputClass}
              />
            </label>
          </div>
        </fieldset>

        {createRelationship.isError && (
          <ErrorMessage
            message={
              createRelationship.error instanceof Error
                ? createRelationship.error.message
                : 'Erro ao criar relacionamento'
            }
          />
        )}

        <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createRelationship.isPending}>
            {createRelationship.isPending ? 'Criando...' : 'Criar Relacionamento'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
