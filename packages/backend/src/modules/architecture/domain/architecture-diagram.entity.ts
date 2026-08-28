export interface ArchitectureDiagramNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    resourceType: string;
    description?: string;
    resourceId?: string;
  };
}

export interface ArchitectureDiagramEdge {
  id: string;
  source: string;
  target: string;
}

export interface ArchitectureDiagram {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  nodes: ArchitectureDiagramNode[];
  edges: ArchitectureDiagramEdge[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ArchitectureDiagramEntity implements ArchitectureDiagram {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  nodes: ArchitectureDiagramNode[];
  edges: ArchitectureDiagramEdge[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(diagram: ArchitectureDiagram) {
    this.id = diagram.id;
    this.name = diagram.name;
    this.description = diagram.description;
    this.organizationId = diagram.organizationId;
    this.nodes = diagram.nodes;
    this.edges = diagram.edges;
    this.createdBy = diagram.createdBy;
    this.createdAt = diagram.createdAt;
    this.updatedAt = diagram.updatedAt;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      organizationId: this.organizationId,
      nodes: this.nodes,
      edges: this.edges,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
