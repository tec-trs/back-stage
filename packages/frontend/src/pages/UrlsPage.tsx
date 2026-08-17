import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUrls } from '../features/urls/use-urls.js';
import { Badge } from '../shared/components/Badge.js';
import { Button } from '../shared/components/Button.js';
import { ConfirmDialog } from '../shared/components/ConfirmDialog.js';
import { CreateUrlModal } from '../shared/components/CreateUrlModal.js';
import { EmptyState } from '../shared/components/EmptyState.js';
import { ErrorMessage } from '../shared/components/ErrorMessage.js';
import { PlusIcon, PencilIcon, TrashIcon, CopyIcon } from '../shared/components/icons.js';
import { PageHeader } from '../shared/components/PageHeader.js';
import { Spinner } from '../shared/components/Spinner.js';

export function UrlsPage() {
  const [selectedUrlId, setSelectedUrlId] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { data, isLoading, isError, error } = useUrls({
    page: 1,
    pageSize: 100,
  });

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorMessage message="Erro ao carregar URLs" />;

  const selectedUrl = data?.items.find((item) => item.id === selectedUrlId) ?? null;

  const handleEdit = () => {
    if (selectedUrl) {
      alert(`Editar: ${selectedUrl.label}\n\n(Funcionalidade em desenvolvimento)`);
    }
  };

  const handleDuplicate = () => {
    if (selectedUrl) {
      alert(`Duplicar: ${selectedUrl.label}\n\n(Funcionalidade em desenvolvimento)`);
    }
  };

  const handleDelete = () => {
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedUrl) {
      alert(`Deletar: ${selectedUrl.label}\n\n(Funcionalidade em desenvolvimento)`);
      setConfirmDeleteOpen(false);
      setSelectedUrlId(null);
    }
  };

  const handleCreateUrl = async (formData: any) => {
    setIsCreating(true);
    try {
      // TODO: Implementar chamada à API
      console.log('Criando URL:', formData);
      alert(`URL "${formData.label}" criada com sucesso!`);
      setCreateModalOpen(false);
    } catch (err) {
      console.error('Erro ao criar URL:', err);
      alert('Erro ao criar URL');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div>
      <PageHeader title="URLs e Endpoints" description="Gerencie URLs, endpoints e webhooks" />

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Eliminar URL"
        message={`Tem certeza que deseja eliminar a URL "${selectedUrl?.label}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Eliminar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 p-2">
        <Button
          size="sm"
          icon={<PlusIcon />}
          onClick={() => setCreateModalOpen(true)}
          title="Incluir uma nova URL"
        >
          Incluir URL
        </Button>
        <div className="mx-1 h-6 w-px bg-slate-800" />
        <Button
          size="sm"
          variant="secondary"
          icon={<PencilIcon />}
          disabled={!selectedUrl}
          onClick={handleEdit}
          title={selectedUrl ? `Editar ${selectedUrl.label}` : 'Selecione uma URL para editar'}
        >
          Editar
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<CopyIcon />}
          disabled={!selectedUrl}
          onClick={handleDuplicate}
          title={selectedUrl ? `Duplicar ${selectedUrl.label}` : 'Selecione uma URL para duplicar'}
        >
          Duplicar
        </Button>
        <Button
          size="sm"
          variant="danger"
          icon={<TrashIcon />}
          disabled={!selectedUrl}
          onClick={handleDelete}
          title={selectedUrl ? `Eliminar ${selectedUrl.label}` : 'Selecione uma URL para eliminar'}
        >
          Eliminar
        </Button>
        <span className="ml-auto text-xs text-slate-500">
          {selectedUrl ? `Selecionado: ${selectedUrl.label}` : 'Selecione uma URL na lista para editar ou eliminar.'}
        </span>
      </div>

      {isLoading && <Spinner />}
      {isError && <ErrorMessage message={(error as Error)?.message || 'Erro ao carregar URLs'} />}
      {data && data.items.length === 0 && <EmptyState title="Nenhuma URL encontrada" description="Cadastre a primeira URL." />}

      {data && data.items.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="w-10 px-4 py-2" />
                <th className="px-4 py-2 font-medium">Label</th>
                <th className="px-4 py-2 font-medium">URL</th>
                <th className="px-4 py-2 font-medium">Tipo</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((url) => (
                <tr
                  key={url.id}
                  onClick={() => setSelectedUrlId(url.id)}
                  className={`cursor-pointer border-t border-slate-800 ${
                    url.id === selectedUrlId ? 'bg-sky-950/40' : 'hover:bg-slate-900/50'
                  }`}
                >
                  <td className="px-4 py-2">
                    <input
                      type="radio"
                      name="selected-url"
                      checked={url.id === selectedUrlId}
                      onChange={() => setSelectedUrlId(url.id)}
                      aria-label={`Selecionar ${url.label}`}
                      className="h-4 w-4 accent-sky-500"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      to={`/urls/${url.id}`}
                      onClick={(event) => event.stopPropagation()}
                      className="text-slate-100 hover:underline"
                    >
                      {url.label}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-400 truncate max-w-xs">{url.url}</td>
                  <td className="px-4 py-2">
                    <Badge tone="default">{url.urlType}</Badge>
                  </td>
                  <td className="px-4 py-2">
                    <Badge tone={url.status === 'active' ? 'success' : 'warning'}>{url.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateUrlModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateUrl}
        isLoading={isCreating}
      />
    </div>
  );
}
