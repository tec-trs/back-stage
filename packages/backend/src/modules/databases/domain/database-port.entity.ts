export interface DatabasePortRow {
  id: string;
  organization_id: string;
  database_id: string;
  port: number;
  parameters: string | null;
  created_at: Date;
  updated_at: Date;
}

export class DatabasePort {
  public readonly id: string;
  public readonly organizationId: string;
  public readonly databaseId: string;
  public readonly port: number;
  public readonly parameters: string | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  public constructor(row: DatabasePortRow) {
    this.id = row.id;
    this.organizationId = row.organization_id;
    this.databaseId = row.database_id;
    this.port = row.port;
    this.parameters = row.parameters;
    this.createdAt = row.created_at;
    this.updatedAt = row.updated_at;
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      databaseId: this.databaseId,
      port: this.port,
      parameters: this.parameters,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
