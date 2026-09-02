import { type FormEvent, useState } from 'react';

import { Button } from '../../shared/components/Button';
import { ErrorMessage } from '../../shared/components/ErrorMessage';
import { Modal } from '../../shared/components/Modal';
import { translateLifecycle } from '../../shared/constants/labels';

import { useCreateService } from './use-create-service';

const NAME_PATTERN = /^[a-z0-9-]+$/;

interface CreateServiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateServiceDialog({ isOpen, onClose }: CreateServiceDialogProps) {
  const createService = useCreateService();

  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('service');
  const [namespace, setNamespace] = useState('default');
  const [lifecycle, setLifecycle] = useState<'experimental' | 'production' | 'deprecated'>(
    'experimental',
  );
  const [description, setDescription] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  function resetForm(): void {
    setName('');
    setTitle('');
    setType('service');
    setNamespace('default');
    setLifecycle('experimental');
    setDescription('');
    setRepositoryUrl('');
    setNameError(null);
    createService.reset();
  }

  function handleClose(): void {
    resetForm();
    onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (!NAME_PATTERN.test(name)) {
      setNameError('O nome deve conter apenas letras minusculas, numeros e hifen');
      return;
    }
    setNameError(null);

    createService.mutate(
      {
        type,
        name,
        namespace,
        title: title.trim() === '' ? null : title.trim(),
        description: description.trim() === '' ? null : description.trim(),
        lifecycle,
        repositoryUrl: repositoryUrl.trim() === '' ? null : repositoryUrl.trim(),
      },
      { onSuccess: handleClose },
    );
  }

  return (
    <Modal title="Novo Servico" isOpen={isOpen} onClose={handleClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Nome (kebab-case) *</span>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="billing-api"
            className="rounded border border-line bg-canvas px-3 py-2 text-slate-100 outline-none focus:border-slate-500"
          />
          {nameError && <span className="text-xs text-red-400">{nameError}</span>}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Titulo</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Billing API"
            className="rounded border border-line bg-canvas px-3 py-2 text-slate-100 outline-none focus:border-slate-500"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-400">Tipo</span>
            <input
              required
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="rounded border border-line bg-canvas px-3 py-2 text-slate-100 outline-none focus:border-slate-500"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-400">Namespace</span>
            <input
              required
              value={namespace}
              onChange={(event) => setNamespace(event.target.value)}
              className="rounded border border-line bg-canvas px-3 py-2 text-slate-100 outline-none focus:border-slate-500"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Ciclo de vida</span>
          <select
            value={lifecycle}
            onChange={(event) =>
              setLifecycle(event.target.value as 'experimental' | 'production' | 'deprecated')
            }
            className="rounded border border-line bg-canvas px-3 py-2 text-slate-100 outline-none focus:border-slate-500"
          >
            <option value="experimental">{translateLifecycle('experimental')}</option>
            <option value="production">{translateLifecycle('production')}</option>
            <option value="deprecated">{translateLifecycle('deprecated')}</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Descricao</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className="rounded border border-line bg-canvas px-3 py-2 text-slate-100 outline-none focus:border-slate-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Repositorio (URL)</span>
          <input
            type="url"
            value={repositoryUrl}
            onChange={(event) => setRepositoryUrl(event.target.value)}
            placeholder="https://github.com/org/repo"
            className="rounded border border-line bg-canvas px-3 py-2 text-slate-100 outline-none focus:border-slate-500"
          />
        </label>

        {createService.isError && (
          <ErrorMessage
            message={
              createService.error instanceof Error
                ? createService.error.message
                : 'Erro ao criar o servico'
            }
          />
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createService.isPending}>
            {createService.isPending ? 'Criando...' : 'Criar servico'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
