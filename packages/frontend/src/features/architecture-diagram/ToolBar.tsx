import { useState } from 'react';
import { Button } from '../../shared/components/Button';
import { Modal } from '../../shared/components/Modal';
import type { ResourceType } from './types';
import { RESOURCE_LABELS } from './types';

interface ToolBarProps {
  onAddNode: (type: ResourceType, label: string, description?: string) => void;
  onClear: () => void;
  onExport: () => void;
  onImport: () => void;
}

export function ToolBar({ onAddNode, onClear, onExport, onImport }: ToolBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ResourceType | null>(null);
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');

  const types: ResourceType[] = ['url', 'application', 'service', 'database', 'server'];

  const handleAdd = () => {
    if (!selectedType || !label.trim()) return;
    onAddNode(selectedType, label, description || undefined);
    setLabel('');
    setDescription('');
    setSelectedType(null);
    setIsOpen(false);
  };

  return (
    <>
      <div className="flex gap-2 p-4 bg-surface border-b border-line flex-wrap">
        <Button size="sm" onClick={() => setIsOpen(true)}>
          + Adicionar Nó
        </Button>

        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={onExport}>
            📥 Exportar
          </Button>
          <Button size="sm" variant="secondary" onClick={onImport}>
            📤 Importar
          </Button>
        </div>

        <Button size="sm" variant="secondary" onClick={onClear}>
          🗑️ Limpar
        </Button>
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Adicionar Nó">
        <div className="space-y-4 p-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              {types.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-2 rounded text-sm transition ${
                    selectedType === type
                      ? 'bg-signal text-[#1a1204]'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {RESOURCE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Nome</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: PostgreSQL Users"
              className="w-full px-3 py-2 bg-surface-raised border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-signal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Descrição (opcional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Banco de usuários"
              className="w-full px-3 py-2 bg-surface-raised border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-signal"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="secondary" size="sm" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleAdd} disabled={!selectedType || !label.trim()}>
              Adicionar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
