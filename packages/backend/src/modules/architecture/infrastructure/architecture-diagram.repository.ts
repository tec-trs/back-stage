import type { Knex } from 'knex';
import { ArchitectureDiagramEntity } from '../domain/architecture-diagram.entity.js';
import type { ArchitectureDiagram } from '../domain/architecture-diagram.entity.js';

export interface IArchitectureDiagramRepository {
  findAll(organizationId: string): Promise<ArchitectureDiagramEntity[]>;
  findById(id: string): Promise<ArchitectureDiagramEntity | null>;
  create(diagram: ArchitectureDiagram): Promise<ArchitectureDiagramEntity>;
  update(id: string, diagram: Partial<ArchitectureDiagram>): Promise<ArchitectureDiagramEntity>;
  delete(id: string): Promise<void>;
}

export class ArchitectureDiagramRepository implements IArchitectureDiagramRepository {
  constructor(private db: Knex) {}

  async findAll(organizationId: string): Promise<ArchitectureDiagramEntity[]> {
    const rows = await this.db('architecture_diagrams')
      .where({ organization_id: organizationId })
      .orderBy('created_at', 'desc');

    return rows.map((row) => this.mapToDomain(row));
  }

  async findById(id: string): Promise<ArchitectureDiagramEntity | null> {
    const row = await this.db('architecture_diagrams').where({ id }).first();
    if (!row) return null;
    return this.mapToDomain(row);
  }

  async create(diagram: ArchitectureDiagram): Promise<ArchitectureDiagramEntity> {
    const now = new Date();
    await this.db('architecture_diagrams').insert({
      id: diagram.id,
      name: diagram.name,
      description: diagram.description,
      organization_id: diagram.organizationId,
      nodes: JSON.stringify(diagram.nodes),
      edges: JSON.stringify(diagram.edges),
      created_by: diagram.createdBy,
      created_at: now,
      updated_at: now,
    });

    return new ArchitectureDiagramEntity({
      ...diagram,
      createdAt: now,
      updatedAt: now,
    });
  }

  async update(id: string, diagram: Partial<ArchitectureDiagram>): Promise<ArchitectureDiagramEntity> {
    const now = new Date();
    const updateData: Record<string, unknown> = { updated_at: now };

    if (diagram.name !== undefined) updateData.name = diagram.name;
    if (diagram.description !== undefined) updateData.description = diagram.description;
    if (diagram.nodes !== undefined) updateData.nodes = JSON.stringify(diagram.nodes);
    if (diagram.edges !== undefined) updateData.edges = JSON.stringify(diagram.edges);

    await this.db('architecture_diagrams').where({ id }).update(updateData);

    const updated = await this.findById(id);
    if (!updated) throw new Error('Failed to update diagram');
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.db('architecture_diagrams').where({ id }).delete();
  }

  private mapToDomain(row: Record<string, unknown>): ArchitectureDiagramEntity {
    const nodes = typeof row.nodes === 'string' ? JSON.parse(row.nodes) : row.nodes;
    const edges = typeof row.edges === 'string' ? JSON.parse(row.edges) : row.edges;

    return new ArchitectureDiagramEntity({
      id: row.id as string,
      name: row.name as string,
      description: row.description as string | undefined,
      organizationId: row.organization_id as string,
      nodes: nodes as any,
      edges: edges as any,
      createdBy: row.created_by as string,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    });
  }
}
