import type { Knex } from 'knex';

import { orgContext } from '../../../shared/context/org-context.js';
import { Server, ServerDisk, type ServerDiskRow, type ServerRow } from '../domain/server.entity.js';

const TABLE_NAME = 'servers';
const DISKS_TABLE_NAME = 'server_disks';

export interface ServerFilters {
  status?: string;
  environment?: string;
  provider?: string;
  search?: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
}

export interface DiskInput {
  mountPoint: string;
  capacityGb: number;
  diskType: string;
  purpose: string;
}

export interface ServiceInput {
  seq: number;
  name: string;
  commandStart?: string | null;
  commandStop?: string | null;
  commandStatus?: string | null;
  ports?: number[];
  status: string;
  observations?: string | null;
}

export interface CreateServerInput {
  hostname: string;
  displayName?: string | null;
  description?: string | null;
  serverType: string;
  provider: string;
  cpuCores?: number | null;
  cpuModel?: string | null;
  ramGb?: number | null;
  hypervisor?: string | null;
  osName?: string | null;
  osVersion?: string | null;
  osArchitecture?: string | null;
  osEolDate?: string | null;
  privateIps?: string[];
  publicIp?: string | null;
  vlanSubnet?: string | null;
  gateway?: string | null;
  dnsServers?: string[];
  domain?: string | null;
  fqdn?: string | null;
  accessMethod?: string | null;
  accessUser?: string | null;
  securityGroup?: string | null;
  dataClassification?: string | null;
  status?: string;
  environment: string;
  ownerTeam?: string | null;
  ownerUserId?: string | null;
  costCenter?: string | null;
  hasBackup?: boolean;
  backupPolicy?: string | null;
  monthlyCostEstimate?: number | null;
  monitoringUrl?: string | null;
  observations?: string | null;
  displayGroup?: string | null;
  tags?: string[];
  services?: ServiceInput[];
  metadata?: Record<string, unknown>;
  disks?: DiskInput[];
}

export type UpdateServerInput = Partial<CreateServerInput>;

export interface IServerRepository {
  findMany(filters: ServerFilters, pagination: Pagination): Promise<{ items: Server[]; total: number }>;
  findById(id: string): Promise<Server | undefined>;
  findByHostname(hostname: string): Promise<Server | undefined>;
  create(input: CreateServerInput): Promise<Server>;
  update(id: string, input: UpdateServerInput): Promise<Server | undefined>;
  setStatus(id: string, status: string): Promise<Server | undefined>;
  softDelete(id: string): Promise<boolean>;
  bulkSoftDelete(ids: string[]): Promise<number>;
  serversWithLinkedApplications(ids: string[]): Promise<string[]>;
  hasLinkedApplications(id: string): Promise<boolean>;
}

export class ServerRepository implements IServerRepository {
  public constructor(private readonly db: Knex) {}

  private baseQuery(): Knex.QueryBuilder {
    return this.db(TABLE_NAME)
      .where('organization_id', orgContext.getOrThrow())
      .whereNull('deleted_at');
  }

  private async loadDisks(serverIds: string[]): Promise<Map<string, ServerDisk[]>> {
    if (serverIds.length === 0) {
      return new Map();
    }
    const rows = (await this.db(DISKS_TABLE_NAME).whereIn(
      'server_id',
      serverIds,
    )) as ServerDiskRow[];

    const map = new Map<string, ServerDisk[]>();
    for (const row of rows) {
      const disk = new ServerDisk(row);
      const existing = map.get(row.server_id) ?? [];
      existing.push(disk);
      map.set(row.server_id, existing);
    }
    return map;
  }

  private async hydrate(rows: ServerRow[]): Promise<Server[]> {
    const disksByServer = await this.loadDisks(rows.map((row) => row.id));
    return rows.map((row) => new Server(row, disksByServer.get(row.id) ?? []));
  }

