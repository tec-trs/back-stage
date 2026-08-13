export interface PolicyRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  policy_type: string;
  definition: string;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export class Policy {
  public readonly id: string;
  public readonly name: string;
  public readonly slug: string;
  public readonly description: string | null;
  public readonly policyType: string;
  public readonly definition: string;
  public readonly isActive: boolean;
  public readonly metadata: Record<string, unknown>;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  public constructor(row: PolicyRow) {
    this.id = row.id;
    this.name = row.name;
    this.slug = row.slug;
    this.description = row.description;
    this.policyType = row.policy_type;
    this.definition = row.definition;
    this.isActive = row.is_active;
    this.metadata = row.metadata;
    this.createdAt = row.created_at;
    this.updatedAt = row.updated_at;
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      description: this.description,
      policyType: this.policyType,
      definition: this.definition,
      isActive: this.isActive,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
