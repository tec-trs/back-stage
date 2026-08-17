import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDatabases } from '../features/databases/use-databases.js';
import { Badge } from '../shared/components/Badge.js';
import { Button } from '../shared/components/Button.js';
import { ConfirmDialog } from '../shared/components/ConfirmDialog.js';
import { CreateDatabaseModal } from '../shared/components/CreateDatabaseModal.js';
import { EmptyState } from '../shared/components/EmptyState.js';
import { ErrorMessage } from '../shared/components/ErrorMessage.js';
import { PlusIcon, PencilIcon, TrashIcon, CopyIcon } from '../shared/components/icons.js';
import { PageHeader } from '../shared/components/PageHeader.js';
import { Spinner } from '../shared/components/Spinner.js';

export function DatabasesPage() {
  const [selectedDatabaseId, setSelectedDatabaseId] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { data, isLoading, isError, error } = useDatabases({
    page: 1,
    pageSize: 100,
  });

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorMessage message="Erro ao carregar bancos de dados" />;

  const selectedDatabase = data?.items.find((item) => item.id === selectedDatabaseId) ?? null;

  const handleEdit = () => {
    if (selectedDatabase) {
      alert(`Editar: ${selectedDatabase.displayName}\n\n(Funcionalidade em desenvolvimento)`);
    }
  };

  const handleDuplicate = () => {
    if (selectedDatabase) {
      alert(`Duplicar: ${selectedDatabase.displayName}\n\n(Funcionalidade em desenvolvimento)`);
    }
  };

  const handleDelete = () => {
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedDatabase) {
      alert(`Deletar: ${selectedDatabase.displayName}\n\n(Funcionalidade em desenvolvimento)`);
      setConfirmDeleteOpen(false);
      setSelectedDatabaseId(null);
    }
  };

  const handleCreateDatabase = async (formData: any) => {
    setIsCreating(true);
    try {
      // TODO: Implementar chamada à API
      console.log('Criando banco:', formData);
      alert(`Banco "${formData.displayName || formData.name}" criado com sucesso!`);
      setCreateModalOpen(false);
    } catch (err) {
      console.error('Erro ao criar banco:', err);
      alert('Erro ao criar banco de dados');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div>
      <PageHeader title="Bancos de Dados" description="Gerencie seus bancos de dados, dependências e impacto" />

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Eliminar Banco de Dados"
        message={`Tem certeza que deseja eliminar o banco "${selectedDatabase?.displayName}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Eliminar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 p-2">
        <Button
          size="sm"
          icon={<PlusIcon />}
          onClick={() => setCreateModalOpen(true)}
          title="Incluir um novo banco de dados"
        >
          Incluir Banco
        </Button>
        <div className="mx-1 h-6 w-px bg-slate-800" />
        <Button
          size="sm"
          variant="secondary"
          icon={<PencilIcon />}
          disabled={!selectedDatabase}
          onClick={handleEdit}
          title={selectedDatabase ? `Editar ${selectedDatabase.displayName}` : 'Selecione um banco para editar'}
        >
          Editar
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<CopyIcon />}
          disabled={!selectedDatabase}
          onClick={handleDuplicate}
          title={selectedDatabase ? `Duplicar ${selectedDatabase.displayName}` : 'Selecione um banco para duplicar'}
        >
          Duplicar
        </Button>
        <Button
          size="sm"
          variant="danger"
          icon={<TrashIcon />}
          disabled={!selectedDatabase}
          onClick={handleDelete}
          title={selectedDatabase ? `Eliminar ${selectedDatabase.displayName}` : 'Selecione um banco para eliminar'}
        >
          Eliminar
        </Button>
        <span className="ml-auto text-xs text-slate-500">
          {selectedDatabase ? `Selecionado: ${selectedDatabase.displayName}` : 'Selecione um banco de dados na lista para editar ou eliminar.'}
        </span>
      </div>

      {isLoading && <Spinner />}
      {isError && <ErrorMessage message={(error as Error)?.message || 'Erro ao carregar bancos de dados'} />}
      {data && data.items.length === 0 && <EmptyState title="Nenhum banco de dados encontrado" description="Cadastre o primeiro banco de dados." />}

      {data && data.items.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="w-10 px-4 py-2" />
                <th className="px-4 py-2 font-medium">Nome</th>
                <th className="px-4 py-2 font-medium">Engine</th>
                <th className="px-4 py-2 font-medium">Ambiente</th>
                <th className="px-4 py-2 font-medium">Criticidade</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((database) => (
                <tr
                  key={database.id}
                  onClick={() => setSelectedDatabaseId(database.id)}
                  className={`cursor-pointer border-t border-slate-800 ${
                    database.id === selectedDatabaseId ? 'bg-sky-950/40' : 'hover:bg-slate-900/50'
                  }`}
                >
                  <td className="px-4 py-2">
                    <input
                      type="radio"
                      name="selected-database"
                      checked={database.id === selectedDatabaseId}
                      onChange={() => setSelectedDatabaseId(database.id)}
                      aria-label={`Selecionar ${database.displayName}`}
                      className="h-4 w-4 accent-sky-500"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      to={`/databases/${database.id}`}
                      onClick={(event) => event.stopPropagation()}
                      className="text-slate-100 hover:underline"
                    >
                      {database.displayName || database.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-400">{database.engine}</td>
                  <td className="px-4 py-2 text-slate-400">{database.environment}</td>
                  <td className="px-4 py-2 text-slate-400">{database.criticality}</td>
                  <td className="px-4 py-2">
                    <Badge tone={database.status === 'active' ? 'success' : 'warning'}>
                      {database.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateDatabaseModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateDatabase}
        isLoading={isCreating}
      />
    </div>
  );
}
