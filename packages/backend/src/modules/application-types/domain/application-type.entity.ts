export interface ApplicationTypeRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class ApplicationType {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string | null;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(row: ApplicationTypeRow) {
    this.id = row.id;
    this.slug = row.slug;
    this.name = row.name;
    this.description = row.description;
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
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
