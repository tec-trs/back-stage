export interface RelationshipRegistrationRow {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export class RelationshipRegistration {
  public readonly id: string;
  public readonly organizationId: string;
  public readonly name: string;
  public readonly description: string | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;
  public readonly relationshipCount: number;

  public constructor(row: RelationshipRegistrationRow, relationshipCount = 0) {
    this.id = row.id;
    this.organizationId = row.organization_id;
    this.name = row.name;
    this.description = row.description;
    this.createdAt = row.created_at;
    this.updatedAt = row.updated_at;
    this.relationshipCount = relationshipCount;
  }

  public toJSON() {
    return {
      id: this.id,
      organizationId: this.organizationId,
      name: this.name,
      description: this.description,
      relationshipCount: this.relationshipCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export interface RegisteredRelationshipRow {
  id: string;
  registration_id: string;
  source_type: string;
  source_id: string;
  source_label: string;
  target_type: string;
  target_id: string;
  target_label: string;
  relation_type: string;
  reason: string | null;
  created_at: Date;
}

export class RegisteredRelationship {
  public readonly id: string;
  public readonly registrationId: string;
  public readonly sourceType: string;
  public readonly sourceId: string;
  public readonly sourceLabel: string;
  public readonly targetType: string;
  public readonly targetId: string;
  public readonly targetLabel: string;
  public readonly relationType: string;
  public readonly reason: string | null;
  public readonly createdAt: Date;

  public constructor(row: RegisteredRelationshipRow) {
    this.id = row.id;
    this.registrationId = row.registration_id;
    this.sourceType = row.source_type;
    this.sourceId = row.source_id;
    this.sourceLabel = row.source_label;
    this.targetType = row.target_type;
    this.targetId = row.target_id;
    this.targetLabel = row.target_label;
    this.relationType = row.relation_type;
    this.reason = row.reason;
    this.createdAt = row.created_at;
  }

  public toJSON() {
    return {
      id: this.id,
      registrationId: this.registrationId,
      sourceType: this.sourceType,
      sourceId: this.sourceId,
      sourceLabel: this.sourceLabel,
      targetType: this.targetType,
      targetId: this.targetId,
      targetLabel: this.targetLabel,
      relationType: this.relationType,
      reason: this.reason,
      createdAt: this.createdAt,
    };
  }
}
