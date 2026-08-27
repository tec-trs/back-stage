import type { Knex } from 'knex';

interface NodePosition {
  id: string;
  node_id: string;
  x: number;
  y: number;
}

export class NodePositionRepository {
  constructor(private readonly db: Knex) {}

  async getPositions(): Promise<NodePosition[]> {
    return this.db('node_positions').select('*');
  }

  async getPosition(nodeId: string): Promise<NodePosition | undefined> {
    return this.db('node_positions').where({ node_id: nodeId }).first();
  }

  async savePosition(nodeId: string, x: number, y: number): Promise<NodePosition> {
    const result = await this.db('node_positions')
      .insert({ node_id: nodeId, x, y })
      .onConflict('node_id')
      .merge()
      .returning('*');

    return result[0];
  }

  async deletePosition(nodeId: string): Promise<void> {
    await this.db('node_positions').where({ node_id: nodeId }).delete();
  }

  async deleteAllPositions(): Promise<void> {
    await this.db('node_positions').del();
  }
}
