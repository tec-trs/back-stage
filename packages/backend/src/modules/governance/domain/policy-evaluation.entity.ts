export interface PolicyEvaluationRow {
  id: string;
  policy_id: string;
  entity_id: string;
  status: string;
  details: string | null;
  evaluated_at: Date;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
  policy_name?: string;
  entity_name?: string;
}

export class PolicyEvaluation {
  public readonly id: string;
  public readonly policyId: string;
  public readonly entityId: string;
  public readonly status: string;
  public readonly details: string | null;
  public readonly evaluatedAt: Date;
  public readonly metadata: Record<string, unknown>;
  public readonly policyName?: string;
  public readonly entityName?: string;

  public constructor(row: PolicyEvaluationRow) {
    this.id = row.id;
    this.policyId = row.policy_id;
    this.entityId = row.entity_id;
    this.status = row.status;
    this.details = row.details;
    this.evaluatedAt = row.evaluated_at;
    this.metadata = row.metadata;
    this.policyName = row.policy_name;
    this.entityName = row.entity_name;
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      policyId: this.policyId,
      entityId: this.entityId,
      status: this.status,
      details: this.details,
      evaluatedAt: this.evaluatedAt,
      metadata: this.metadata,
      policyName: this.policyName,
      entityName: this.entityName,
    };
  }
}
