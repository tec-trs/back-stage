import { useState } from 'react';

import { useAllUsers } from '../users/use-all-users';
import { Button } from '../../shared/components/Button';
import { ErrorMessage } from '../../shared/components/ErrorMessage';
import { Modal } from '../../shared/components/Modal';
import { Badge } from '../../shared/components/Badge';
import { TrashIcon } from '../../shared/components/icons';
import type { TeamMember, TeamRole, TeamSummary } from './use-teams';
import {
  useAddTeamMember,
  useRemoveTeamMember,
  useUpdateMemberRole,
} from './use-team-members';

const inputClass =
  'rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-slate-500';

export function TeamMembersDialog({
  isOpen,
  onClose,
  team,
}: {
  isOpen: boolean;
  onClose: () => void;
  team: TeamSummary;
}) {
  const { data: allUsers } = useAllUsers();
  const addMember = useAddTeamMember();
  const removeMember = useRemoveTeamMember();
  const updateRole = useUpdateMemberRole();

  const [addUserId, setAddUserId] = useState('');
  const [addRole, setAddRole] = useState<TeamRole>('member');

  const members = team.members;
  const memberUserIds = new Set(members.map((m) => m.userId));

  const availableUsers = (allUsers ?? []).filter(
    (u) => u.isActive && !memberUserIds.has(u.id),
  );

  function handleAdd(): void {
    if (!addUserId) return;
    addMember.mutate(
      { teamId: team.id, userId: addUserId, role: addRole },
      {
        onSuccess: () => {
          setAddUserId('');
          setAddRole('member');
          addMember.reset();
        },
      },
    );
  }

  function handleRemove(member: TeamMember): void {
    removeMember.mutate({ teamId: team.id, userId: member.userId });
  }

  function handleRoleChange(member: TeamMember, role: TeamRole): void {
    updateRole.mutate({ teamId: team.id, userId: member.userId, role });
  }

  const anyPending = addMember.isPending || removeMember.isPending || updateRole.isPending;

  return (
    <Modal
      title={`Membros — ${team.name}`}
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
    >
      <div className="flex flex-col gap-5">
        {/* Adicionar membro */}
        <div className="rounded-md border border-slate-700 bg-slate-900/40 p-4">
          <p className="mb-3 text-sm font-medium text-slate-300">Adicionar membro</p>
          <div className="flex items-end gap-2">
            <label className="flex flex-1 flex-col gap-1 text-xs">
              <span className="text-slate-400">Usuario</span>
              <select
                value={addUserId}
                onChange={(e) => {
                  setAddUserId(e.target.value);
                  addMember.reset();
                }}
                className={`${inputClass} text-sm`}
                disabled={addMember.isPending}
              >
                <option value="">Selecione um usuario...</option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.code})
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-slate-400">Papel</span>
              <select
                value={addRole}
                onChange={(e) => setAddRole(e.target.value as TeamRole)}
                className={`${inputClass} text-sm`}
                disabled={addMember.isPending}
              >
                <option value="member">Membro</option>
                <option value="owner">Responsavel</option>
              </select>
            </label>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!addUserId || addMember.isPending}
            >
              {addMember.isPending ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </div>
          {addMember.isError && (
            <p className="mt-2 text-xs text-red-400">
              {addMember.error instanceof Error ? addMember.error.message : 'Erro ao adicionar membro'}
            </p>
          )}
          {availableUsers.length === 0 && (
            <p className="mt-2 text-xs text-slate-500">
              Todos os usuarios ativos ja sao membros deste time.
            </p>
          )}
        </div>

        {/* Lista de membros */}
        <div>
          <p className="mb-2 text-sm font-medium text-slate-300">
            Membros atuais{' '}
            <Badge>{members.length}</Badge>
          </p>

          {members.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">
              Nenhum membro adicionado ainda.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-slate-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60">
                    <th className="px-4 py-2 text-left font-medium text-slate-400">Nome</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-400">Codigo</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-400">Email</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-400">Papel</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr
                      key={member.userId}
                      className="border-b border-slate-800/50 last:border-0"
                    >
                      <td className="px-4 py-2 text-slate-100">{member.fullName}</td>
                      <td className="px-4 py-2 font-mono text-xs text-slate-400">{member.code}</td>
                      <td className="px-4 py-2 text-slate-400">{member.email}</td>
                      <td className="px-4 py-2">
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member, e.target.value as TeamRole)}
                          disabled={anyPending}
                          className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 outline-none focus:border-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <option value="member">Membro</option>
                          <option value="owner">Responsavel</option>
                        </select>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Button
                          variant="ghost-danger"
                          size="sm"
                          icon={<TrashIcon />}
                          disabled={anyPending}
                          onClick={() => handleRemove(member)}
                          title={`Remover ${member.fullName} do time`}
                        >
                          Remover
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(removeMember.isError || updateRole.isError) && (
            <ErrorMessage
              message={
                (removeMember.error ?? updateRole.error) instanceof Error
                  ? ((removeMember.error ?? updateRole.error) as Error).message
                  : 'Erro ao atualizar membros'
              }
            />
          )}
        </div>

        <div className="flex justify-end border-t border-slate-800 pt-3">
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
