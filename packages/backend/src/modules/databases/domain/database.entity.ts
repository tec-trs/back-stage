export type DatabaseEngine =
  | 'postgres'
  | 'mysql'
  | 'mariadb'
  | 'mongodb'
  | 'redis'
  | 'oracle'
  | 'sqlserver'
  | 'elasticsearch'
  | 'cassandra'
  | 'dynamodb'
  | 'other';

export type Criticality = 'critical' | 'high' | 'medium' | 'low';

export type DatabaseStatus = 'active' | 'maintenance' | 'provisioning' | 'deactivated' | 'deprecated';

export interface DatabaseRow {
  id: string;
  code: string;
  name: string;
  display_name: string | null;
  description: string | null;
  physical_name: string | null;
  logical_name: string | null;
  path: string | null;
  engine: string;
  version: string | null;
  port: number | null;
  hosted_on_server_id: string | null;
  connection_host: string | null;
  connection_string_template: string | null;
  is_managed_service: boolean;
  data_classification: string | null;
  criticality: string;
  owner_team: string | null;
  owner_user_id: string | null;
  cost_center: string | null;
  storage_gb: number | null;
  replication_mode: string | null;
  has_backup: boolean;
  backup_policy: string | null;
  last_backup_at: Date | null;
  status: string;
  environment: string;
  monitoring_url: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export class Database {
  public readonly id: string;
  public readonly code: string;
  public readonly name: string;
  public readonly displayName: string | null;
  public readonly description: string | null;
  public readonly physicalName: string | null;
  public readonly logicalName: string | null;
  public readonly path: string | null;
  public readonly engine: DatabaseEngine;
  public readonly version: string | null;
  public readonly port: number | null;
  public readonly hostedOnServerId: string | null;
  public readonly hostedOnServerHostname: string | null;
  public readonly connectionHost: string | null;
  public readonly connectionStringTemplate: string | null;
  public readonly isManagedService: boolean;
  public readonly dataClassification: string | null;
  public readonly criticality: Criticality;
  public readonly ownerTeam: string | null;
  public readonly ownerUserId: string | null;
  public readonly costCenter: string | null;
  public readonly storageGb: number | null;
  public readonly replicationMode: string | null;
  public readonly hasBackup: boolean;
  public readonly backupPolicy: string | null;
  public readonly lastBackupAt: Date | null;
  public readonly status: DatabaseStatus;
  public readonly environment: string;
  public readonly monitoringUrl: string | null;
  public readonly tags: string[];
  public readonly metadata: Record<string, unknown>;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  public constructor(row: DatabaseRow, hostedOnServerHostname: string | null = null) {
    this.id = row.id;
    this.code = row.code;
    this.name = row.name;
    this.displayName = row.display_name;
    this.description = row.description;
    this.physicalName = row.physical_name;
    this.logicalName = row.logical_name;
    this.path = row.path;
    this.engine = row.engine as DatabaseEngine;
    this.version = row.version;
    this.port = row.port;
    this.hostedOnServerId = row.hosted_on_server_id;
    this.hostedOnServerHostname = hostedOnServerHostname;
    this.connectionHost = row.connection_host;
    this.connectionStringTemplate = row.connection_string_template;
    this.isManagedService = row.is_managed_service;
    this.dataClassification = row.data_classification;
    this.criticality = row.criticality as Criticality;
    this.ownerTeam = row.owner_team;
    this.ownerUserId = row.owner_user_id;
    this.costCenter = row.cost_center;
    this.storageGb = row.storage_gb;
    this.replicationMode = row.replication_mode;
    this.hasBackup = row.has_backup;
    this.backupPolicy = row.backup_policy;
    this.lastBackupAt = row.last_backup_at;
    this.status = row.status as DatabaseStatus;
    this.environment = row.environment;
    this.monitoringUrl = row.monitoring_url;
    this.tags = row.tags;
    this.metadata = row.metadata;
    this.createdAt = row.created_at;
    this.updatedAt = row.updated_at;
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      code: this.code,
      name: this.name,
      displayName: this.displayName,
      description: this.description,
      physicalName: this.physicalName,
      logicalName: this.logicalName,
      path: this.path,
      engine: this.engine,
      version: this.version,
      port: this.port,
      hostedOnServerId: this.hostedOnServerId,
      hostedOnServerHostname: this.hostedOnServerHostname,
      connectionHost: this.connectionHost,
      connectionStringTemplate: this.connectionStringTemplate,
      isManagedService: this.isManagedService,
      dataClassification: this.dataClassification,
      criticality: this.criticality,
      ownerTeam: this.ownerTeam,
      ownerUserId: this.ownerUserId,
      costCenter: this.costCenter,
      storageGb: this.storageGb,
      replicationMode: this.replicationMode,
      hasBackup: this.hasBackup,
      backupPolicy: this.backupPolicy,
      lastBackupAt: this.lastBackupAt,
      status: this.status,
      environment: this.environment,
      monitoringUrl: this.monitoringUrl,
      tags: this.tags,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
