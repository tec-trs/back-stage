import { useState } from 'react';
import { Button } from '../../shared/components/Button';
import { Modal } from '../../shared/components/Modal';
import { useCreateArchitectureDiagram, useUpdateArchitectureDiagram } from './use-architecture-diagrams';
import type { ArchitectureDiagramNode, ArchitectureDiagramEdge } from './use-architecture-diagrams';

interface SaveDiagramDialogProps {
  isOpen: boolean;
  onClose: () => void;
  diagramName: string;
  nodes: ArchitectureDiagramNode[];
  edges: ArchitectureDiagramEdge[];
  diagramId?: string;
}

export function SaveDiagramDialog({
  isOpen,
  onClose,
  diagramName,
  nodes,
  edges,
  diagramId,
}: SaveDiagramDialogProps) {
  const [name, setName] = useState(diagramName);
  const [description, setDescription] = useState('');
  const createMutation = useCreateArchitectureDiagram();
  const updateMutation = useUpdateArchitectureDiagram();

  const handleSave = async () => {
    if (!name.trim()) return;

    try {
      if (diagramId) {
        await updateMutation.mutateAsync({
          id: diagramId,
          name,
          description,
          nodes,
          edges,
        });
      } else {
        await createMutation.mutateAsync({
          name,
          description,
          nodes,
          edges,
        });
      }
      onClose();
    } catch (error) {
      console.error('Erro ao salvar diagrama:', error);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={diagramId ? 'Atualizar Diagrama' : 'Salvar Diagrama'}>
      <div className="space-y-4 p-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Nome do Diagrama</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Arquitetura Produção"
            className="w-full px-3 py-2 bg-surface-raised border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-signal"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Descrição (opcional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Diagrama da arquitetura de produção com todos os serviços..."
            rows={3}
            className="w-full px-3 py-2 bg-surface-raised border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-signal"
          />
        </div>

        <div className="bg-surface-raised/50 p-3 rounded text-sm text-slate-400">
          <div>📊 Nós: {nodes.length}</div>
          <div>🔗 Conexões: {edges.length}</div>
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t border-line">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!name.trim() || isLoading}
          >
            {isLoading ? '⏳ Salvando...' : '💾 Salvar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
