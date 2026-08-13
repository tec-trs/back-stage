export interface PolicyExemptionRow {
  id: string;
  policy_id: string;
  entity_id: string;
  reason: string;
  requested_by_user_id: string | null;
  approved_by_user_id: string | null;
  status: string;
  expires_at: Date | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export class PolicyExemption {
  public readonly id: string;
  public readonly policyId: string;
  public readonly entityId: string;
  public readonly reason: string;
  public readonly requestedByUserId: string | null;
  public readonly approvedByUserId: string | null;
  public readonly status: string;
  public readonly expiresAt: Date | null;
  public readonly metadata: Record<string, unknown>;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  public constructor(row: PolicyExemptionRow) {
    this.id = row.id;
    this.policyId = row.policy_id;
    this.entityId = row.entity_id;
    this.reason = row.reason;
    this.requestedByUserId = row.requested_by_user_id;
    this.approvedByUserId = row.approved_by_user_id;
    this.status = row.status;
    this.expiresAt = row.expires_at;
    this.metadata = row.metadata;
    this.createdAt = row.created_at;
    this.updatedAt = row.updated_at;
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      policyId: this.policyId,
      entityId: this.entityId,
      reason: this.reason,
      requestedByUserId: this.requestedByUserId,
      approvedByUserId: this.approvedByUserId,
      status: this.status,
      expiresAt: this.expiresAt,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
