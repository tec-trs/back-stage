import type { Knex } from 'knex';

import { orgContext } from '../../../shared/context/org-context.js';
import { Database, type DatabaseRow } from '../domain/database.entity.js';
import { DatabasePort, type DatabasePortRow } from '../domain/database-port.entity.js';

const TABLE_NAME = 'databases';

export interface DatabaseFilters {
  status?: string;
  criticality?: string;
  engine?: string;
  environment?: string;
  tags?: string[];
  search?: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
}

export interface CreateDatabaseInput {
  code?: string;
  name: string;
  displayName?: string | null;
  description?: string | null;
  physicalName?: string | null;
  logicalName?: string | null;
  path?: string | null;
  engine: string;
  version?: string | null;
  port?: number | null;
  hostedOnServerId?: string | null;
  connectionHost?: string | null;
  connectionStringTemplate?: string | null;
  isManagedService?: boolean;
  dataClassification?: string | null;
  criticality?: string;
  ownerTeam?: string | null;
  ownerUserId?: string | null;
  costCenter?: string | null;
  storageGb?: number | null;
  replicationMode?: string | null;
  hasBackup?: boolean;
  backupPolicy?: string | null;
  lastBackupAt?: Date | null;
  status?: string;
  environment: string;
  monitoringUrl?: string | null;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export type UpdateDatabaseInput = Partial<CreateDatabaseInput>;

export interface IDatabaseRepository {
  findMany(filters: DatabaseFilters, pagination: Pagination): Promise<{ items: Database[]; total: number }>;
  findById(id: string): Promise<Database | undefined>;
  findByNameAndLocation(name: string, hostedOnServerId: string | null, port: number | null): Promise<Database | undefined>;
  create(input: CreateDatabaseInput): Promise<Database>;
  update(id: string, input: UpdateDatabaseInput): Promise<Database | undefined>;
  setStatus(id: string, status: string): Promise<Database | undefined>;
  softDelete(id: string): Promise<boolean>;
  bulkSoftDelete(ids: string[]): Promise<number>;
  getPortsByDatabaseId(databaseId: string): Promise<DatabasePort[]>;
  getPortByDatabaseIdAndPort(databaseId: string, port: number): Promise<DatabasePort | undefined>;
  addPort(databaseId: string, port: number, parameters?: string | null): Promise<DatabasePort>;
  updatePort(portId: string, parameters?: string | null): Promise<DatabasePort | undefined>;
  removePort(portId: string): Promise<boolean>;
  hasGroupMemberships(databaseId: string): Promise<boolean>;
}

export class DatabaseRepository implements IDatabaseRepository {
  public constructor(private readonly db: Knex) {}

  private baseQuery(): Knex.QueryBuilder {
    return this.db(TABLE_NAME)
      .where('organization_id', orgContext.getOrThrow())
      .whereNull('deleted_at');
  }

  private async hydrate(rows: DatabaseRow[]): Promise<Database[]> {
    if (rows.length === 0) {
      return [];
    }

    const serverIds = rows
      .filter((row) => row.hosted_on_server_id)
      .map((row) => row.hosted_on_server_id as string);

    let serverMap = new Map<string, string>();
    if (serverIds.length > 0) {
      const servers = await this.db('servers')
        .select('id', 'hostname')
        .whereIn('id', serverIds)
        .whereNull('deleted_at');
      serverMap = new Map(servers.map((s: any) => [s.id, s.hostname]));
    }

    return rows.map(
      (row) => new Database(row, row.hosted_on_server_id ? serverMap.get(row.hosted_on_server_id) ?? null : null),
    );
  }

  public async findMany(
    filters: DatabaseFilters,
    pagination: Pagination,
  ): Promise<{ items: Database[]; total: number }> {
    const orgId = orgContext.getOrThrow();
    const filteredQuery = this.db(TABLE_NAME).where('organization_id', orgId).whereNull('deleted_at');

    if (filters.status) {
      filteredQuery.where('status', filters.status);
    }
    if (filters.criticality) {
      filteredQuery.where('criticality', filters.criticality);
    }
    if (filters.engine) {
      filteredQuery.where('engine', filters.engine);
    }
    if (filters.environment) {
      filteredQuery.where('environment', filters.environment);
    }
    if (filters.tags && filters.tags.length > 0) {
      filteredQuery.where((builder) => {
        builder.whereRaw('tags && ?', [filters.tags as string[]]);
      });
    }
    if (filters.search) {
      filteredQuery.where((builder) => {
        builder
          .whereILike('name', `%${filters.search}%`)
          .orWhereILike('display_name', `%${filters.search}%`);
      });
    }

    const countQuery = filteredQuery.clone().clearSelect().count<{ count: string }[]>('* as count');
    const rowsQuery = filteredQuery
      .clone()
      .orderBy('display_name', 'asc')
      .limit(pagination.pageSize)
      .offset((pagination.page - 1) * pagination.pageSize);

    const [countResult, rows] = await Promise.all([countQuery, rowsQuery]);
    const items = await this.hydrate(rows as DatabaseRow[]);

    return { items, total: Number(countResult[0]?.count ?? 0) };
  }

