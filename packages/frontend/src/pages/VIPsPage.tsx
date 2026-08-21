import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useVIPs, useCreateVIP, type CreateVIPInput } from '../features/vips/use-vips';
import { useEnvironments } from '../features/environments/use-environments';
import { useTeams } from '../features/teams/use-teams';
import { Button } from '../shared/components/Button';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { Spinner } from '../shared/components/Spinner';
import { Badge } from '../shared/components/Badge';
import { Modal } from '../shared/components/Modal';
import { PlusIcon } from '../shared/components/icons';

export function VIPsPage() {
  const { data: vips = [], isLoading, error } = useVIPs();
  const navigate = useNavigate();
  const createVIP = useCreateVIP();
  const { data: environmentsResponse } = useEnvironments();
  const { data: teamsResponse } = useTeams();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CreateVIPInput>({
    hostname: '',
    displayName: '',
    vipAddress: '',
    status: 'active',
  });
  const [formError, setFormError] = useState('');

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage message={String(error)} />;

  const handleSubmit = async () => {
    if (!formData.hostname.trim()) {
      setFormError('Hostname é obrigatório');
      return;
    }
    try {
      await createVIP.mutateAsync(formData);
      setShowForm(false);
      setFormData({ hostname: '', displayName: '', vipAddress: '', status: 'active' });
      setFormError('');
    } catch (err) {
      setFormError(String(err));
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">VIPs</h1>
          <p className="mt-1 text-sm text-slate-400">
            Gerenciar Virtual IPs e seus servidores associados
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <PlusIcon />
          Novo VIP
        </Button>
      </div>

      {vips.length === 0 ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-8 text-center">
          <p className="text-slate-400">Nenhum VIP criado</p>
          <p className="mt-2 text-sm text-slate-500">
            Crie seu primeiro VIP para gerenciar servidores em balanceamento
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {vips.map(vip => (
            <div
              key={vip.id}
              onClick={() => navigate(`/vips/${vip.id}`)}
              className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-800 bg-slate-900/30 px-4 py-3 transition-all hover:border-slate-700 hover:bg-slate-900/50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-mono text-sm text-white">{vip.hostname}</p>
                    {vip.displayName && (
                      <p className="mt-1 text-xs text-slate-400">{vip.displayName}</p>
                    )}
                  </div>
                  <Badge tone={vip.status === 'active' ? 'success' : 'warning'}>
                    {vip.status}
                  </Badge>
                </div>
                {vip.vipAddress && (
                  <p className="mt-2 text-xs text-blue-300">{vip.vipAddress}</p>
                )}
              </div>
              <span className="text-slate-500">→</span>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setFormError('');
        }}
        title="Criar Novo VIP"
      >
        <div className="space-y-4">
          {formError && <ErrorMessage message={formError} />}
          <div>
            <label className="block text-sm font-medium text-slate-300">Hostname *</label>
            <input
              type="text"
              value={formData.hostname}
              onChange={e => setFormData({ ...formData, hostname: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
              placeholder="ex: vip-app-01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">Nome Exibição</label>
            <input
              type="text"
              value={formData.displayName || ''}
              onChange={e => setFormData({ ...formData, displayName: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
              placeholder="ex: App Balance"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">Endereço VIP</label>
            <input
              type="text"
              value={formData.vipAddress || ''}
              onChange={e => setFormData({ ...formData, vipAddress: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
              placeholder="ex: 192.168.1.100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">Ambiente</label>
            <select
              value={formData.environment || ''}
              onChange={e => setFormData({ ...formData, environment: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            >
              <option value="">Selecionar ambiente...</option>
              {(environmentsResponse?.items ?? []).map(env => (
                <option key={env.id} value={env.name}>
                  {env.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">Time</label>
            <select
              value={formData.ownerTeam || ''}
              onChange={e => setFormData({ ...formData, ownerTeam: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            >
              <option value="">Selecionar time...</option>
              {(teamsResponse?.items ?? []).map(team => (
                <option key={team.id} value={team.name}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">Status</label>
            <select
              value={formData.status || 'active'}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            >
              <option value="active">Ativo</option>
              <option value="maintenance">Manutenção</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              onClick={() => {
                setShowForm(false);
                setFormError('');
              }}
              variant="secondary"
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={createVIP.isPending}>
              {createVIP.isPending ? 'Criando...' : 'Criar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
