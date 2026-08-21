import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { useVIP, useVIPServers, useAddVIPServer, useRemoveVIPServer } from '../features/vips/use-vips';
import { useServers } from '../features/servers/use-servers';
import { Button } from '../shared/components/Button';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { Spinner } from '../shared/components/Spinner';
import { Badge } from '../shared/components/Badge';
import { Modal } from '../shared/components/Modal';
import { TrashIcon } from '../shared/components/icons';

export function VIPDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: vip, isLoading, error } = useVIP(id || null);
  const { data: servers = [] } = useVIPServers(id || null);
  const { data: allServersData } = useServers();
  const addServer = useAddVIPServer(id || '');
  const removeServer = useRemoveVIPServer(id || '');

  const [showAddServer, setShowAddServer] = useState(false);
  const [selectedServerId, setSelectedServerId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage message={String(error)} />;
  if (!vip) return <ErrorMessage message="VIP não encontrado" />;

  const allServers = Array.isArray(allServersData) ? allServersData : [];
  const linkedServerIds = new Set((servers as any[]).map(s => s.id));
  const availableServers = allServers.filter(s => !linkedServerIds.has(s.id));

  const handleAddServer = async () => {
    if (!selectedServerId) return;
    setErrorMsg('');
    try {
      await addServer.mutateAsync(selectedServerId);
      setShowAddServer(false);
      setSelectedServerId('');
    } catch (err) {
      setErrorMsg(String(err));
    }
  };

  const handleRemoveServer = async (serverId: string) => {
    if (!confirm('Remover servidor do VIP?')) return;
    try {
      await removeServer.mutateAsync(serverId);
    } catch (err) {
      setErrorMsg(String(err));
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate('/vips')}
            className="mb-2 text-sm text-blue-400 hover:underline"
          >
            ← Voltar para VIPs
          </button>
          <h1 className="text-2xl font-bold text-white">{vip.hostname}</h1>
          {vip.displayName && (
            <p className="mt-1 text-sm text-slate-400">{vip.displayName}</p>
          )}
        </div>
        <Badge tone={vip.status === 'active' ? 'success' : 'warning'}>
          {vip.status}
        </Badge>
      </div>

      <div className="space-y-4">
        <div className="flex border-b border-slate-800">
          <button className="px-4 py-2 border-b-2 border-blue-500 text-white">Informações</button>
          <button className="px-4 py-2 text-slate-400">Servidores ({servers.length})</button>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {vip.vipAddress && (
                <div>
                  <p className="text-xs font-semibold text-slate-500">Endereço VIP</p>
                  <p className="mt-1 font-mono text-sm text-blue-300">{vip.vipAddress}</p>
                </div>
              )}
              {vip.loadBalancerType && (
                <div>
                  <p className="text-xs font-semibold text-slate-500">Tipo de Load Balancer</p>
                  <p className="mt-1 text-sm text-white">{vip.loadBalancerType}</p>
                </div>
              )}
              {vip.environment && (
                <div>
                  <p className="text-xs font-semibold text-slate-500">Ambiente</p>
                  <p className="mt-1 text-sm text-white">{vip.environment}</p>
                </div>
              )}
              {vip.criticality && (
                <div>
                  <p className="text-xs font-semibold text-slate-500">Criticidade</p>
                  <p className="mt-1 text-sm text-white">{vip.criticality}</p>
                </div>
              )}
              {vip.healthCheckInterval && (
                <div>
                  <p className="text-xs font-semibold text-slate-500">Intervalo de Health Check</p>
                  <p className="mt-1 text-sm text-white">{vip.healthCheckInterval}ms</p>
                </div>
              )}
              {vip.healthCheckPath && (
                <div>
                  <p className="text-xs font-semibold text-slate-500">Path de Health Check</p>
                  <p className="mt-1 font-mono text-sm text-slate-300">{vip.healthCheckPath}</p>
                </div>
              )}
              {vip.ownerTeam && (
                <div>
                  <p className="text-xs font-semibold text-slate-500">Time Responsável</p>
                  <p className="mt-1 text-sm text-white">{vip.ownerTeam}</p>
                </div>
              )}
              {vip.costCenter && (
                <div>
                  <p className="text-xs font-semibold text-slate-500">Centro de Custo</p>
                  <p className="mt-1 text-sm text-white">{vip.costCenter}</p>
                </div>
              )}
            </div>
            {vip.description && (
              <div className="mt-4 border-t border-slate-700 pt-4">
                <p className="text-xs font-semibold text-slate-500">Descrição</p>
                <p className="mt-2 text-sm text-slate-300">{vip.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddServer(true)} className="text-sm">
              Adicionar Servidor
            </Button>
          </div>

          {errorMsg && <ErrorMessage message={errorMsg} />}

          {servers.length === 0 ? (
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-8 text-center">
              <p className="text-slate-400">Nenhum servidor associado a este VIP</p>
              <p className="mt-1 text-sm text-slate-500">
                Adicione servidores para iniciar o balanceamento
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {(servers as any[]).map(server => (
                <div
                  key={server.id}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/30 px-4 py-3"
                >
                  <div>
                    <p className="font-mono text-sm text-white">{server.hostname}</p>
                    {server.ipAddress && (
                      <p className="mt-1 text-xs text-slate-400">{server.ipAddress}</p>
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

          <Modal
            isOpen={showAddServer}
            onClose={() => {
              setShowAddServer(false);
              setSelectedServerId('');
            }}
            title="Adicionar Servidor"
          >
            <div className="space-y-4">
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

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  onClick={() => {
                    setShowAddServer(false);
                    setSelectedServerId('');
                  }}
                  variant="secondary"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddServer}
                  disabled={!selectedServerId || addServer.isPending}
                >
                  {addServer.isPending ? 'Adicionando...' : 'Adicionar'}
                </Button>
              </div>
            </div>
          </Modal>
        </div>
    </div>
  );
}
