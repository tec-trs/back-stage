import { NotFoundError, ValidationError } from '@back-stage/shared';
import type { Knex } from 'knex';

import type { CreateVIPDto, UpdateVIPDto, VIP } from '../domain/vip.types.js';
import { VIPRepository } from '../infrastructure/vip.repository.js';

export class VIPService {
  private repository: VIPRepository;

  public constructor(private readonly db: Knex) {
    this.repository = new VIPRepository(db);
  }

  async createVIP(organizationId: string, data: CreateVIPDto): Promise<VIP> {
    if (!data.hostname || data.hostname.trim().length === 0) {
      throw new ValidationError('Hostname do VIP é obrigatório');
    }

    return this.repository.create(organizationId, data);
  }

  async getVIP(vipId: string, organizationId: string): Promise<VIP> {
    const vip = await this.repository.findById(vipId, organizationId);
    if (!vip) {
      throw new NotFoundError('VIP', vipId);
    }
    return vip;
  }

  async listVIPs(organizationId: string): Promise<VIP[]> {
    return this.repository.findAll(organizationId);
  }

  async updateVIP(vipId: string, organizationId: string, data: UpdateVIPDto): Promise<VIP> {
    await this.getVIP(vipId, organizationId);

    const updated = await this.repository.update(vipId, organizationId, data);
    if (!updated) {
      throw new NotFoundError('VIP', vipId);
    }

    return updated;
  }

  async deleteVIP(vipId: string, organizationId: string): Promise<void> {
    await this.getVIP(vipId, organizationId);
    const deleted = await this.repository.delete(vipId, organizationId);

    if (!deleted) {
      throw new NotFoundError('VIP', vipId);
    }
  }

  async addServerToVIP(vipId: string, organizationId: string, serverId: string, order?: number): Promise<VIP> {
    await this.getVIP(vipId, organizationId);

    // Validar que servidor existe
    const server = await this.db('servers')
      .where({ id: serverId, organization_id: organizationId })
      .first();

    if (!server) {
      throw new NotFoundError('Servidor', serverId);
    }

    // Validar que servidor não já está no VIP
    const existingMember = await this.db('vip_servers')
      .where({ vip_id: vipId, server_id: serverId, deleted_at: null })
      .first();

    if (existingMember) {
      throw new ValidationError('Este servidor já está vinculado ao VIP');
    }

    // Adicionar servidor ao VIP
    const members = await this.repository.getMembers(vipId, organizationId);
    const nextOrder = order ?? (members.length > 0 ? Math.max(...members.map((m) => m.order)) + 1 : 0);

    await this.repository.addServer(vipId, organizationId, serverId, nextOrder);

    // Criar relacionamento no grafo: VIP depends_on server
    await this.createVIPRelationship(vipId, organizationId, serverId);

    return this.getVIP(vipId, organizationId);
  }

  async removeServerFromVIP(vipId: string, organizationId: string, serverId: string): Promise<VIP> {
    await this.getVIP(vipId, organizationId);

    const removed = await this.repository.removeServer(vipId, organizationId, serverId);
    if (!removed) {
      throw new ValidationError('Servidor não pertence a este VIP');
    }

    // Remover relacionamento no grafo
    await this.removeVIPRelationship(vipId, organizationId, serverId);

    return this.getVIP(vipId, organizationId);
  }

  async getVIPServers(vipId: string, organizationId: string) {
    await this.getVIP(vipId, organizationId);
    return this.repository.getServers(vipId, organizationId);
  }

  private async createVIPRelationship(vipId: string, organizationId: string, serverId: string): Promise<void> {
    try {
      await this.db('resource_relationships').insert({
        source_type: 'vip',
        source_id: vipId,
        target_type: 'server',
        target_id: serverId,
        relation_type: 'depends_on',
        organization_id: organizationId,
        metadata: { type: 'vip_server_dependency' },
      });
    } catch {
      // Relacionamento já existe ou falha por constraint - ignorar silenciosamente
    }
  }

  private async removeVIPRelationship(vipId: string, organizationId: string, serverId: string): Promise<void> {
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
