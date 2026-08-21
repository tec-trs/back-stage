import type { Knex } from 'knex';

import type { CreateVIPDto, UpdateVIPDto, VIP, VIPServer } from '../domain/vip.types.js';

export class VIPRepository {
  public constructor(private readonly db: Knex) {}

  async create(organizationId: string, data: CreateVIPDto): Promise<VIP> {
    const [vip] = await this.db('vips')
      .insert({
        organization_id: organizationId,
        hostname: data.hostname,
        display_name: data.displayName || null,
        description: data.description || null,
        vip_address: data.vipAddress || null,
        load_balancer_type: data.loadBalancerType || null,
        health_check_interval: data.healthCheckInterval || 30,
        health_check_path: data.healthCheckPath || null,
        status: data.status || 'active',
        environment: data.environment || null,
        criticality: data.criticality || null,
        owner_team: data.ownerTeam || null,
        owner_user_id: data.ownerUserId || null,
        cost_center: data.costCenter || null,
      })
      .returning('*');

    return this.toDto(vip);
  }

  async findById(vipId: string, organizationId: string): Promise<VIP | null> {
    const vip = await this.db('vips')
      .where({ id: vipId, organization_id: organizationId, deleted_at: null })
      .first();

    return vip ? this.toDto(vip) : null;
  }

  async findAll(organizationId: string): Promise<VIP[]> {
    const vips = await this.db('vips')
      .where({ organization_id: organizationId, deleted_at: null })
      .orderBy('hostname');

    return vips.map((v) => this.toDto(v));
  }

  async update(vipId: string, organizationId: string, data: UpdateVIPDto): Promise<VIP | null> {
    const updateData: Record<string, unknown> = {};
    if (data.hostname !== undefined) updateData.hostname = data.hostname;
    if (data.displayName !== undefined) updateData.display_name = data.displayName;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.vipAddress !== undefined) updateData.vip_address = data.vipAddress;
    if (data.loadBalancerType !== undefined) updateData.load_balancer_type = data.loadBalancerType;
    if (data.healthCheckInterval !== undefined) updateData.health_check_interval = data.healthCheckInterval;
    if (data.healthCheckPath !== undefined) updateData.health_check_path = data.healthCheckPath;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.environment !== undefined) updateData.environment = data.environment;
    if (data.criticality !== undefined) updateData.criticality = data.criticality;
    if (data.ownerTeam !== undefined) updateData.owner_team = data.ownerTeam;
    if (data.ownerUserId !== undefined) updateData.owner_user_id = data.ownerUserId;
    if (data.costCenter !== undefined) updateData.cost_center = data.costCenter;

    const [vip] = await this.db('vips')
      .where({ id: vipId, organization_id: organizationId })
      .update(updateData)
      .returning('*');

    return vip ? this.toDto(vip) : null;
  }

  async delete(vipId: string, organizationId: string): Promise<boolean> {
    const result = await this.db('vips')
      .where({ id: vipId, organization_id: organizationId })
      .update({ deleted_at: this.db.fn.now() });

    return result > 0;
  }

  async addServer(vipId: string, organizationId: string, serverId: string, order: number = 0): Promise<VIPServer> {
    const [member] = await this.db('vip_servers')
      .insert({
        vip_id: vipId,
        server_id: serverId,
        order: order,
        organization_id: organizationId,
      })
      .returning('*');

    return this.memberToDto(member);
  }

  async removeServer(vipId: string, organizationId: string, serverId: string): Promise<boolean> {
    const result = await this.db('vip_servers')
      .where({ vip_id: vipId, server_id: serverId, organization_id: organizationId })
      .update({ deleted_at: this.db.fn.now() });

    return result > 0;
  }

  async getServers(vipId: string, organizationId: string) {
    return this.db('vip_servers')
      .join('servers', 'servers.id', 'vip_servers.server_id')
      .select('servers.*')
      .where({
        'vip_servers.vip_id': vipId,
        'vip_servers.organization_id': organizationId,
        'vip_servers.deleted_at': null,
      })
      .orderBy('vip_servers.order');
  }

  async getMembers(vipId: string, organizationId: string): Promise<VIPServer[]> {
    const members = await this.db('vip_servers')
      .where({ vip_id: vipId, organization_id: organizationId, deleted_at: null })
      .orderBy('order');

    return members.map((m) => this.memberToDto(m));
  }

  private toDto(row: any): VIP {
    return {
      id: row.id,
      organizationId: row.organization_id,
      hostname: row.hostname,
      displayName: row.display_name,
      description: row.description,
      vipAddress: row.vip_address,
      loadBalancerType: row.load_balancer_type,
      healthCheckInterval: row.health_check_interval,
      healthCheckPath: row.health_check_path,
      status: row.status,
      environment: row.environment,
      criticality: row.criticality,
      ownerTeam: row.owner_team,
      ownerUserId: row.owner_user_id,
      costCenter: row.cost_center,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    };
  }

  private memberToDto(row: any): VIPServer {
    return {
      id: row.id,
      vipId: row.vip_id,
      serverId: row.server_id,
      order: row.order,
      organizationId: row.organization_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    };
  }
}
