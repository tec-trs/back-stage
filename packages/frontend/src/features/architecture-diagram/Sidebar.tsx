import { useState } from 'react';
import { RESOURCE_LABELS } from './types';

interface SidebarProps {
  selectedNodeId: string | null;
  onDeleteNode: (nodeId: string) => void;
  diagramName: string;
  onDiagramNameChange: (name: string) => void;
  nodeCount: number;
  edgeCount: number;
}

export function Sidebar({
  selectedNodeId,
  onDeleteNode,
  diagramName,
  onDiagramNameChange,
  nodeCount,
  edgeCount,
}: SidebarProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(diagramName);

  const handleSaveName = () => {
    if (name.trim()) {
      onDiagramNameChange(name);
      setIsEditingName(false);
    }
  };

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          {isEditingName ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              autoFocus
              className="flex-1 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-sm text-white"
            />
          ) : (
            <h2
              onClick={() => setIsEditingName(true)}
              className="flex-1 text-lg font-bold text-slate-100 cursor-pointer hover:text-sky-400"
            >
              {diagramName}
            </h2>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1">Clique para renomear</p>
      </div>

      {/* Stats */}
      <div className="p-4 space-y-3 border-b border-slate-700">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400">Nós</span>
          <span className="text-2xl font-bold text-sky-400">{nodeCount}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400">Conexões</span>
          <span className="text-2xl font-bold text-sky-400">{edgeCount}</span>
        </div>
      </div>

      {/* Legenda */}
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Legenda</h3>
        <div className="space-y-2">
          {(Object.entries(RESOURCE_LABELS) as Array<[string, string]>).map(([type, label]) => (
            <div key={type} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: {
                    url: '#fbbf24',
                    application: '#a78bfa',
                    service: '#60a5fa',
                    database: '#f472b6',
                    server: '#34d399',
                  }[type],
                }}
              />
              <span className="text-xs text-slate-400">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Instruções */}
      <div className="p-4 flex-1 overflow-y-auto">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Dicas</h3>
        <ul className="space-y-2 text-xs text-slate-400">
          <li>✏️ Clique no título para renomear o diagrama</li>
          <li>➕ Use "Adicionar Nó" para criar recursos</li>
          <li>🔗 Arraste de um handle para outro para conectar</li>
          <li>🗑️ Delete com tecla Delete ou clique com botão direito</li>
          <li>🔄 Arraste nós para reorganizar</li>
          <li>🔍 Use scroll ou controles para zoom</li>
          <li>📥 Exporte para salvar como JSON</li>
          <li>📤 Importe um arquivo JSON anterior</li>
        </ul>
      </div>

      {/* Selected Node Info */}
      {selectedNodeId && (
        <div className="p-4 border-t border-slate-700 bg-slate-800">
          <div className="text-sm text-slate-300 mb-3">Nó Selecionado: {selectedNodeId}</div>
          <button
            onClick={() => onDeleteNode(selectedNodeId)}
            className="w-full px-3 py-2 bg-red-900/20 text-red-400 rounded text-sm hover:bg-red-900/30 transition"
          >
            🗑️ Deletar Nó
          </button>
        </div>
      )}
    </div>
  );
}
