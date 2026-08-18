import { type FormEvent, useState } from 'react';

import { Button } from '../../shared/components/Button';
import { Modal } from '../../shared/components/Modal';
import type { DeployEnvironment } from './use-applications';
import type { DeploymentInput } from './use-create-application';

interface ServerOption {
  id: string;
  hostname: string;
  displayName?: string | null;
}

interface EnvironmentOption {
  slug: string;
  name: string;
}

const inputClass =
  'rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-slate-500';

export function DeploymentEditModal({
  deployment,
  index,
  servers,
  environments,
  onSave,
  onCancel,
}: {
  deployment: DeploymentInput;
  index: number | null;
  servers: ServerOption[];
  environments: EnvironmentOption[];
  onSave: (updated: DeploymentInput, index: number | null) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<DeploymentInput>({ ...deployment });
  const [serverError, setServerError] = useState('');

  function setField<K extends keyof DeploymentInput>(key: K, value: DeploymentInput[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: FormEvent): void {
    e.preventDefault();
    if (!form.serverId) {
      setServerError('Selecione a maquina');
      return;
    }
    onSave({ ...form }, index);
  }

  const isNew = index === null;
  const title = isNew ? 'Incluir Implantacao' : 'Editar Implantacao';

  return (
    <Modal title={title} isOpen onClose={onCancel} size="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Maquina *</span>
          <select
            value={form.serverId}
            onChange={(e) => {
              setField('serverId', e.target.value);
              if (serverError) setServerError('');
            }}
            className={inputClass}
          >
            <option value="">Selecione a maquina...</option>
            {servers.map((server) => (
              <option key={server.id} value={server.id}>
                {server.hostname}
                {server.displayName ? ` — ${server.displayName}` : ''}
              </option>
            ))}
          </select>
          {serverError && <span className="text-xs text-red-400">{serverError}</span>}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Ambiente *</span>
          <select
            value={form.environment}
            onChange={(e) => setField('environment', e.target.value as DeployEnvironment)}
            className={inputClass}
          >
            {environments.map((env) => (
              <option key={env.slug} value={env.slug}>
                {env.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-400">Versao implantada</span>
            <input
              value={form.deployedVersion ?? ''}
              onChange={(e) => setField('deployedVersion', e.target.value || null)}
              placeholder="1.0.0"
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-400">Metodo de deploy</span>
            <input
              value={form.deployMethod ?? ''}
              onChange={(e) => setField('deployMethod', e.target.value || null)}
              placeholder="docker, helm, manual..."
              className={inputClass}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">URL de acesso</span>
          <input
            value={form.accessUrl ?? ''}
            onChange={(e) => setField('accessUrl', e.target.value || null)}
            placeholder="https://app.example.com"
            className={inputClass}
          />
        </label>

        <div className="flex justify-end gap-3 border-t border-slate-800 pt-3">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            {isNew ? 'Incluir implantacao' : 'Salvar alteracoes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
