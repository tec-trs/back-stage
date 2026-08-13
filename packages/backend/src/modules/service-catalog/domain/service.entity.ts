export type ServiceLifecycle = 'experimental' | 'production' | 'deprecated';

export interface ServiceRow {
  id: string;
  type: string;
  name: string;
  namespace: string;
  title: string | null;
  description: string | null;
  lifecycle: string;
  owner_team_id: string | null;
  system_id: string | null;
  repository_url: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export class Service {
  public readonly id: string;
  public readonly type: string;
  public readonly name: string;
  public readonly namespace: string;
  public readonly title: string | null;
  public readonly description: string | null;
  public readonly lifecycle: ServiceLifecycle;
  public readonly ownerTeamId: string | null;
  public readonly systemId: string | null;
  public readonly repositoryUrl: string | null;
  public readonly metadata: Record<string, unknown>;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  public constructor(row: ServiceRow) {
    this.id = row.id;
    this.type = row.type;
    this.name = row.name;
    this.namespace = row.namespace;
    this.title = row.title;
    this.description = row.description;
    this.lifecycle = row.lifecycle as ServiceLifecycle;
    this.ownerTeamId = row.owner_team_id;
    this.systemId = row.system_id;
    this.repositoryUrl = row.repository_url;
    this.metadata = row.metadata;
    this.createdAt = row.created_at;
    this.updatedAt = row.updated_at;
  }

  public toJSON(): {
    id: string;
    type: string;
    name: string;
    namespace: string;
    title: string | null;
    description: string | null;
    lifecycle: ServiceLifecycle;
    ownerTeamId: string | null;
    systemId: string | null;
    repositoryUrl: string | null;
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      namespace: this.namespace,
      title: this.title,
      description: this.description,
      lifecycle: this.lifecycle,
      ownerTeamId: this.ownerTeamId,
      systemId: this.systemId,
      repositoryUrl: this.repositoryUrl,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
