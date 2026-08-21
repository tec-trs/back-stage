import { NotFoundError, ValidationError } from '@back-stage/shared';
import type { Knex } from 'knex';

import type { CreateServerGroupDto, ServerGroup, UpdateServerGroupDto } from '../domain/server-group.types.js';
import { ServerGroupRepository } from '../infrastructure/server-group.repository.js';

export class ServerGroupService {
  private repository: ServerGroupRepository;

  public constructor(private readonly db: Knex) {
    this.repository = new ServerGroupRepository(db);
  }

  async createGroup(organizationId: string, data: CreateServerGroupDto): Promise<ServerGroup> {
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('Nome do grupo é obrigatório');
    }

    return this.repository.create(organizationId, data);
  }

  async getGroup(groupId: string, organizationId: string): Promise<ServerGroup> {
    const group = await this.repository.findById(groupId, organizationId);
    if (!group) {
      throw new NotFoundError('Grupo de servidores', groupId);
    }
    return group;
  }

  async listGroups(organizationId: string): Promise<ServerGroup[]> {
    return this.repository.findAll(organizationId);
  }

  async updateGroup(groupId: string, organizationId: string, data: UpdateServerGroupDto): Promise<ServerGroup> {
    await this.getGroup(groupId, organizationId);

    const updated = await this.repository.update(groupId, organizationId, data);
    if (!updated) {
      throw new NotFoundError('Grupo de servidores', groupId);
    }

    return updated;
  }

  async deleteGroup(groupId: string, organizationId: string): Promise<void> {
    await this.getGroup(groupId, organizationId);
    const deleted = await this.repository.delete(groupId, organizationId);

    if (!deleted) {
      throw new NotFoundError('Grupo de servidores', groupId);
    }
  }

  async addServerToGroup(
    groupId: string,
    organizationId: string,
    serverId: string,
    order?: number,
  ): Promise<ServerGroup> {
    // Validar que grupo existe
    const group = await this.getGroup(groupId, organizationId);

    // Validar que servidor existe e pertence à mesma organização
    const server = await this.db('servers')
      .where({ id: serverId, organization_id: organizationId })
      .first();

    if (!server) {
      throw new NotFoundError('Servidor', serverId);
    }

    // Validar que servidor não já está no grupo
    const existingMember = await this.db('server_group_members')
      .where({ group_id: groupId, server_id: serverId, deleted_at: null })
      .first();

    if (existingMember) {
      throw new ValidationError('Este servidor já está vinculado ao grupo');
    }

    // Adicionar servidor ao grupo
    const members = await this.repository.getMembers(groupId, organizationId);
    const nextOrder = order ?? (members.length > 0 ? Math.max(...members.map((m: { order: number }) => m.order)) + 1 : 0);

    await this.repository.addMember(groupId, organizationId, serverId, nextOrder);

    // Criar relacionamento no grafo: VIP depends_on server
    if (group.vipHostname) {
      await this.createVipRelationship(groupId, organizationId, serverId);
    }

    return this.getGroup(groupId, organizationId);
  }

  async removeServerFromGroup(groupId: string, organizationId: string, serverId: string): Promise<ServerGroup> {
    const group = await this.getGroup(groupId, organizationId);

    const removed = await this.repository.removeMember(groupId, organizationId, serverId);
    if (!removed) {
      throw new ValidationError('Servidor não pertence a este grupo');
    }

    // Remover relacionamento no grafo se existir
    if (group.vipHostname) {
      await this.removeVipRelationship(groupId, organizationId, serverId);
    }

    return this.getGroup(groupId, organizationId);
  }

  async getGroupMembers(groupId: string, organizationId: string) {
    await this.getGroup(groupId, organizationId);
    return this.repository.getMemberServers(groupId, organizationId);
  }

  private async createVipRelationship(groupId: string, organizationId: string, serverId: string): Promise<void> {
    try {
      const vipId = `vip:${groupId}`;

      await this.db('resource_relationships').insert({
        source_type: 'vip',
        source_id: vipId,
        target_type: 'server',
        target_id: serverId,
        relation_type: 'depends_on',
        organization_id: organizationId,
        metadata: { type: 'vip_group', groupId },
      });
    } catch (error) {
      // Pode falhar se já existe - ignorar
      console.log('Relacionamento VIP já existe ou não pode ser criado');
    }
  }

  private async removeVipRelationship(groupId: string, organizationId: string, serverId: string): Promise<void> {
    const vipId = `vip:${groupId}`;

    await this.db('resource_relationships')
      .where({
        source_type: 'vip',
        source_id: vipId,
        target_type: 'server',
        target_id: serverId,
        organization_id: organizationId,
      })
      .update({ deleted_at: this.db.fn.now() });
  }
}
