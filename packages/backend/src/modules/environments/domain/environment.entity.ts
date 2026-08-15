export interface EnvironmentRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  color: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class Environment {
  public readonly id: string;
  public readonly slug: string;
  public readonly name: string;
  public readonly description: string | null;
  public readonly color: string;
  public readonly isActive: boolean;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  public constructor(row: EnvironmentRow) {
    this.id = row.id;
    this.slug = row.slug;
    this.name = row.name;
    this.description = row.description;
    this.color = row.color;
    this.isActive = row.is_active;
    this.createdAt = row.created_at;
    this.updatedAt = row.updated_at;
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      slug: this.slug,
      name: this.name,
      description: this.description,
      color: this.color,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
