import type { Knex } from 'knex';

export interface ICatalogEntityLookup {
  findByRepositoryUrl(repositoryUrl: string): Promise<{ id: string } | undefined>;
}

export class CatalogEntityLookupRepository implements ICatalogEntityLookup {
  public constructor(private readonly db: Knex) {}

  public async findByRepositoryUrl(repositoryUrl: string): Promise<{ id: string } | undefined> {
    const row = await this.db('catalog_entities')
      .whereNull('deleted_at')
      .where('repository_url', repositoryUrl)
      .select('id')
      .first();
    return row as { id: string } | undefined;
  }
}