  public async findById(id: string): Promise<Database | undefined> {
    const row = (await this.baseQuery().where('id', id).first()) as DatabaseRow | undefined;
    if (!row) {
      return undefined;
    }
    const [database] = await this.hydrate([row]);
    return database;
  }

  // Mirrors databases_org_server_name_port_unique_active: the same banco
  // name legitimately repeats within an organization when it's not hosted
  // on the same server+port as another row (e.g. distinct servers, or one
  // of the two not yet documented). When hostedOnServerId or port is
  // unknown there is nothing to disambiguate by — same as the partial
  // unique index itself, which treats NULL as distinct from any other
  // NULL and so does not constrain that combination either — so this
  // returns undefined (no conflict) rather than guessing.
  public async findByNameAndLocation(
    name: string,
    hostedOnServerId: string | null,
    port: number | null,
  ): Promise<Database | undefined> {
    if (!hostedOnServerId || port === null || port === undefined) {
      return undefined;
    }

    const row = (await this.baseQuery()
      .where('name', name)
      .where('hosted_on_server_id', hostedOnServerId)
      .where('port', port)
      .first()) as DatabaseRow | undefined;
    if (!row) {
      return undefined;
    }
    const [database] = await this.hydrate([row]);
    return database;
  }

  public async create(input: CreateDatabaseInput): Promise<Database> {
    const [row] = (await this.db(TABLE_NAME)
      .insert({
        organization_id: orgContext.getOrThrow(),
        code: input.code,
        name: input.name,
        display_name: input.displayName,
        description: input.description,
        physical_name: input.physicalName,
        logical_name: input.logicalName,
        path: input.path,
        engine: input.engine,
        version: input.version,
        port: input.port,
        hosted_on_server_id: input.hostedOnServerId,
        connection_host: input.connectionHost,
        connection_string_template: input.connectionStringTemplate,
        is_managed_service: input.isManagedService ?? false,
        data_classification: input.dataClassification,
        criticality: input.criticality ?? 'medium',
        owner_team: input.ownerTeam,
        owner_user_id: input.ownerUserId,
        cost_center: input.costCenter,
        storage_gb: input.storageGb,
        replication_mode: input.replicationMode,
        has_backup: input.hasBackup ?? false,
        backup_policy: input.backupPolicy,
        last_backup_at: input.lastBackupAt,
        status: input.status ?? 'active',
        environment: input.environment,
        monitoring_url: input.monitoringUrl,
        tags: input.tags ?? [],
        metadata: input.metadata ?? {},
      })
      .returning('id')) as { id: string }[];

    const created = await this.findById(row.id);
    if (!created) {
      throw new Error('Falha ao criar banco de dados');
    }
    return created;
  }

  public async update(id: string, input: UpdateDatabaseInput): Promise<Database | undefined> {
    const updateData: Record<string, unknown> = {};

    if (input.code !== undefined) updateData.code = input.code;
    if (input.name !== undefined) updateData.name = input.name;
    if (input.hostedOnServerId !== undefined) updateData.hosted_on_server_id = input.hostedOnServerId;
    if (input.engine !== undefined) updateData.engine = input.engine;
    if (input.displayName !== undefined) updateData.display_name = input.displayName;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.physicalName !== undefined) updateData.physical_name = input.physicalName;
    if (input.logicalName !== undefined) updateData.logical_name = input.logicalName;
    if (input.path !== undefined) updateData.path = input.path;
    if (input.version !== undefined) updateData.version = input.version;
    if (input.port !== undefined) updateData.port = input.port;
    if (input.connectionHost !== undefined) updateData.connection_host = input.connectionHost;
    if (input.connectionStringTemplate !== undefined)
      updateData.connection_string_template = input.connectionStringTemplate;
    if (input.isManagedService !== undefined) updateData.is_managed_service = input.isManagedService;
    if (input.dataClassification !== undefined) updateData.data_classification = input.dataClassification;
    if (input.criticality !== undefined) updateData.criticality = input.criticality;
    if (input.ownerTeam !== undefined) updateData.owner_team = input.ownerTeam;
    if (input.ownerUserId !== undefined) updateData.owner_user_id = input.ownerUserId;
    if (input.costCenter !== undefined) updateData.cost_center = input.costCenter;
    if (input.storageGb !== undefined) updateData.storage_gb = input.storageGb;
    if (input.replicationMode !== undefined) updateData.replication_mode = input.replicationMode;
    if (input.hasBackup !== undefined) updateData.has_backup = input.hasBackup;
    if (input.backupPolicy !== undefined) updateData.backup_policy = input.backupPolicy;
    if (input.lastBackupAt !== undefined) updateData.last_backup_at = input.lastBackupAt;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.monitoringUrl !== undefined) updateData.monitoring_url = input.monitoringUrl;
    if (input.tags !== undefined) updateData.tags = input.tags;
    if (input.metadata !== undefined) updateData.metadata = input.metadata;

