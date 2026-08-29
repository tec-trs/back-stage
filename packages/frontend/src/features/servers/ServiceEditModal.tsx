import { type FormEvent, useState } from 'react';

import { Button } from '../../shared/components/Button';
import { Modal } from '../../shared/components/Modal';
import type { ServiceStatus } from './use-servers';
import type { ServiceInput } from './service-input';

export type { ServiceInput };

const inputClass =
  'rounded-md border border-slate-700 bg-canvas px-3 py-2 text-slate-100 outline-none focus:border-slate-500';

export function ServiceEditModal({
  service,
  index,
  isWindows,
  onSave,
  onCancel,
}: {
  service: ServiceInput;
  index: number | null;
  isWindows: boolean;
  onSave: (updated: ServiceInput, index: number | null) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<ServiceInput>({ ...service });
  const [nameError, setNameError] = useState('');

  function setField<K extends keyof ServiceInput>(key: K, value: ServiceInput[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: FormEvent): void {
    e.preventDefault();
    if (!form.name.trim()) {
      setNameError('Informe o nome do servico');
      return;
    }
    onSave({ ...form, name: form.name.trim() }, index);
  }

  const isNew = index === null;
  const title = isNew
    ? `Incluir Servico #${String(form.seq).padStart(3, '0')}`
    : `Editar Servico #${String(form.seq).padStart(3, '0')}`;

  return (
    <Modal title={title} isOpen onClose={onCancel} size="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-400">Nome do servico *</span>
            <input
              required
              value={form.name}
              onChange={(e) => {
                setField('name', e.target.value);
                if (nameError) setNameError('');
              }}
              placeholder="nginx, tomcat, postgres..."
              className={inputClass}
            />
            {nameError && <span className="text-xs text-red-400">{nameError}</span>}
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-400">Situacao</span>
            <select
              value={form.status}
              onChange={(e) => setField('status', e.target.value as ServiceStatus)}
              className={inputClass}
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Portas (separadas por virgula)</span>
          <input
            value={form.ports}
            onChange={(e) => setField('ports', e.target.value)}
            placeholder="80, 443, 8080"
            className={inputClass}
          />
        </label>

        {!isWindows && (
          <>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Comando de iniciar</span>
              <input
                value={form.commandStart}
                onChange={(e) => setField('commandStart', e.target.value)}
                placeholder="systemctl start nginx"
                className={`${inputClass} font-mono text-sm`}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Comando de parar</span>
              <input
                value={form.commandStop}
                onChange={(e) => setField('commandStop', e.target.value)}
                placeholder="systemctl stop nginx"
                className={`${inputClass} font-mono text-sm`}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Comando de status</span>
              <input
                value={form.commandStatus}
                onChange={(e) => setField('commandStatus', e.target.value)}
                placeholder="systemctl status nginx"
                className={`${inputClass} font-mono text-sm`}
              />
            </label>
          </>
        )}

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Observacoes</span>
          <textarea
            value={form.observations}
            onChange={(e) => setField('observations', e.target.value)}
            rows={2}
            placeholder="Informacoes adicionais sobre o servico..."
            className={inputClass}
          />
        </label>

        <div className="flex justify-end gap-3 border-t border-slate-800 pt-3">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            {isNew ? 'Incluir servico' : 'Salvar alteracoes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
