import { NotFoundError, ValidationError } from '@back-stage/shared';
import type { Knex } from 'knex';

import type {
  CreateRelationshipMapDto,
  RelationshipMap,
  RelationshipMapDetail,
  UpdateRelationshipMapDto,
} from '../domain/relationship-map.types.js';
import { RelationshipMapRepository } from '../infrastructure/relationship-map.repository.js';

// Postgres unique_violation error code.
const PG_UNIQUE_VIOLATION = '23505';

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === PG_UNIQUE_VIOLATION;
}

export class RelationshipMapService {
  private repository: RelationshipMapRepository;

  public constructor(private readonly db: Knex) {
    this.repository = new RelationshipMapRepository(db);
  }

  async listMaps(organizationId: string): Promise<RelationshipMap[]> {
    return this.repository.findAll(organizationId);
  }

  async createMap(organizationId: string, userId: string | null, data: CreateRelationshipMapDto): Promise<RelationshipMap> {
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('Nome do mapa é obrigatório');
    }

    try {
      return await this.repository.create(organizationId, userId, { ...data, name: data.name.trim() });
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ValidationError(`Já existe um mapa chamado "${data.name.trim()}"`);
      }
      throw err;
    }
  }

  async getMap(mapId: string, organizationId: string): Promise<RelationshipMap> {
    const map = await this.repository.findById(mapId, organizationId);
    if (!map) {
      throw new NotFoundError('Mapa de relacionamentos', mapId);
    }
    return map;
  }

  async getMapDetail(mapId: string, organizationId: string): Promise<RelationshipMapDetail> {
    const map = await this.getMap(mapId, organizationId);
    const detail = await this.repository.getDetail(mapId, organizationId);
    if (!detail) {
      throw new NotFoundError('Mapa de relacionamentos', mapId);
    }
    return { ...map, ...detail };
  }

  async updateMap(mapId: string, organizationId: string, data: UpdateRelationshipMapDto): Promise<RelationshipMap> {
    await this.getMap(mapId, organizationId);

    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new ValidationError('Nome do mapa é obrigatório');
    }

    try {
      const updated = await this.repository.update(mapId, organizationId, {
        ...data,
        name: data.name !== undefined ? data.name.trim() : undefined,
      });
      if (!updated) {
        throw new NotFoundError('Mapa de relacionamentos', mapId);
      }
      return updated;
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ValidationError(`Já existe um mapa chamado "${data.name?.trim()}"`);
      }
      throw err;
    }
  }

  async deleteMap(mapId: string, organizationId: string): Promise<void> {
    await this.getMap(mapId, organizationId);
    const deleted = await this.repository.delete(mapId, organizationId);
    if (!deleted) {
      throw new NotFoundError('Mapa de relacionamentos', mapId);
    }
  }

  async attachRelationship(mapId: string, organizationId: string, relationshipId: string): Promise<RelationshipMapDetail> {
    await this.getMap(mapId, organizationId);

    const relationship = await this.db('resource_relationships')
      .where({ id: relationshipId, organization_id: organizationId, deleted_at: null })
      .first('id');
    if (!relationship) {
      throw new NotFoundError('Relacionamento', relationshipId);
    }

    const alreadyMember = await this.repository.findActiveMember(mapId, relationshipId);
    if (alreadyMember) {
      throw new ValidationError('Este relacionamento já está neste mapa');
    }

    try {
      await this.repository.addMember(mapId, organizationId, relationshipId);
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ValidationError('Este relacionamento já está neste mapa');
      }
      throw err;
    }

    return this.getMapDetail(mapId, organizationId);
  }

  async detachRelationship(mapId: string, organizationId: string, relationshipId: string): Promise<RelationshipMapDetail> {
    await this.getMap(mapId, organizationId);

    const removed = await this.repository.removeMember(mapId, organizationId, relationshipId);
    if (!removed) {
      throw new ValidationError('Este relacionamento não está neste mapa');
    }

    return this.getMapDetail(mapId, organizationId);
  }
}
