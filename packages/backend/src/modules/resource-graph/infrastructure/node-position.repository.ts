import type { Database } from '../../../shared/database/database.js';

interface NodePosition {
  id: string;
  nodeId: string;
  x: number;
  y: number;
}

export class NodePositionRepository {
  constructor(private readonly database: Database) {}

  async getPositions(): Promise<NodePosition[]> {
    return this.database.db('node_positions').select('*');
  }

  async getPosition(nodeId: string): Promise<NodePosition | undefined> {
    return this.database.db('node_positions').where({ node_id: nodeId }).first();
  }

  async savePosition(nodeId: string, x: number, y: number): Promise<NodePosition> {
    const result = await this.database
      .db('node_positions')
      .insert({ node_id: nodeId, x, y })
      .onConflict('node_id')
      .merge()
      .returning('*');

    return result[0];
  }

  async deletePosition(nodeId: string): Promise<void> {
    await this.database.db('node_positions').where({ node_id: nodeId }).delete();
  }

  async deleteAllPositions(): Promise<void> {
    await this.database.db('node_positions').del();
  }
}
