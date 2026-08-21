import { useState } from 'react';
import {
  useCreateServerGroup,
  useUpdateServerGroup,
  useServerGroup,
  type CreateServerGroupInput,
} from './use-server-groups';
import { Modal } from '../../shared/components/Modal';
import { Button } from '../../shared/components/Button';
import { Spinner } from '../../shared/components/Spinner';
import { ErrorMessage } from '../../shared/components/ErrorMessage';

interface ServerGroupFormDialogProps {
  groupId: string | null;
  onClose: () => void;
}

export function ServerGroupFormDialog({ groupId, onClose }: ServerGroupFormDialogProps) {
  const { data: existingGroup, isLoading: isLoadingGroup } = useServerGroup(groupId);
  const createGroup = useCreateServerGroup();
  const updateGroup = useUpdateServerGroup(groupId || '');

  const [formData, setFormData] = useState<CreateServerGroupInput>(() => {
    if (existingGroup) {
      return {
        name: existingGroup.name,
        description: existingGroup.description,
        environment: existingGroup.environment,
        status: existingGroup.status,
        criticality: existingGroup.criticality,
        vipHostname: existingGroup.vipHostname,
        vipAddress: existingGroup.vipAddress,
        loadBalancerType: existingGroup.loadBalancerType,
        healthCheckInterval: existingGroup.healthCheckInterval,
        healthCheckPath: existingGroup.healthCheckPath,
      };
    }
    return {
      name: '',
      status: 'active',
      loadBalancerType: 'round_robin',
      healthCheckInterval: 30,
    };
  });

  const isLoading = isLoadingGroup || createGroup.isPending || updateGroup.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (groupId) {
        await updateGroup.mutateAsync(formData);
      } else {
        await createGroup.mutateAsync(formData);
      }
      onClose();
    } catch (error) {
      console.error('Erro ao salvar grupo:', error);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={groupId ? 'Editar Grupo' : 'Novo Grupo'}>
      {isLoadingGroup ? (
        <Spinner />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {createGroup.error && <ErrorMessage message={String(createGroup.error)} />}
          {updateGroup.error && <ErrorMessage message={String(updateGroup.error)} />}

          <div>
            <label className="block text-sm font-medium text-white">
              Nome do Grupo *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-white"
              placeholder="ex: LS Balance"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white">
              Descrição
            </label>
            <textarea
              value={formData.description || ''}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-white"
              placeholder="Descrição do grupo"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white">
                VIP Hostname
              </label>
              <input
                type="text"
                value={formData.vipHostname || ''}
                onChange={e => setFormData({ ...formData, vipHostname: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                placeholder="ex: ls.totvs.com.br"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white">
                VIP Address
              </label>
              <input
                type="text"
                value={formData.vipAddress || ''}
                onChange={e => setFormData({ ...formData, vipAddress: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                placeholder="ex: 192.168.1.100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white">
                Tipo de Load Balancer
              </label>
              <select
                value={formData.loadBalancerType || 'round_robin'}
                onChange={e => setFormData({ ...formData, loadBalancerType: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-white"
              >
                <option value="round_robin">Round Robin</option>
                <option value="weighted">Weighted</option>
                <option value="least_conn">Least Connections</option>
                <option value="ip_hash">IP Hash</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white">
                Intervalo de Health Check (segundos)
              </label>
              <input
                type="number"
                value={formData.healthCheckInterval || 30}
                onChange={e => setFormData({ ...formData, healthCheckInterval: Number(e.target.value) })}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                min="5"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white">
              Path de Health Check
            </label>
            <input
              type="text"
              value={formData.healthCheckPath || ''}
              onChange={e => setFormData({ ...formData, healthCheckPath: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-white"
              placeholder="ex: /health"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Spinner /> : 'Salvar'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
