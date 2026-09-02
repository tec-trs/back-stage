import { useState } from 'react';
import { useArchitectureDiagrams, useDeleteArchitectureDiagram } from './use-architecture-diagrams';
import { Modal } from '../../shared/components/Modal';
import { Button } from '../../shared/components/Button';
import { Spinner } from '../../shared/components/Spinner';
import type { ArchitectureDiagram } from './use-architecture-diagrams';

interface LoadDiagramDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (diagram: ArchitectureDiagram) => void;
}

export function LoadDiagramDialog({ isOpen, onClose, onLoad }: LoadDiagramDialogProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { data: diagrams = [], isLoading, error, refetch } = useArchitectureDiagrams();
  const deleteMutation = useDeleteArchitectureDiagram();

  const handleDelete = async (diagramId: string) => {
    if (!confirm('Tem certeza que deseja deletar este diagrama?')) return;

    setDeletingId(diagramId);
    try {
      await deleteMutation.mutateAsync(diagramId);
      refetch();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Carregar Diagrama" size="lg">
      <div className="space-y-4 p-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : error ? (
          <div className="text-red-400 text-sm">Erro ao carregar diagramas</div>
        ) : diagrams.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            Nenhum diagrama salvo ainda
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-2">
            {diagrams.map((diagram) => (
              <div
                key={diagram.id}
                className="flex gap-2 items-stretch px-4 py-3 rounded bg-surface-raised hover:bg-slate-700 transition group"
              >
                <button
                  onClick={() => onLoad(diagram)}
                  className="flex-1 text-left flex flex-col gap-1"
                >
                  <div className="font-semibold text-white">{diagram.name}</div>
                  {diagram.description && (
                    <div className="text-xs text-slate-400">{diagram.description}</div>
                  )}
                  <div className="text-xs text-slate-500">
                    📊 {diagram.nodes.length} nós • 🔗 {diagram.edges.length} conexões
                  </div>
                </button>
                <button
                  onClick={() => handleDelete(diagram.id)}
                  disabled={deletingId === diagram.id || deleteMutation.isPending}
                  className="px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  title="Deletar diagrama"
                >
                  {deletingId === diagram.id ? '⏳' : '🗑️'}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 justify-end pt-4 border-t border-line">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
