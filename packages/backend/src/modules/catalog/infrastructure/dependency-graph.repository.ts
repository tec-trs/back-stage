import type { Knex } from 'knex';

export interface GraphNode {
  id: string;
  kind: string;
  type: string;
  name: string;
  title: string | null;
  lifecycle: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationType: string;
}

export interface DependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface CatalogEntityRelationRow {
  id: string;
  source_entity_id: string;
  target_entity_id: string;
  relation_type: string;
}

export interface IDependencyGraphRepository {
  getGraph(): Promise<DependencyGraph>;
}

export class DependencyGraphRepository implements IDependencyGraphRepository {
  public constructor(private readonly db: Knex) {}

  public async getGraph(): Promise<DependencyGraph> {
    const [nodeRows, edgeRows] = await Promise.all([
      this.db('catalog_entities')
        .whereNull('deleted_at')
        .select('id', 'kind', 'type', 'name', 'title', 'lifecycle'),
      this.db('catalog_entity_relations')
        .whereNull('deleted_at')
        .select('id', 'source_entity_id', 'target_entity_id', 'relation_type'),
    ]);

    return {
      nodes: nodeRows as GraphNode[],
      edges: (edgeRows as CatalogEntityRelationRow[]).map((row) => ({
        id: row.id,
        source: row.source_entity_id,
        target: row.target_entity_id,
        relationType: row.relation_type,
      })),
    };
  }
}
