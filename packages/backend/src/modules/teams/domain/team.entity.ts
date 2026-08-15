export type TeamRole = 'owner' | 'member';

export interface TeamRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface TeamMemberRow {
  team_id: string;
  user_id: string;
  full_name: string;
  email: string;
  code: string;
  is_active: boolean;
  role: TeamRole;
}

export class TeamMember {
  readonly userId: string;
  readonly fullName: string;
  readonly email: string;
  readonly code: string;
  readonly isActive: boolean;
  readonly role: TeamRole;

  constructor(row: TeamMemberRow) {
    this.userId = row.user_id;
    this.fullName = row.full_name;
    this.email = row.email;
    this.code = row.code;
    this.isActive = row.is_active;
    this.role = row.role;
  }

  toJSON() {
    return {
      userId: this.userId,
      fullName: this.fullName,
      email: this.email,
      code: this.code,
      isActive: this.isActive,
      role: this.role,
    };
  }
}

export class Team {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
  readonly members: TeamMember[];
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(row: TeamRow, memberRows: TeamMemberRow[] = []) {
    this.id = row.id;
    this.name = row.name;
    this.slug = row.slug;
    this.description = row.description;
    this.members = memberRows.map((m) => new TeamMember(m));
    this.createdAt = row.created_at;
    this.updatedAt = row.updated_at;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      description: this.description,
      memberCount: this.members.length,
      members: this.members.map((m) => m.toJSON()),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