  public async findMany(
    filters: ServerFilters,
    pagination: Pagination,
  ): Promise<{ items: Server[]; total: number }> {
    const filteredQuery = this.db(TABLE_NAME)
      .where('organization_id', orgContext.getOrThrow())
      .whereNull('deleted_at');

    if (filters.status) {
      filteredQuery.where('status', filters.status);
    }
    if (filters.environment) {
      filteredQuery.where('environment', filters.environment);
    }
    if (filters.provider) {
      filteredQuery.where('provider', filters.provider);
    }
    if (filters.search) {
      filteredQuery.where((builder) => {
        builder
          .whereILike('hostname', `%${filters.search}%`)
          .orWhereILike('display_name', `%${filters.search}%`);
      });
    }

    const countQuery = filteredQuery.clone().clearSelect().count<{ count: string }[]>('* as count');
    const rowsQuery = filteredQuery
      .clone()
      .orderBy('hostname', 'asc')
      .limit(pagination.pageSize)
      .offset((pagination.page - 1) * pagination.pageSize);

    const [countResult, rows] = await Promise.all([countQuery, rowsQuery]);
    const items = await this.hydrate(rows as ServerRow[]);

    return { items, total: Number(countResult[0]?.count ?? 0) };
  }

  public async findById(id: string): Promise<Server | undefined> {
    const row = (await this.baseQuery().where('id', id).first()) as ServerRow | undefined;
    if (!row) {
      return undefined;
    }
    const [server] = await this.hydrate([row]);
    return server;
  }

  public async findByHostname(hostname: string): Promise<Server | undefined> {
    const row = (await this.baseQuery().where({ hostname }).first()) as ServerRow | undefined;
    if (!row) {
      return undefined;
    }
    const [server] = await this.hydrate([row]);
    return server;
  }

  private async replaceDisks(serverId: string, disks: DiskInput[]): Promise<void> {
    await this.db(DISKS_TABLE_NAME).where({ server_id: serverId }).del();
    if (disks.length > 0) {
      const orgId = orgContext.getOrThrow();
      await this.db(DISKS_TABLE_NAME).insert(
        disks.map((disk) => ({
          organization_id: orgId,
          server_id: serverId,
          mount_point: disk.mountPoint,
          capacity_gb: disk.capacityGb,
          disk_type: disk.diskType,
          purpose: disk.purpose,
        })),
      );
    }
  }

  public async create(input: CreateServerInput): Promise<Server> {
    const rows = (await this.db(TABLE_NAME)
      .insert({
        organization_id: orgContext.getOrThrow(),
        hostname: input.hostname,
        display_name: input.displayName ?? null,
        description: input.description ?? null,
        server_type: input.serverType,
        provider: input.provider,
        cpu_cores: input.cpuCores ?? null,
        cpu_model: input.cpuModel ?? null,
        ram_gb: input.ramGb ?? null,
        hypervisor: input.hypervisor ?? null,
        os_name: input.osName ?? null,
        os_version: input.osVersion ?? null,
        os_architecture: input.osArchitecture ?? null,
        os_eol_date: input.osEolDate ?? null,
        private_ips: input.privateIps ?? [],
        public_ip: input.publicIp ?? null,
        vlan_subnet: input.vlanSubnet ?? null,
        gateway: input.gateway ?? null,
        dns_servers: input.dnsServers ?? [],
        domain: input.domain ?? null,
        fqdn: input.fqdn ?? null,
        access_method: input.accessMethod ?? null,
        access_user: input.accessUser ?? null,
        security_group: input.securityGroup ?? null,
        data_classification: input.dataClassification ?? null,
        status: input.status ?? 'active',
        environment: input.environment,
        owner_team: input.ownerTeam ?? null,
        owner_user_id: input.ownerUserId ?? null,
        cost_center: input.costCenter ?? null,
        has_backup: input.hasBackup ?? false,
        backup_policy: input.backupPolicy ?? null,
        monthly_cost_estimate: input.monthlyCostEstimate ?? null,
        monitoring_url: input.monitoringUrl ?? null,
        observations: input.observations ?? null,
        display_group: input.displayGroup ?? null,
        tags: input.tags ?? [],
        services: JSON.stringify(input.services ?? []),
        metadata: JSON.stringify(input.metadata ?? {}),
      })
      .returning('*')) as ServerRow[];

    const server = rows[0];
    if (input.disks && input.disks.length > 0) {
      await this.replaceDisks(server.id, input.disks);
    }

    return (await this.findById(server.id)) as Server;
  }

