import type { Knex } from 'knex';

import type { CreateServerGroupDto, ServerGroup, ServerGroupMember, UpdateServerGroupDto } from '../domain/server-group.types.js';

export class ServerGroupRepository {
  public constructor(private readonly db: Knex) {}

  async create(organizationId: string, data: CreateServerGroupDto): Promise<ServerGroup> {
    const [group] = await this.db('server_groups')
      .insert({
        organization_id: organizationId,
        name: data.name,
        description: data.description || null,
        environment: data.environment || null,
        status: data.status || 'active',
        criticality: data.criticality || null,
        vip_hostname: data.vipHostname || null,
        vip_address: data.vipAddress || null,
        load_balancer_type: data.loadBalancerType || null,
        health_check_interval: data.healthCheckInterval || 30,
        health_check_path: data.healthCheckPath || null,
      })
      .returning('*');

    return this.toDto(group);
  }

  async findById(groupId: string, organizationId: string): Promise<ServerGroup | null> {
    const group = await this.db('server_groups')
      .where({ id: groupId, organization_id: organizationId, deleted_at: null })
      .first();

    return group ? this.toDto(group) : null;
  }

  async findAll(organizationId: string): Promise<ServerGroup[]> {
    const groups = await this.db('server_groups')
      .where({ organization_id: organizationId, deleted_at: null })
      .orderBy('name');

    return groups.map((g) => this.toDto(g));
  }

  async update(groupId: string, organizationId: string, data: UpdateServerGroupDto): Promise<ServerGroup | null> {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.environment !== undefined) updateData.environment = data.environment;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.criticality !== undefined) updateData.criticality = data.criticality;
    if (data.vipHostname !== undefined) updateData.vip_hostname = data.vipHostname;
    if (data.vipAddress !== undefined) updateData.vip_address = data.vipAddress;
    if (data.loadBalancerType !== undefined) updateData.load_balancer_type = data.loadBalancerType;
    if (data.healthCheckInterval !== undefined) updateData.health_check_interval = data.healthCheckInterval;
    if (data.healthCheckPath !== undefined) updateData.health_check_path = data.healthCheckPath;

    const [group] = await this.db('server_groups')
      .where({ id: groupId, organization_id: organizationId })
      .update(updateData)
      .returning('*');

    return group ? this.toDto(group) : null;
  }

  async delete(groupId: string, organizationId: string): Promise<boolean> {
    const result = await this.db('server_groups')
      .where({ id: groupId, organization_id: organizationId })
      .update({ deleted_at: this.db.fn.now() });

    return result > 0;
  }

  async addMember(groupId: string, organizationId: string, serverId: string, order: number = 0): Promise<ServerGroupMember> {
    const [member] = await this.db('server_group_members')
      .insert({
        group_id: groupId,
        server_id: serverId,
        order: order,
        organization_id: organizationId,
      })
      .returning('*');

    return this.memberToDto(member);
  }

  async removeMember(groupId: string, organizationId: string, serverId: string): Promise<boolean> {
    const result = await this.db('server_group_members')
      .where({ group_id: groupId, server_id: serverId, organization_id: organizationId })
      .update({ deleted_at: this.db.fn.now() });

    return result > 0;
  }

  async getMembers(groupId: string, organizationId: string): Promise<ServerGroupMember[]> {
    const members = await this.db('server_group_members')
      .where({ group_id: groupId, organization_id: organizationId, deleted_at: null })
      .orderBy('order');

    return members.map((m) => this.memberToDto(m));
  }

  async getMemberServers(groupId: string, organizationId: string) {
    return this.db('server_group_members')
      .join('servers', 'servers.id', 'server_group_members.server_id')
      .select('servers.*')
      .where({
        'server_group_members.group_id': groupId,
        'server_group_members.organization_id': organizationId,
        'server_group_members.deleted_at': null,
      })
      .orderBy('server_group_members.order');
  }

  private toDto(row: any): ServerGroup {
    return {
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      description: row.description,
      environment: row.environment,
      status: row.status,
      criticality: row.criticality,
      vipHostname: row.vip_hostname,
      vipAddress: row.vip_address,
      loadBalancerType: row.load_balancer_type,
      healthCheckInterval: row.health_check_interval,
      healthCheckPath: row.health_check_path,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    };
  }

  private memberToDto(row: any): ServerGroupMember {
    return {
      id: row.id,
      groupId: row.group_id,
      serverId: row.server_id,
      order: row.order,
      organizationId: row.organization_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    };
  }
}
