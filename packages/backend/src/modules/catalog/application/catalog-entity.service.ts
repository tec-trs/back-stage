import { NotFoundError } from '@back-stage/shared';

import type {
  CatalogEntityFilters,
  CatalogEntityRow,
  ICatalogEntityRepository,
  Pagination,
} from '../infrastructure/catalog-entity.repository.js';

export interface CatalogEntityDto {
  id: string;
  kind: string;
  type: string;
  name: string;
  namespace: string;
  title: string | null;
  description: string | null;
  lifecycle: string;
  ownerTeamId: string | null;
  systemId: string | null;
  repositoryUrl: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListCatalogEntitiesResult {
  items: CatalogEntityDto[];
  pagination: { page: number; pageSize: number; total: number };
}

function toDto(row: CatalogEntityRow): CatalogEntityDto {
  return {
    id: row.id,
    kind: row.kind,
    type: row.type,
    name: row.name,
    namespace: row.namespace,
    title: row.title,
    description: row.description,
    lifecycle: row.lifecycle,
    ownerTeamId: row.owner_team_id,
    systemId: row.system_id,
    repositoryUrl: row.repository_url,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class CatalogEntityService {
  public constructor(private readonly catalogEntityRepository: ICatalogEntityRepository) {}

  public async list(
    filters: CatalogEntityFilters,
    pagination: Pagination,
  ): Promise<ListCatalogEntitiesResult> {
    const { items, total } = await this.catalogEntityRepository.findMany(filters, pagination);
    return { items: items.map(toDto), pagination: { ...pagination, total } };
  }

  public async getById(id: string): Promise<CatalogEntityDto> {
    const entity = await this.catalogEntityRepository.findById(id);
    if (!entity) {
      throw new NotFoundError('CatalogEntity', id);
    }
    return toDto(entity);
  }
}
