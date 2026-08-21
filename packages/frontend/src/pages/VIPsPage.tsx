import { useState } from 'react';

import { useVIPs, useCreateVIP, useDeleteVIP, type CreateVIPInput } from '../features/vips/use-vips';
import { useEnvironments } from '../features/environments/use-environments';
import { useTeams } from '../features/teams/use-teams';
import { Badge } from '../shared/components/Badge';
import { Button } from '../shared/components/Button';
import { ConfirmDialog } from '../shared/components/ConfirmDialog';
import { EmptyState } from '../shared/components/EmptyState';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { Modal } from '../shared/components/Modal';
import { PageHeader } from '../shared/components/PageHeader';
import { PlusIcon, TrashIcon, PencilIcon } from '../shared/components/icons';
import { Spinner } from '../shared/components/Spinner';

export function VIPsPage() {
  const { data: vips = [], isLoading, error } = useVIPs();
  const { data: environmentsResponse } = useEnvironments();
  const { data: teamsResponse } = useTeams();
  const createVIP = useCreateVIP();
  const deleteVIP = useDeleteVIP();

  const [showForm, setShowForm] = useState(false);
  const [selectedVIPId, setSelectedVIPId] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [formData, setFormData] = useState<CreateVIPInput>({
    hostname: '',
    displayName: '',
    vipAddress: '',
    status: 'active',
  });
  const [formError, setFormError] = useState('');

  const selectedVIP = vips.find(v => v.id === selectedVIPId);
  const environments = Array.isArray(environmentsResponse) ? environmentsResponse : [];
  const teams = Array.isArray(teamsResponse) ? teamsResponse : [];

  const handleCreate = () => {
    setSelectedVIPId(null);
    setFormData({ hostname: '', displayName: '', vipAddress: '', status: 'active' });
    setShowForm(true);
    setFormError('');
  };

  const handleEdit = () => {
    if (!selectedVIP) return;
    setFormData({
      hostname: selectedVIP.hostname,
      displayName: selectedVIP.displayName,
      vipAddress: selectedVIP.vipAddress,
      environment: selectedVIP.environment,
      criticality: selectedVIP.criticality,
      ownerTeam: selectedVIP.ownerTeam,
      status: selectedVIP.status,
    });
    setShowForm(true);
    setFormError('');
  };

  const handleSubmit = async () => {
    if (!formData.hostname?.trim()) {
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

  const handleDeleteConfirm = async () => {
    if (!selectedVIP) return;
    try {
      await deleteVIP.mutateAsync(selectedVIP.id);
      setSelectedVIPId(null);
      setConfirmDeleteOpen(false);
    } catch (err) {
      setFormError(String(err));
    }
  };

  return (
    <div>
      <PageHeader title="VIPs" description="Gerenciar Virtual IPs e balanceadores" />

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Deletar VIP"
        message={`Tem certeza que deseja deletar o VIP "${selectedVIP?.hostname}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Deletar"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDeleteOpen(false)}
        isPending={deleteVIP.isPending}
      />

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Novo VIP">
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
              {environments.map(env => (
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
              {teams.map(team => (
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
              {createVIP.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </Modal>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 p-2">
        <Button size="sm" icon={<PlusIcon />} onClick={handleCreate} title="Incluir um novo VIP">
          Incluir VIP
        </Button>
        <div className="mx-1 h-6 w-px bg-slate-800" />
        <Button
          size="sm"
          variant="secondary"
          icon={<PencilIcon />}
          disabled={!selectedVIP}
          onClick={handleEdit}
          title={selectedVIP ? `Editar ${selectedVIP.hostname}` : 'Selecione um VIP para editar'}
        >
          Editar
        </Button>
        <Button
          size="sm"
          variant="danger"
          icon={<TrashIcon />}
          disabled={!selectedVIP || deleteVIP.isPending}
          onClick={() => setConfirmDeleteOpen(true)}
          title={selectedVIP ? `Deletar ${selectedVIP.hostname}` : 'Selecione um VIP para deletar'}
        >
          Deletar
        </Button>
        <span className="ml-auto text-xs text-slate-500">
          {selectedVIP
            ? `Selecionado: ${selectedVIP.hostname}`
            : 'Selecione um VIP na lista para editar ou deletar.'}
        </span>
      </div>

      {isLoading && <Spinner />}
      {error && (
        <ErrorMessage message={error instanceof Error ? error.message : 'Erro ao carregar VIPs'} />
      )}
      {!isLoading && vips.length === 0 && (
        <EmptyState title="Nenhum VIP encontrado" description="Cadastre o primeiro VIP." />
      )}

      {!isLoading && vips.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium">Hostname</th>
                <th className="px-4 py-2 font-medium">Nome Exibição</th>
                <th className="px-4 py-2 font-medium">Endereço VIP</th>
                <th className="px-4 py-2 font-medium">Ambiente</th>
                <th className="px-4 py-2 font-medium">Time</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {vips.map(vip => (
                <tr
                  key={vip.id}
                  onClick={() => setSelectedVIPId(vip.id)}
                  className={`cursor-pointer border-t border-slate-800 ${
                    selectedVIPId === vip.id ? 'bg-sky-950/40' : 'hover:bg-slate-900/50'
                  }`}
                >
                  <td className="px-4 py-2 font-mono text-white">{vip.hostname}</td>
                  <td className="px-4 py-2 text-slate-400">{vip.displayName || '-'}</td>
                  <td className="px-4 py-2 font-mono text-blue-300">{vip.vipAddress || '-'}</td>
                  <td className="px-4 py-2 text-slate-400">{vip.environment || '-'}</td>
                  <td className="px-4 py-2 text-slate-400">{vip.ownerTeam || '-'}</td>
                  <td className="px-4 py-2">
                    <Badge tone={vip.status === 'active' ? 'success' : 'warning'}>
                      {vip.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
