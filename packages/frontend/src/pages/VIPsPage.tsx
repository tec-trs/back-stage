import { useState } from 'react';

import { useVIPs, useCreateVIP, useDeleteVIP, useUpdateVIP, useVIPServers, useAddVIPServer, useRemoveVIPServer, type CreateVIPInput, type VIP } from '../features/vips/use-vips';
import { useServers } from '../features/servers/use-servers';
import { useEnvironments } from '../features/environments/use-environments';
import { useTeams } from '../features/teams/use-teams';
import { Badge } from '../shared/components/Badge';
import { Button } from '../shared/components/Button';
import { ConfirmDialog } from '../shared/components/ConfirmDialog';
import { EmptyState } from '../shared/components/EmptyState';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { Modal } from '../shared/components/Modal';
import { PageHeader } from '../shared/components/PageHeader';
import { PlusIcon, TrashIcon, PencilIcon, CopyIcon, ServerIcon } from '../shared/components/icons';
import { Spinner } from '../shared/components/Spinner';

export function VIPsPage() {
  const { data: vips = [], isLoading, error } = useVIPs();
  const { data: environmentsResponse } = useEnvironments();
  const { data: teamsResponse } = useTeams();
  const { data: allServersResponse } = useServers();
  const createVIP = useCreateVIP();
  const deleteVIP = useDeleteVIP();

  const [showForm, setShowForm] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [editingVIP, setEditingVIP] = useState<VIP | null>(null);
  const updateVIP = useUpdateVIP(editingVIP?.id || '');
  const [formData, setFormData] = useState<CreateVIPInput>({
    hostname: '',
    displayName: '',
    vipAddress: '',
    status: 'active',
  });
  const [formError, setFormError] = useState('');

  const [showServersModal, setShowServersModal] = useState(false);
  const [managingServersVIP, setManagingServersVIP] = useState<VIP | null>(null);
  const { data: servers = [] } = useVIPServers(managingServersVIP?.id || null);
  const addServer = useAddVIPServer(managingServersVIP?.id || '');
  const removeServer = useRemoveVIPServer(managingServersVIP?.id || '');
  const [selectedServerId, setSelectedServerId] = useState<string>('');
  const [serversError, setServersError] = useState('');

  const selectedItems = Array.from(selectedIds).map(id => vips.find(v => v.id === id)).filter(Boolean) as VIP[];
  const singleSelected = selectedItems.length === 1 ? selectedItems[0] : null;
  const allVisible = vips.length > 0 && vips.every(v => selectedIds.has(v.id));
  const environments = Array.isArray(environmentsResponse) ? environmentsResponse : [];
  const teams = Array.isArray(teamsResponse) ? teamsResponse : [];

  const allServers = allServersResponse?.items ?? [];
  const linkedServerIds = new Set((servers as any[]).map(s => s.id));
  const availableServers = allServers.filter(s => !linkedServerIds.has(s.id));

  function toggleAll(): void {
    if (allVisible) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(vips.map(v => v.id)));
    }
  }

  function toggleOne(id: string): void {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const handleCreate = () => {
    setEditingVIP(null);
    setFormData({ hostname: '', displayName: '', vipAddress: '', status: 'active' });
    setShowForm(true);
    setFormError('');
  };

  const handleEdit = () => {
    if (!singleSelected) return;
    setEditingVIP(singleSelected);
    setFormData({
      hostname: singleSelected.hostname,
      displayName: singleSelected.displayName,
      description: singleSelected.description,
      vipAddress: singleSelected.vipAddress,
      loadBalancerType: singleSelected.loadBalancerType,
      environment: singleSelected.environment,
      criticality: singleSelected.criticality,
      ownerTeam: singleSelected.ownerTeam,
      status: singleSelected.status,
    });
    setShowForm(true);
    setFormError('');
  };

  const handleDuplicate = () => {
    if (!singleSelected) return;
    setEditingVIP(null);
    setFormData({
      hostname: `${singleSelected.hostname}-copy`,
      displayName: singleSelected.displayName,
      vipAddress: '',
      environment: singleSelected.environment,
      criticality: singleSelected.criticality,
      ownerTeam: singleSelected.ownerTeam,
      status: 'inactive',
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
      // Filtrar valores null/undefined/vazio para evitar erro de validação
      const cleanData = Object.fromEntries(
        Object.entries(formData).filter(([_, v]) => v !== null && v !== undefined && v !== '')
      );
      if (editingVIP) {
        await updateVIP.mutateAsync(cleanData as CreateVIPInput);
      } else {
        await createVIP.mutateAsync(cleanData as CreateVIPInput);
      }
      setShowForm(false);
      setEditingVIP(null);
      setFormData({ hostname: '', displayName: '', vipAddress: '', status: 'active' });
      setFormError('');
    } catch (err) {
      setFormError(String(err));
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedItems.length === 0) return;
    try {
      for (const vip of selectedItems) {
        await deleteVIP.mutateAsync(vip.id);
      }
      setSelectedIds(new Set());
      setConfirmDeleteOpen(false);
    } catch (err) {
      setFormError(String(err));
    }
  };

  const handleManageServers = () => {
    if (!singleSelected) return;
    setManagingServersVIP(singleSelected);
    setShowServersModal(true);
    setServersError('');
    setSelectedServerId('');
  };

  const handleAddServer = async () => {
    if (!selectedServerId) return;
    setServersError('');
    try {
      await addServer.mutateAsync(selectedServerId);
      setSelectedServerId('');
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      setServersError(error);
    }
  };

  const handleRemoveServer = async (serverId: string) => {
    if (!confirm('Remover servidor do VIP?')) return;
    try {
      await removeServer.mutateAsync(serverId);
    } catch (err) {
      setServersError(String(err));
    }
  };

  const deleteLabel = selectedItems.length > 1 ? `Deletar (${selectedItems.length})` : 'Deletar';
  const deleteMessage =
    selectedItems.length === 1
      ? `Tem certeza que deseja deletar o VIP "${singleSelected?.hostname}"? Esta ação não pode ser desfeita.`
      : `Tem certeza que deseja deletar ${selectedItems.length} VIPs? Esta ação não pode ser desfeita.`;

  return (
    <div>
      <PageHeader title="VIPs" description="Gerenciar Virtual IPs e balanceadores" />

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Deletar VIP"
        message={deleteMessage}
        confirmLabel={deleteLabel}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDeleteOpen(false)}
        isPending={deleteVIP.isPending}
      />

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingVIP ? 'Editar VIP' : 'Novo VIP'}>
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
            <label className="block text-sm font-medium text-slate-300">Descrição</label>
            <textarea
              value={formData.description || ''}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
              rows={2}
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
            <label className="block text-sm font-medium text-slate-300">Tipo de Load Balancer</label>
            <input
              type="text"
              value={formData.loadBalancerType || ''}
              onChange={e => setFormData({ ...formData, loadBalancerType: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
              placeholder="ex: Layer 4, Layer 7"
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
            <label className="block text-sm font-medium text-slate-300">Criticidade</label>
            <input
              type="text"
              value={formData.criticality || ''}
              onChange={e => setFormData({ ...formData, criticality: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
              placeholder="ex: Crítico, Alto, Médio"
            />
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
                setEditingVIP(null);
                setFormError('');
              }}
              variant="secondary"
              disabled={createVIP.isPending || updateVIP.isPending}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={createVIP.isPending || updateVIP.isPending}>
              {createVIP.isPending || updateVIP.isPending ? 'Salvando...' : 'Salvar'}
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
          disabled={!singleSelected}
          onClick={handleEdit}
          title={singleSelected ? `Editar ${singleSelected.hostname}` : 'Selecione um VIP para editar'}
        >
          Editar
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<CopyIcon />}
          disabled={!singleSelected}
          onClick={handleDuplicate}
          title={singleSelected ? `Duplicar ${singleSelected.hostname}` : 'Selecione um VIP para duplicar'}
        >
          Duplicar
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<ServerIcon />}
          disabled={!singleSelected}
          onClick={handleManageServers}
          title={singleSelected ? `Gerenciar servidores de ${singleSelected.hostname}` : 'Selecione um VIP para gerenciar servidores'}
        >
          Servidores
        </Button>
        <Button
          size="sm"
          variant="danger"
          icon={<TrashIcon />}
          disabled={selectedItems.length === 0 || deleteVIP.isPending}
          onClick={() => setConfirmDeleteOpen(true)}
          title={selectedItems.length > 0 ? `Deletar ${selectedItems.length} VIP(s)` : 'Selecione VIPs para deletar'}
        >
          {deleteLabel}
        </Button>
        <span className="ml-auto text-xs text-slate-500">
          {selectedItems.length > 0
            ? selectedItems.length === 1
              ? `Selecionado: ${singleSelected?.hostname}`
              : `${selectedItems.length} VIPs selecionados`
            : 'Selecione VIPs na lista para editar, duplicar ou deletar.'}
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
                <th className="w-10 px-4 py-2">
                  <input
                    type="checkbox"
                    checked={allVisible}
                    onChange={toggleAll}
                    className="h-4 w-4 accent-sky-500"
                    aria-label="Selecionar todos"
                  />
                </th>
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
                  onClick={() => toggleOne(vip.id)}
                  className={`border-t border-slate-800 ${
                    selectedIds.has(vip.id) ? 'bg-sky-950/40' : 'hover:bg-slate-900/50'
                  }`}
                >
                  <td className="cursor-pointer px-4 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(vip.id)}
                      onChange={() => toggleOne(vip.id)}
                      onClick={e => e.stopPropagation()}
                      aria-label={`Selecionar ${vip.hostname}`}
                      className="h-4 w-4 accent-sky-500"
                    />
                  </td>
                  <td className="cursor-pointer px-4 py-2 font-mono text-white">{vip.hostname}</td>
                  <td className="cursor-pointer px-4 py-2 text-slate-400">{vip.displayName || '-'}</td>
                  <td className="cursor-pointer px-4 py-2 font-mono text-blue-300">{vip.vipAddress || '-'}</td>
                  <td className="cursor-pointer px-4 py-2 text-slate-400">{vip.environment || '-'}</td>
                  <td className="cursor-pointer px-4 py-2 text-slate-400">{vip.ownerTeam || '-'}</td>
                  <td className="cursor-pointer px-4 py-2">
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

      <Modal
        isOpen={showServersModal}
        onClose={() => {
          setShowServersModal(false);
          setManagingServersVIP(null);
          setSelectedServerId('');
          setServersError('');
        }}
        title={`Gerenciar Servidores - ${managingServersVIP?.hostname}`}
      >
        <div className="space-y-4">
          {serversError && <ErrorMessage message={serversError} />}

          <div>
            <h3 className="mb-3 text-sm font-semibold text-white">Servidores Vinculados</h3>
            {servers.length === 0 ? (
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 text-center">
                <p className="text-sm text-slate-400">Nenhum servidor associado a este VIP</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {(servers as any[]).map(server => (
                  <div
                    key={server.id}
                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/30 px-3 py-2"
                  >
                    <div>
                      <p className="font-mono text-sm text-white">{server.hostname}</p>
                      {server.ipAddress && (
                        <p className="text-xs text-slate-400">{server.ipAddress}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveServer(server.id)}
                      className="text-slate-400 hover:text-red-400"
                      title="Remover servidor"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-700 pt-4">
            <h3 className="mb-3 text-sm font-semibold text-white">Adicionar Servidor</h3>
            {availableServers.length === 0 ? (
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 text-center">
                <p className="text-sm text-slate-400">
                  Nenhum servidor disponível. Todos já estão vinculados ou não existem servidores criados.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <select
                  value={selectedServerId}
                  onChange={e => setSelectedServerId(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                >
                  <option value="">Selecionar servidor...</option>
                  {availableServers.map(server => (
                    <option key={server.id} value={server.id}>
                      {server.hostname}
                    </option>
                  ))}
                </select>
                <div className="flex justify-end gap-2">
                  <Button
                    onClick={handleAddServer}
                    disabled={!selectedServerId || addServer.isPending}
                    size="sm"
                  >
                    {addServer.isPending ? 'Adicionando...' : 'Adicionar'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={() => {
                setShowServersModal(false);
                setManagingServersVIP(null);
                setSelectedServerId('');
                setServersError('');
              }}
              variant="secondary"
            >
              Fechar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
