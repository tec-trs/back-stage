export type UserRole = 'admin' | 'maintainer' | 'viewer';

export interface UserRow {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  is_active: boolean;
  roles: string[];
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export class User {
  public readonly id: string;
  public readonly email: string;
  public readonly fullName: string;
  public readonly avatarUrl: string | null;
  public readonly isActive: boolean;
  public readonly roles: UserRole[];
  public readonly metadata: Record<string, unknown>;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  public constructor(row: UserRow) {
    this.id = row.id;
    this.email = row.email;
    this.fullName = row.full_name;
    this.avatarUrl = row.avatar_url;
    this.isActive = row.is_active;
    this.roles = row.roles as UserRole[];
    this.metadata = row.metadata;
    this.createdAt = row.created_at;
    this.updatedAt = row.updated_at;
  }

  public toJSON(): {
    id: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
    isActive: boolean;
    roles: UserRole[];
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      email: this.email,
      fullName: this.fullName,
      avatarUrl: this.avatarUrl,
      isActive: this.isActive,
      roles: this.roles,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
