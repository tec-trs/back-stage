import { type FormEvent, useEffect, useMemo, useState } from 'react';

import { Button } from '../../shared/components/Button';
import { ErrorMessage } from '../../shared/components/ErrorMessage';
import { Modal } from '../../shared/components/Modal';
import { useDatabaseGroups } from '../database-groups/use-database-groups';

import { RELATION_TYPES, RESOURCE_TYPES, type ResourceType } from './relationship-types';
import { ResourceSelector } from './ResourceSelector';
import type { CreateRelationshipInput, GraphEdge } from './use-resource-graph';
import { useCreateRelationship } from './use-resource-graph';

const inputClass =
  'rounded-md border border-slate-700 bg-canvas px-3 py-2 text-slate-100 outline-none focus:border-slate-500';

// Re-exported for callers that only need the resource-type union (e.g. ResourceSelector).
// The actual list of types/relation types now lives in ./relationship-types so the
// Architecture Diagram editor can reuse the exact same vocabulary.
export type { ResourceType };

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
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  defaultSourceType?: ResourceType;
  defaultSourceId?: string;
  defaultSourceLabel?: string;
  // Called with the newly created relationship, right before onClose — lets a
  // caller (e.g. a relationship map's detail page) chain a follow-up action such
  // as tagging the new relationship into a curated set.
  onCreated?: (edge: GraphEdge) => void;
}) {
  const createRelationship = useCreateRelationship();
  const { data: databaseGroups } = useDatabaseGroups();
  const [form, setForm] = useState<FormState>(emptyForm(defaultSourceType, defaultSourceId));

  // Atalho "usar um Agrupador de Bancos inteiro": ativa quando o lado
  // origem/destino é do tipo banco, trocando o ResourceSelector por um
  // seletor de agrupador — o submit então cria um relacionamento real para
  // cada banco do grupo, de uma vez, em vez de o usuário escolher banco por
  // banco. Só faz sentido no lado que não está travado por defaultSourceId.
  const [useSourceGroup, setUseSourceGroup] = useState(false);
  const [useTargetGroup, setUseTargetGroup] = useState(false);
  const [sourceGroupId, setSourceGroupId] = useState('');
  const [targetGroupId, setTargetGroupId] = useState('');
  const [bulkError, setBulkError] = useState<string | undefined>();
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(emptyForm(defaultSourceType, defaultSourceId));
      setUseSourceGroup(false);
      setUseTargetGroup(false);
      setSourceGroupId('');
      setTargetGroupId('');
      setBulkError(undefined);
      createRelationship.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, defaultSourceType, defaultSourceId]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Agrupadores com pelo menos um banco — a lista oferecida pelo atalho.
  const groupsWithMembers = useMemo(
    () => (databaseGroups ?? []).filter((g) => g.databaseIds && g.databaseIds.length > 0),
    [databaseGroups],
  );

  const sourceIsGroup = form.sourceType === 'database' && useSourceGroup;
  const targetIsGroup = form.targetType === 'database' && useTargetGroup;

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBulkError(undefined);

    if (sourceIsGroup || targetIsGroup) {
      // Não há endpoint de criação em lote no backend — dispara um
      // relacionamento por banco do grupo em paralelo e resolve junto, como
      // outros atalhos "adicionar tudo de uma vez" desta base (ex:
      // AddDatabasesDialog dos Agrupadores de Bancos).
      const groupId = sourceIsGroup ? sourceGroupId : targetGroupId;
      const group = groupsWithMembers.find((g) => g.id === groupId);
      const memberIds = group?.databaseIds ?? [];
      if (memberIds.length === 0) {
        setBulkError('Selecione um agrupador com bancos.');
        return;
      }

      setIsBulkSubmitting(true);
      const results = await Promise.allSettled(
        memberIds.map((dbId) =>
          createRelationship.mutateAsync(
            sourceIsGroup
              ? {
                  sourceType: 'database',
                  sourceId: dbId,
                  targetType: form.targetType,
                  targetId: form.targetId.trim(),
                  relationType: form.relationType,
                  reason: form.reason.trim() || undefined,
                }
              : {
                  sourceType: form.sourceType,
                  sourceId: form.sourceId.trim(),
                  targetType: 'database',
                  targetId: dbId,
                  relationType: form.relationType,
                  reason: form.reason.trim() || undefined,
                },
          ),
        ),
      );
      setIsBulkSubmitting(false);

      for (const result of results) {
        if (result.status === 'fulfilled') onCreated?.(result.value);
      }
      const failedCount = results.filter((r) => r.status === 'rejected').length;
      if (failedCount > 0) {
        setBulkError(
          `${failedCount} de ${memberIds.length} relacionamento(s) não foram criados — verifique e tente novamente.`,
        );
        return;
      }

      onClose();
      return;
    }

    const payload: CreateRelationshipInput = {
      sourceType: form.sourceType,
      sourceId: form.sourceId.trim(),
      targetType: form.targetType,
      targetId: form.targetId.trim(),
      relationType: form.relationType,
      reason: form.reason.trim() || undefined,
    };

    createRelationship.mutate(payload, {
      onSuccess: (edge) => {
        onCreated?.(edge);
        onClose();
      },
    });
  }

  const selectedRelation = RELATION_TYPES.find((r) => r.value === form.relationType);
  const isSubmitting = createRelationship.isPending || isBulkSubmitting;
  const canSubmit = !isSubmitting && !(sourceIsGroup && !sourceGroupId) && !(targetIsGroup && !targetGroupId);

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
              <span className="text-slate-400">Recurso *</span>
              {sourceIsGroup ? (
                <select
                  value={sourceGroupId}
                  onChange={(e) => setSourceGroupId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Selecione um agrupador...</option>
                  {groupsWithMembers.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.databaseIds!.length} bancos)
                    </option>
                  ))}
                </select>
              ) : (
                <ResourceSelector
                  resourceType={form.sourceType}
                  value={form.sourceId}
                  onChange={(id) => setField('sourceId', id)}
                  placeholder="Buscar recurso..."
                  disabled={Boolean(defaultSourceId)}
                />
              )}
            </label>
          </div>
          {form.sourceType === 'database' && !defaultSourceId && (
            <label className="flex items-center gap-2 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={useSourceGroup}
                onChange={(e) => {
                  setUseSourceGroup(e.target.checked);
                  setField('sourceId', '');
                }}
                className="h-3.5 w-3.5 accent-sky-500"
              />
              Usar um Agrupador de Bancos inteiro em vez de escolher banco por banco
            </label>
          )}
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
              <span className="text-slate-400">Recurso *</span>
              {targetIsGroup ? (
                <select
                  value={targetGroupId}
                  onChange={(e) => setTargetGroupId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Selecione um agrupador...</option>
                  {groupsWithMembers.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.databaseIds!.length} bancos)
                    </option>
                  ))}
                </select>
              ) : (
                <ResourceSelector
                  resourceType={form.targetType}
                  value={form.targetId}
                  onChange={(id) => setField('targetId', id)}
                  placeholder="Buscar recurso..."
                />
              )}
            </label>
          </div>
          {form.targetType === 'database' && (
            <label className="flex items-center gap-2 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={useTargetGroup}
                onChange={(e) => {
                  setUseTargetGroup(e.target.checked);
                  setField('targetId', '');
                }}
                className="h-3.5 w-3.5 accent-sky-500"
              />
              Usar um Agrupador de Bancos inteiro em vez de escolher banco por banco
            </label>
          )}
        </fieldset>

        {(createRelationship.isError || bulkError) && (
          <ErrorMessage
            message={
              bulkError ??
              (createRelationship.error instanceof Error
                ? createRelationship.error.message
                : 'Erro ao criar relacionamento')
            }
          />
        )}

        <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {isSubmitting ? 'Criando...' : 'Criar Relacionamento'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
