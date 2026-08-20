import type { ICatalogEntityRelationRepository } from '../infrastructure/catalog-entity-relation.repository.js';

export interface CreateRelationDto {
  sourceEntityId: string;
  targetEntityId: string;
  relationType: 'dependsOn' | 'dependencyOf' | 'partOf' | 'hasPart' | 'providesApi' | 'consumesApi';
  metadata?: Record<string, unknown>;
}

export interface CatalogEntityRelationDto {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationType: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class CatalogEntityRelationService {
  public constructor(private readonly relationRepository: ICatalogEntityRelationRepository) {}

  public async create(dto: CreateRelationDto): Promise<CatalogEntityRelationDto> {
    return this.relationRepository.create(dto);
  }

  public async deleteRelation(
    sourceEntityId: string,
    targetEntityId: string,
    relationType: string,
  ): Promise<void> {
    return this.relationRepository.delete(sourceEntityId, targetEntityId, relationType);
  }

  public async getRelationsBySource(sourceEntityId: string): Promise<CatalogEntityRelationDto[]> {
    return this.relationRepository.findBySource(sourceEntityId);
  }

  public async getRelationsByTarget(targetEntityId: string): Promise<CatalogEntityRelationDto[]> {
    return this.relationRepository.findByTarget(targetEntityId);
  }
}
