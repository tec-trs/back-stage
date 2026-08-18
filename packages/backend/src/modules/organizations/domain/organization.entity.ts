export interface OrganizationRow {
  id: string;
  slug: string;
  name: string;
  plan: string;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export class Organization {
  public readonly id: string;
  public readonly slug: string;
  public readonly name: string;
  public readonly plan: string;
  public readonly metadata: Record<string, unknown>;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date | null;

  public constructor(row: OrganizationRow) {
    this.id = row.id;
    this.slug = row.slug;
    this.name = row.name;
    this.plan = row.plan;
    this.metadata = row.metadata ?? {};
    this.createdAt = row.created_at;
    this.updatedAt = row.updated_at;
    this.deletedAt = row.deleted_at;
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      slug: this.slug,
      name: this.name,
      plan: this.plan,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
