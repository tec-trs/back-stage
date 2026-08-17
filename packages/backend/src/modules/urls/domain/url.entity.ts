export type UrlType = 'public' | 'internal' | 'api' | 'webhook' | 'admin_panel' | 'documentation';

export type UrlStatus = 'active' | 'inactive' | 'deprecated' | 'error';

export type OwnerResourceType = 'server' | 'application' | 'database';

export interface UrlRow {
  id: string;
  label: string;
  url: string;
  url_type: string;
  description: string | null;
  owner_resource_type: string;
  owner_resource_id: string;
  method: string | null;
  auth_required: boolean;
  auth_method: string | null;
  status: string;
  healthcheck_enabled: boolean;
  last_check_status: string | null;
  last_checked_at: Date | null;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export class Url {
  public readonly id: string;
  public readonly label: string;
  public readonly url: string;
  public readonly urlType: UrlType;
  public readonly description: string | null;
  public readonly ownerResourceType: OwnerResourceType;
  public readonly ownerResourceId: string;
  public readonly method: string | null;
  public readonly authRequired: boolean;
  public readonly authMethod: string | null;
  public readonly status: UrlStatus;
  public readonly healthcheckEnabled: boolean;
  public readonly lastCheckStatus: string | null;
  public readonly lastCheckedAt: Date | null;
  public readonly tags: string[];
  public readonly metadata: Record<string, unknown>;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  public constructor(row: UrlRow) {
    this.id = row.id;
    this.label = row.label;
    this.url = row.url;
    this.urlType = row.url_type as UrlType;
    this.description = row.description;
    this.ownerResourceType = row.owner_resource_type as OwnerResourceType;
    this.ownerResourceId = row.owner_resource_id;
    this.method = row.method;
    this.authRequired = row.auth_required;
    this.authMethod = row.auth_method;
    this.status = row.status as UrlStatus;
    this.healthcheckEnabled = row.healthcheck_enabled;
    this.lastCheckStatus = row.last_check_status;
    this.lastCheckedAt = row.last_checked_at;
    this.tags = row.tags;
    this.metadata = row.metadata;
    this.createdAt = row.created_at;
    this.updatedAt = row.updated_at;
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      label: this.label,
      url: this.url,
      urlType: this.urlType,
      description: this.description,
      ownerResourceType: this.ownerResourceType,
      ownerResourceId: this.ownerResourceId,
      method: this.method,
      authRequired: this.authRequired,
      authMethod: this.authMethod,
      status: this.status,
      healthcheckEnabled: this.healthcheckEnabled,
      lastCheckStatus: this.lastCheckStatus,
      lastCheckedAt: this.lastCheckedAt,
      tags: this.tags,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
