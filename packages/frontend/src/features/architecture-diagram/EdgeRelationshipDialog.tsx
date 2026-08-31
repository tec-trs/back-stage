import { useEffect, useState } from 'react';

import { Button } from '../../shared/components/Button';
import { ErrorMessage } from '../../shared/components/ErrorMessage';
import { Modal } from '../../shared/components/Modal';
import { RELATION_TYPES, type RelationType } from '../resource-graph/relationship-types';

const inputClass =
  'rounded-md border border-slate-700 bg-canvas px-3 py-2 text-slate-100 outline-none focus:border-slate-500';

interface EdgeRelationshipDialogProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  sourceLabel: string;
  targetLabel: string;
  initialRelationType: RelationType;
  initialReason: string;
  isSubmitting: boolean;
  errorMessage?: string;
  onCancel: () => void;
  onConfirm: (relationType: RelationType, reason: string) => void;
  // Only offered in 'create' mode: keep the arrow as a plain drawing, with no
  // real resource_relationships row behind it.
  onCreateVisualOnly?: () => void;
  // Only offered in 'edit' mode: delete the underlying relationship but keep
  // the arrow on the canvas as a plain visual line.
  onRemoveRealLink?: () => void;
}

export function EdgeRelationshipDialog({
  isOpen,
  mode,
  sourceLabel,
  targetLabel,
  initialRelationType,
  initialReason,
  isSubmitting,
  errorMessage,
  onCancel,
  onConfirm,
  onCreateVisualOnly,
  onRemoveRealLink,
}: EdgeRelationshipDialogProps) {
  const [relationType, setRelationType] = useState<RelationType>(initialRelationType);
  const [reason, setReason] = useState(initialReason);

  useEffect(() => {
    if (isOpen) {
      setRelationType(initialRelationType);
      setReason(initialReason);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialRelationType, initialReason]);

  const selectedRelation = RELATION_TYPES.find((r) => r.value === relationType);

  return (
    <Modal
      title={mode === 'create' ? 'Conexao entre recursos do inventario' : 'Editar relacionamento'}
      isOpen={isOpen}
      onClose={onCancel}
    >
      <div className="flex flex-col gap-4">
        <p className="text-xs text-slate-500">
          {mode === 'create' ? (
            <>
              <span className="font-medium text-slate-300">{sourceLabel}</span> e{' '}
              <span className="font-medium text-slate-300">{targetLabel}</span> sao recursos reais do inventario.
              Voce pode criar um relacionamento de verdade — o mesmo tipo usado em &quot;+ Relacionamento&quot; — que passa a
              valer na Analise de Impacto e no grafo de dependencias, ou apenas desenhar uma linha neste diagrama.
            </>
          ) : (
            <>
              Relacionamento entre <span className="font-medium text-slate-300">{sourceLabel}</span> e{' '}
              <span className="font-medium text-slate-300">{targetLabel}</span>. Como nao existe edicao direta no
              backend, alterar o tipo remove o relacionamento atual e cria um novo com o tipo escolhido.
            </>
          )}
        </p>

        <div className="flex flex-col gap-1">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-400">Tipo de relacao *</span>
            <select
              value={relationType}
              onChange={(e) => setRelationType(e.target.value as RelationType)}
              className={inputClass}
            >
              {RELATION_TYPES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          {selectedRelation && <p className="text-xs text-slate-500">{selectedRelation.description}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-400">Motivo (opcional)</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Tomcat precisa do PASOE para subir"
              className={`${inputClass} resize-none`}
              rows={2}
            />
          </label>
        </div>

        {errorMessage && <ErrorMessage message={errorMessage} />}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
          <div>
            {mode === 'edit' && onRemoveRealLink && (
              <Button type="button" variant="ghost-danger" size="sm" disabled={isSubmitting} onClick={onRemoveRealLink}>
                Remover vinculo real
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" disabled={isSubmitting} onClick={onCancel}>
              Cancelar
            </Button>
            {mode === 'create' && onCreateVisualOnly && (
              <Button type="button" variant="secondary" disabled={isSubmitting} onClick={onCreateVisualOnly}>
                Apenas desenhar
              </Button>
            )}
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => onConfirm(relationType, reason.trim())}
            >
              {isSubmitting
                ? 'Salvando...'
                : mode === 'create'
                  ? 'Criar relacionamento real'
                  : 'Salvar alteracao'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