  public async update(id: string, input: UpdateServerInput): Promise<Server | undefined> {
    const patch: Record<string, unknown> = {};

    if (input.hostname !== undefined) patch.hostname = input.hostname;
    if (input.displayName !== undefined) patch.display_name = input.displayName;
    if (input.description !== undefined) patch.description = input.description;
    if (input.serverType !== undefined) patch.server_type = input.serverType;
    if (input.provider !== undefined) patch.provider = input.provider;
    if (input.cpuCores !== undefined) patch.cpu_cores = input.cpuCores;
    if (input.cpuModel !== undefined) patch.cpu_model = input.cpuModel;
    if (input.ramGb !== undefined) patch.ram_gb = input.ramGb;
    if (input.hypervisor !== undefined) patch.hypervisor = input.hypervisor;
    if (input.osName !== undefined) patch.os_name = input.osName;
    if (input.osVersion !== undefined) patch.os_version = input.osVersion;
    if (input.osArchitecture !== undefined) patch.os_architecture = input.osArchitecture;
    if (input.osEolDate !== undefined) patch.os_eol_date = input.osEolDate;
    if (input.privateIps !== undefined) patch.private_ips = input.privateIps;
    if (input.publicIp !== undefined) patch.public_ip = input.publicIp;
    if (input.vlanSubnet !== undefined) patch.vlan_subnet = input.vlanSubnet;
    if (input.gateway !== undefined) patch.gateway = input.gateway;
    if (input.dnsServers !== undefined) patch.dns_servers = input.dnsServers;
    if (input.domain !== undefined) patch.domain = input.domain;
    if (input.fqdn !== undefined) patch.fqdn = input.fqdn;
    if (input.accessMethod !== undefined) patch.access_method = input.accessMethod;
    if (input.accessUser !== undefined) patch.access_user = input.accessUser;
    if (input.securityGroup !== undefined) patch.security_group = input.securityGroup;
    if (input.dataClassification !== undefined) patch.data_classification = input.dataClassification;
    if (input.status !== undefined) patch.status = input.status;
    if (input.environment !== undefined) patch.environment = input.environment;
    if (input.ownerTeam !== undefined) patch.owner_team = input.ownerTeam;
    if (input.ownerUserId !== undefined) patch.owner_user_id = input.ownerUserId;
    if (input.costCenter !== undefined) patch.cost_center = input.costCenter;
    if (input.hasBackup !== undefined) patch.has_backup = input.hasBackup;
    if (input.backupPolicy !== undefined) patch.backup_policy = input.backupPolicy;
    if (input.monthlyCostEstimate !== undefined) patch.monthly_cost_estimate = input.monthlyCostEstimate;
    if (input.monitoringUrl !== undefined) patch.monitoring_url = input.monitoringUrl;
    if (input.observations !== undefined) patch.observations = input.observations;
    if (input.displayGroup !== undefined) patch.display_group = input.displayGroup;
    if (input.tags !== undefined) patch.tags = input.tags;
    if (input.services !== undefined) patch.services = JSON.stringify(input.services);
    if (input.metadata !== undefined) patch.metadata = JSON.stringify(input.metadata);

    if (Object.keys(patch).length > 0) {
      await this.baseQuery().where('id', id).update(patch);
    }

    if (input.disks !== undefined) {
      await this.replaceDisks(id, input.disks);
    }

    return this.findById(id);
  }

  public async setStatus(id: string, status: string): Promise<Server | undefined> {
    await this.baseQuery().where('id', id).update({ status });
    return this.findById(id);
  }

  public async softDelete(id: string): Promise<boolean> {
    const affected = (await this.db(TABLE_NAME)
      .whereNull('deleted_at')
      .where('id', id)
      .update({ deleted_at: this.db.fn.now() })) as unknown as number;
    return affected > 0;
  }

  public async bulkSoftDelete(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const affected = (await this.db(TABLE_NAME)
      .whereNull('deleted_at')
      .whereIn('id', ids)
      .update({ deleted_at: this.db.fn.now() })) as unknown as number;
    return affected;
  }

  public async serversWithLinkedApplications(ids: string[]): Promise<string[]> {
    if (ids.length === 0) return [];
    const rows = await this.db('application_deployments')
      .join('applications', 'applications.id', 'application_deployments.application_id')
      .whereNull('application_deployments.deleted_at')
      .whereNull('applications.deleted_at')
      .whereIn('application_deployments.server_id', ids)
      .distinct('application_deployments.server_id')
      .select('application_deployments.server_id as id');
    return rows.map((r: { id: string }) => r.id);
  }

  public async hasLinkedApplications(id: string): Promise<boolean> {
    const rows = await this.db('application_deployments')
      .join('applications', 'applications.id', 'application_deployments.application_id')
      .whereNull('application_deployments.deleted_at')
      .whereNull('applications.deleted_at')
      .where('application_deployments.server_id', id)
      .limit(1);
    return rows.length > 0;
  }
}
