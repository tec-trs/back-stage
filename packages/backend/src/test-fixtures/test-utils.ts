import type { Knex } from 'knex';

export async function expectEdgeCount(
  db: Knex,
  count: number,
  filters?: { source_type?: string; relation_type?: string },
): Promise<void> {
  let query = db('resource_relationships');

  if (filters?.source_type) {
    query = query.where('source_type', filters.source_type);
  }

  if (filters?.relation_type) {
    query = query.where('relation_type', filters.relation_type);
  }

  const result = await query.count('id as count').first();
  const actualCount = result ? (result.count as number | string) : 0;
  const actualCountNumber = typeof actualCount === 'string' ? parseInt(actualCount, 10) : actualCount;

  if (actualCountNumber !== count) {
    throw new Error(`Expected ${count} edges, but found ${actualCountNumber}`);
  }
}

export async function getEdges(
  db: Knex,
  filters?: { source_id?: string; target_id?: string },
): Promise<
  Array<{
    id: string;
    source_type: string;
    source_id: string;
    target_type: string;
    target_id: string;
    relation_type: string;
    metadata: Record<string, unknown>;
  }>
> {
  let query = db('resource_relationships');

  if (filters?.source_id) {
    query = query.where('source_id', filters.source_id);
  }

  if (filters?.target_id) {
    query = query.where('target_id', filters.target_id);
  }

  return query.select('id', 'source_type', 'source_id', 'target_type', 'target_id', 'relation_type', 'metadata');
}
