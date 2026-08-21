import { useState } from 'react';
import { TrashIcon, PlusIcon } from '../../shared/components/icons';

import { useGroupMembers, useAddGroupMember, useRemoveGroupMember, type ServerGroup } from './use-server-groups';
import { useServers } from '../servers/use-servers';
import { Button } from '../../shared/components/Button';
import { Spinner } from '../../shared/components/Spinner';
import { Badge } from '../../shared/components/Badge';

interface ServerGroupDetailPanelProps {
  group: ServerGroup;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}

export function ServerGroupDetailPanel({ group, onEdit, onDelete }: ServerGroupDetailPanelProps) {
  const { data: members = [], isLoading: isLoadingMembers } = useGroupMembers(group.id);
  const { data: serversData } = useServers();
  const servers = serversData?.items ?? [];
  const addMember = useAddGroupMember(group.id);
  const removeMember = useRemoveGroupMember(group.id);
  const [showAddServer, setShowAddServer] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const memberServerIds = new Set((members as any[]).map((m: any) => m.serverId));
  const availableServers = (servers as any[]).filter((s: any) => !memberServerIds.has(s.id));

  const memberServers = (servers as any[]).filter((s: any) => memberServerIds.has(s.id));

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-6">
      <div className="mb-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{group.name}</h2>
            {group.description && (
              <p className="mt-1 text-sm text-slate-400">{group.description}</p>
            )}
          </div>
          <Badge tone={group.status === 'active' ? 'success' : 'warning'}>
            {group.status}
          </Badge>
        </div>

        {group.vipHostname && (
          <div className="mb-3 rounded bg-blue-500/10 p-3">
            <p className="text-xs font-medium uppercase text-blue-300">VIP</p>
            <p className="text-sm font-mono text-blue-200">{group.vipHostname}</p>
            {group.vipAddress && (
              <p className="text-xs text-blue-300">{group.vipAddress}</p>
            )}
          </div>
        )}

        {group.loadBalancerType && (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-slate-500">Load Balancer</p>
              <p className="text-white">{group.loadBalancerType}</p>
            </div>
            <div>
              <p className="text-slate-500">Health Check</p>
              <p className="text-white">{group.healthCheckInterval}s</p>
            </div>
          </div>
        )}
      </div>

      <div className="mb-6 space-y-4 border-t border-slate-800 pt-6">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-white">
            Servidores ({memberServers.length})
          </h3>
          <Button
            size="sm"
            onClick={() => setShowAddServer(!showAddServer)}
            className="flex items-center gap-2"
          >
            <PlusIcon size={16} />
            Adicionar
          </Button>
        </div>

        {isLoadingMembers ? (
          <Spinner />
        ) : memberServers.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum servidor vinculado</p>
        ) : (
          <div className="space-y-2">
            {memberServers.map(server => (
              <div
                key={server.id}
                className="flex items-center justify-between rounded border border-slate-800 bg-slate-900/20 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-white">{server.hostname}</p>
                  <p className="text-xs text-slate-500">{server.id}</p>
                </div>
                <button
                  onClick={() => removeMember.mutate(server.id)}
                  disabled={removeMember.isPending}
                  className="text-slate-400 hover:text-red-400"
                >
                  <TrashIcon size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {showAddServer && availableServers.length > 0 && (
          <div className="rounded border border-slate-800 bg-slate-900/20 p-3">
            <select
              onChange={e => {
                if (e.target.value) {
                  addMember.mutate(e.target.value);
                  e.target.value = '';
                }
              }}
              className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-white"
            >
              <option value="">Selecione um servidor...</option>
              {availableServers.map(server => (
                <option key={server.id} value={server.id}>
                  {server.hostname}
                </option>
              ))}
            </select>
          </div>
        )}

        {showAddServer && availableServers.length === 0 && (
          <p className="text-sm text-slate-500">Todos os servidores estão vinculados</p>
        )}
      </div>

      <div className="flex gap-2 border-t border-slate-800 pt-4">
        <Button variant="secondary" onClick={onEdit} className="flex-1">
          Editar
        </Button>
        <Button
          variant="danger"
          onClick={async () => {
            if (confirm('Tem certeza que deseja deletar este grupo?')) {
              setIsDeleting(true);
              await onDelete();
            }
          }}
          disabled={isDeleting}
          className="flex-1"
        >
          {isDeleting ? <Spinner /> : 'Deletar'}
        </Button>
      </div>
    </div>
  );
}
