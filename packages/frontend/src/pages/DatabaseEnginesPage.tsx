import { useState } from 'react';

import { Button } from '../shared/components/Button';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { Spinner } from '../shared/components/Spinner';
import { DatabaseEngineFormDialog } from '../features/databases/DatabaseEngineFormDialog';
import {
  useDatabaseEngines,
  useDeleteDatabaseEngine,
  type DatabaseEngine,
} from '../features/databases/use-database-engines';

export function DatabaseEnginesPage() {
  const { data: engines = [], isLoading, error } = useDatabaseEngines();
  const deleteEngine = useDeleteDatabaseEngine();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEngine, setSelectedEngine] = useState<DatabaseEngine | null>(null);

  function openForm(engine?: DatabaseEngine) {
    setSelectedEngine(engine ?? null);
    setIsFormOpen(true);
  }

  function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja deletar este engine?')) {
      return;
    }
    deleteEngine.mutate(id);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message="Erro ao carregar engines" />;
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Database Engines</h1>
          <p className="text-sm text-slate-400">Gerencie os engines de banco de dados disponiveis</p>
        </div>
        <Button onClick={() => openForm()}>+ Novo Engine</Button>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-950 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-700 bg-slate-900">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-300">Slug</th>
              <th className="px-4 py-3 font-semibold text-slate-300">Nome</th>
              <th className="px-4 py-3 font-semibold text-slate-300">Descricao</th>
              <th className="px-4 py-3 font-semibold text-slate-300">Porta Padrao</th>
              <th className="px-4 py-3 font-semibold text-slate-300">Status</th>
              <th className="px-4 py-3 font-semibold text-slate-300 text-right">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {engines.map((engine) => (
              <tr key={engine.id} className="hover:bg-slate-900">
                <td className="px-4 py-3 font-mono text-slate-100">{engine.slug}</td>
                <td className="px-4 py-3 text-slate-100">{engine.name}</td>
                <td className="px-4 py-3 text-slate-400">{engine.description ?? '—'}</td>
                <td className="px-4 py-3 text-slate-400">{engine.defaultPort ?? '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      engine.isActive
                        ? 'bg-green-900/30 text-green-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {engine.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openForm(engine)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDelete(engine.id)}
                      disabled={deleteEngine.isPending}
                    >
                      Deletar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {engines.length === 0 && (
          <div className="px-4 py-8 text-center text-slate-400">
            Nenhum engine cadastrado
          </div>
        )}
      </div>

      <DatabaseEngineFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        engine={selectedEngine}
      />
    </div>
  );
}