    if (Object.keys(updateData).length === 0) {
      return this.findById(id);
    }

    await this.db(TABLE_NAME).where({ id }).update(updateData);
    return this.findById(id);
  }

  public async setStatus(id: string, status: string): Promise<Database | undefined> {
    await this.db(TABLE_NAME).where({ id }).update({ status });
    return this.findById(id);
  }

  public async softDelete(id: string): Promise<boolean> {
    const result = await this.db(TABLE_NAME).where({ id }).update({ deleted_at: this.db.fn.now() });
    return result > 0;
  }

  public async bulkSoftDelete(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const affected = (await this.db(TABLE_NAME)
      .whereNull('deleted_at')
      .whereIn('id', ids)
      .update({ deleted_at: this.db.fn.now() })) as unknown as number;
    return affected;
  }

  // ============ Database Ports Management ============

  public async getPortsByDatabaseId(databaseId: string): Promise<DatabasePort[]> {
    const rows = (await this.db('database_ports')
      .where('organization_id', orgContext.getOrThrow())
      .where('database_id', databaseId)
      .orderBy('port', 'asc')) as DatabasePortRow[];
    
    return rows.map((row) => new DatabasePort(row));
  }

  public async getPortByDatabaseIdAndPort(
    databaseId: string,
    port: number,
  ): Promise<DatabasePort | undefined> {
    const row = (await this.db('database_ports')
      .where('organization_id', orgContext.getOrThrow())
      .where('database_id', databaseId)
      .where('port', port)
      .first()) as DatabasePortRow | undefined;
    
    if (!row) {
      return undefined;
    }
    return new DatabasePort(row);
  }

  public async addPort(
    databaseId: string,
    port: number,
    parameters?: string | null,
  ): Promise<DatabasePort> {
    // Check if port already exists
    const existing = await this.getPortByDatabaseIdAndPort(databaseId, port);
    if (existing) {
      throw new Error(`Ja existe uma porta ${port} para este banco de dados`);
    }

    const [row] = (await this.db('database_ports')
      .insert({
        id: this.db.raw('gen_random_uuid()'),
        organization_id: orgContext.getOrThrow(),
        database_id: databaseId,
        port,
        parameters: parameters ?? null,
      })
      .returning('*')) as DatabasePortRow[];

    return new DatabasePort(row);
  }

  public async updatePort(
    portId: string,
    parameters?: string | null,
  ): Promise<DatabasePort | undefined> {
    const updateData: Record<string, unknown> = {};
    
    if (parameters !== undefined) {
      updateData.parameters = parameters ?? null;
    }

    if (Object.keys(updateData).length === 0) {
      const row = (await this.db('database_ports')
        .where('id', portId)
        .first()) as DatabasePortRow | undefined;
      return row ? new DatabasePort(row) : undefined;
    }

    await this.db('database_ports').where('id', portId).update(updateData);
    
    const row = (await this.db('database_ports')
      .where('id', portId)
      .first()) as DatabasePortRow | undefined;
    
    return row ? new DatabasePort(row) : undefined;
  }

  public async removePort(portId: string): Promise<boolean> {
    const result = await this.db('database_ports').where('id', portId).del();
    return result > 0;
  }

  public async hasGroupMemberships(databaseId: string): Promise<boolean> {
    const result = (await this.db('database_group_members')
      .where('database_id', databaseId)
      .whereNull('deleted_at')
      .count<{ count: string }[]>('* as count')) as { count: string }[];
    
    return Number(result[0]?.count ?? 0) > 0;
  }
}
