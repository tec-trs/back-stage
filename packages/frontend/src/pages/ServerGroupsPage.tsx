import { useState } from 'react';

import { useServerGroups, useDeleteServerGroup } from '../features/server-groups/use-server-groups';
import { Button } from '../shared/components/Button';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { Spinner } from '../shared/components/Spinner';
import { Badge } from '../shared/components/Badge';
import { PlusIcon } from '../shared/components/icons';

import { ServerGroupFormDialog } from '../features/server-groups/ServerGroupFormDialog';
import { ServerGroupDetailPanel } from '../features/server-groups/ServerGroupDetailPanel';

export function ServerGroupsPage() {
  const { data: groups = [], isLoading, error } = useServerGroups();
  const deleteGroup = useDeleteServerGroup();
  const [showForm, setShowForm] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage message={String(error)} />;

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  return (
    <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
      {/* Lista de Grupos */}
      <div className="lg:col-span-2">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Grupos de Servidores</h1>
            <p className="mt-1 text-sm text-slate-400">
              Organize servidores em grupos com VIP para load balancing
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedGroupId(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2"
          >
            <PlusIcon size={18} />
            Novo Grupo
          </Button>
        </div>

        {groups.length === 0 ? (
          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-8 text-center">
            <p className="text-slate-400">Nenhum grupo criado</p>
            <p className="mt-2 text-sm text-slate-500">
              Crie o primeiro grupo para organizar seus servidores
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {groups.map(group => (
              <div
                key={group.id}
                onClick={() => setSelectedGroupId(group.id)}
                className={`cursor-pointer rounded-lg border px-4 py-3 transition-all ${
                  selectedGroupId === group.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-800 bg-slate-900/30 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-slate-500">≡</div>
                    <div>
                      <p className="font-medium text-white">{group.name}</p>
                      {group.vipHostname && (
                        <p className="text-sm text-slate-400">VIP: {group.vipHostname}</p>
                      )}
                      {group.description && (
                        <p className="mt-1 text-sm text-slate-500">{group.description}</p>
                      )}
                    </div>
                  </div>
                  <Badge tone={group.status === 'active' ? 'success' : 'warning'}>
                    {group.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Painel de Detalhes */}
      {selectedGroup && (
        <ServerGroupDetailPanel
          group={selectedGroup}
          onEdit={() => setShowForm(true)}
          onDelete={async () => {
            await deleteGroup.mutateAsync(selectedGroup.id);
            setSelectedGroupId(null);
          }}
        />
      )}

      {/* Dialog de Formulário */}
      {showForm && (
        <ServerGroupFormDialog
          groupId={selectedGroupId}
          onClose={() => {
            setShowForm(false);
            if (!selectedGroupId) setSelectedGroupId(null);
          }}
        />
      )}
    </div>
  );
}
