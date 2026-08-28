export interface DatabaseEngineRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  default_port: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class DatabaseEngine {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string | null;
  readonly defaultPort: number | null;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(row: DatabaseEngineRow) {
    this.id = row.id;
    this.slug = row.slug;
    this.name = row.name;
    this.description = row.description;
    this.defaultPort = row.default_port;
    this.isActive = row.is_active;
    this.createdAt = row.created_at;
    this.updatedAt = row.updated_at;
  }

  toJSON() {
    return {
      id: this.id,
      slug: this.slug,
      name: this.name,
      description: this.description,
      defaultPort: this.defaultPort,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
