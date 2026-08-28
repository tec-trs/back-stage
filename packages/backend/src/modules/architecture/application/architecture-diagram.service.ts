import { randomUUID } from 'crypto';
import type { IArchitectureDiagramRepository } from '../infrastructure/architecture-diagram.repository.js';
import { ArchitectureDiagramEntity } from '../domain/architecture-diagram.entity.js';
import type { ArchitectureDiagram, ArchitectureDiagramNode, ArchitectureDiagramEdge } from '../domain/architecture-diagram.entity.js';

export interface CreateArchitectureDiagramInput {
  name: string;
  description?: string;
  organizationId: string;
  nodes?: ArchitectureDiagramNode[];
  edges?: ArchitectureDiagramEdge[];
}

export interface UpdateArchitectureDiagramInput {
  name?: string;
  description?: string;
  nodes?: ArchitectureDiagramNode[];
  edges?: ArchitectureDiagramEdge[];
}

export class ArchitectureDiagramService {
  constructor(private repository: IArchitectureDiagramRepository) {}

  async findAll(organizationId: string): Promise<ArchitectureDiagramEntity[]> {
    return this.repository.findAll(organizationId);
  }

  async getById(id: string): Promise<ArchitectureDiagramEntity> {
    const diagram = await this.repository.findById(id);
    if (!diagram) {
      throw new Error('Diagram not found');
    }
    return diagram;
  }

  async create(input: CreateArchitectureDiagramInput, userId: string): Promise<ArchitectureDiagramEntity> {
    const diagram: ArchitectureDiagram = {
      id: randomUUID(),
      name: input.name,
      description: input.description,
      organizationId: input.organizationId,
      nodes: input.nodes || [],
      edges: input.edges || [],
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.repository.create(diagram);
  }

  async update(
    id: string,
    input: UpdateArchitectureDiagramInput
  ): Promise<ArchitectureDiagramEntity> {
    const existing = await this.getById(id);

    const updateData: Partial<ArchitectureDiagram> = {
      name: input.name || existing.name,
      description: input.description ?? existing.description,
      nodes: input.nodes || existing.nodes,
      edges: input.edges || existing.edges,
    };

    return this.repository.update(id, updateData);
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    await this.repository.delete(id);
  }
}
