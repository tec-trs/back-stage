import type { Knex } from 'knex';

import type { CatalogEntityRelationDto, CreateRelationDto } from '../application/catalog-entity-relation.service.js';

const TABLE_NAME = 'catalog_entity_relations';

export interface ICatalogEntityRelationRepository {
  create(dto: CreateRelationDto): Promise<CatalogEntityRelationDto>;
  delete(sourceEntityId: string, targetEntityId: string, relationType: string): Promise<void>;
  findBySource(sourceEntityId: string): Promise<CatalogEntityRelationDto[]>;
  findByTarget(targetEntityId: string): Promise<CatalogEntityRelationDto[]>;
}

interface CatalogEntityRelationRow {
  id: string;
  source_entity_id: string;
  target_entity_id: string;
  relation_type: string;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

function toDto(row: CatalogEntityRelationRow): CatalogEntityRelationDto {
  return {
    id: row.id,
    sourceEntityId: row.source_entity_id,
    targetEntityId: row.target_entity_id,
    relationType: row.relation_type,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class CatalogEntityRelationRepository implements ICatalogEntityRelationRepository {
  public constructor(private readonly db: Knex) {}

  public async create(dto: CreateRelationDto): Promise<CatalogEntityRelationDto> {
    const now = new Date();
    const [row] = await this.db(TABLE_NAME)
      .insert({
        source_entity_id: dto.sourceEntityId,
        target_entity_id: dto.targetEntityId,
        relation_type: dto.relationType,
        metadata: dto.metadata || {},
        created_at: now,
        updated_at: now,
      })
      .returning('*');

    return toDto(row as CatalogEntityRelationRow);
  }

  public async delete(
    sourceEntityId: string,
    targetEntityId: string,
    relationType: string,
  ): Promise<void> {
    await this.db(TABLE_NAME)
      .where({
        source_entity_id: sourceEntityId,
        target_entity_id: targetEntityId,
        relation_type: relationType,
      })
      .del();
  }

  public async findBySource(sourceEntityId: string): Promise<CatalogEntityRelationDto[]> {
    const rows = await this.db(TABLE_NAME)
      .where({ source_entity_id: sourceEntityId })
      .orderBy('created_at', 'asc');

    return (rows as CatalogEntityRelationRow[]).map(toDto);
  }

  public async findByTarget(targetEntityId: string): Promise<CatalogEntityRelationDto[]> {
    const rows = await this.db(TABLE_NAME)
      .where({ target_entity_id: targetEntityId })
      .orderBy('created_at', 'asc');

    return (rows as CatalogEntityRelationRow[]).map(toDto);
  }
}
