export type ServerType = 'vm' | 'bare_metal' | 'container_host';

export type ServerProvider =
  | 'on_premise'
  | 'aws'
  | 'azure'
  | 'gcp'
  | 'oracle_cloud'
  | 'own_datacenter';

export type ServerStatus = 'active' | 'deactivated';

export type ServerEnvironment = 'production' | 'staging' | 'development' | 'sandbox';

export type ServiceStatus = 'active' | 'inactive';

export interface ServerService {
  seq: number;
  name: string;
  commandStart: string | null;
  commandStop: string | null;
  commandStatus: string | null;
  ports: number[];
  status: ServiceStatus;
  observations: string | null;
}

export type DiskType = 'ssd' | 'hdd' | 'nvme';

export type DiskPurpose = 'system' | 'data' | 'log' | 'backup';

export interface ServerDiskRow {
  id: string;
  server_id: string;
  mount_point: string;
  capacity_gb: number;
  disk_type: string;
  purpose: string;
}

export class ServerDisk {
  public readonly id: string;
  public readonly mountPoint: string;
  public readonly capacityGb: number;
  public readonly diskType: DiskType;
  public readonly purpose: DiskPurpose;

  public constructor(row: ServerDiskRow) {
    this.id = row.id;
    this.mountPoint = row.mount_point;
    this.capacityGb = row.capacity_gb;
    this.diskType = row.disk_type as DiskType;
    this.purpose = row.purpose as DiskPurpose;
  }

  public toJSON(): {
    id: string;
    mountPoint: string;
    capacityGb: number;
    diskType: DiskType;
    purpose: DiskPurpose;
  } {
    return {
      id: this.id,
      mountPoint: this.mountPoint,
      capacityGb: this.capacityGb,
      diskType: this.diskType,
      purpose: this.purpose,
    };
  }
}

export interface ServerRow {
  id: string;
  hostname: string;
  display_name: string | null;
  description: string | null;
  server_type: string;
  provider: string;
  cpu_cores: number | null;
  cpu_model: string | null;
  ram_gb: number | null;
  hypervisor: string | null;
  os_name: string | null;
  os_version: string | null;
  os_architecture: string | null;
  os_eol_date: string | null;
  private_ips: string[];
  public_ip: string | null;
  vlan_subnet: string | null;
  gateway: string | null;
  dns_servers: string[];
  domain: string | null;
  fqdn: string | null;
  access_method: string | null;
  access_user: string | null;
  security_group: string | null;
  data_classification: string | null;
  status: string;
  environment: string;
  owner_team: string | null;
  owner_user_id: string | null;
  cost_center: string | null;
  has_backup: boolean;
  backup_policy: string | null;
  last_backup_at: Date | null;
  monthly_cost_estimate: string | null;
  monitoring_url: string | null;
  observations: string | null;
  display_group: string | null;
  tags: string[];
  services: ServerService[];
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export class Server {
  public readonly id: string;
  public readonly hostname: string;
  public readonly displayName: string | null;
  public readonly description: string | null;
  public readonly serverType: ServerType;
  public readonly provider: ServerProvider;
  public readonly cpuCores: number | null;
  public readonly cpuModel: string | null;
  public readonly ramGb: number | null;
  public readonly hypervisor: string | null;
  public readonly osName: string | null;
  public readonly osVersion: string | null;
  public readonly osArchitecture: string | null;
  public readonly osEolDate: string | null;
  public readonly privateIps: string[];
  public readonly publicIp: string | null;
  public readonly vlanSubnet: string | null;
  public readonly gateway: string | null;
  public readonly dnsServers: string[];
  public readonly domain: string | null;
  public readonly fqdn: string | null;
  public readonly accessMethod: string | null;
  public readonly accessUser: string | null;
  public readonly securityGroup: string | null;
  public readonly dataClassification: string | null;
  public readonly status: ServerStatus;
  public readonly environment: ServerEnvironment;
  public readonly ownerTeam: string | null;
  public readonly ownerUserId: string | null;
  public readonly costCenter: string | null;
  public readonly hasBackup: boolean;
  public readonly backupPolicy: string | null;
  public readonly lastBackupAt: Date | null;
  public readonly monthlyCostEstimate: number | null;
  public readonly monitoringUrl: string | null;
  public readonly observations: string | null;
  public readonly displayGroup: string | null;
  public readonly tags: string[];
  public readonly services: ServerService[];
  public readonly metadata: Record<string, unknown>;
  public readonly disks: ServerDisk[];
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  public constructor(row: ServerRow, disks: ServerDisk[] = []) {
    this.id = row.id;
    this.hostname = row.hostname;
    this.displayName = row.display_name;
    this.description = row.description;
    this.serverType = row.server_type as ServerType;
    this.provider = row.provider as ServerProvider;
    this.cpuCores = row.cpu_cores;
    this.cpuModel = row.cpu_model;
    this.ramGb = row.ram_gb;
    this.hypervisor = row.hypervisor;
    this.osName = row.os_name;
    this.osVersion = row.os_version;
    this.osArchitecture = row.os_architecture;
    this.osEolDate = row.os_eol_date;
    this.privateIps = row.private_ips;
    this.publicIp = row.public_ip;
    this.vlanSubnet = row.vlan_subnet;
    this.gateway = row.gateway;
    this.dnsServers = row.dns_servers;
    this.domain = row.domain;
    this.fqdn = row.fqdn;
    this.accessMethod = row.access_method;
    this.accessUser = row.access_user;
    this.securityGroup = row.security_group;
    this.dataClassification = row.data_classification;
    this.status = row.status as ServerStatus;
    this.environment = row.environment as ServerEnvironment;
    this.ownerTeam = row.owner_team;
    this.ownerUserId = row.owner_user_id;
    this.costCenter = row.cost_center;
    this.hasBackup = row.has_backup;
    this.backupPolicy = row.backup_policy;
    this.lastBackupAt = row.last_backup_at;
    this.monthlyCostEstimate = row.monthly_cost_estimate ? Number(row.monthly_cost_estimate) : null;
    this.monitoringUrl = row.monitoring_url;
    this.observations = row.observations;
    this.displayGroup = row.display_group;
    this.tags = row.tags ?? [];
    this.services = (row.services as ServerService[]) ?? [];
    this.metadata = row.metadata;
    this.disks = disks;
    this.createdAt = row.created_at;
    this.updatedAt = row.updated_at;
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      hostname: this.hostname,
      displayName: this.displayName,
      description: this.description,
      serverType: this.serverType,
      provider: this.provider,
      cpuCores: this.cpuCores,
      cpuModel: this.cpuModel,
      ramGb: this.ramGb,
      hypervisor: this.hypervisor,
      osName: this.osName,
      osVersion: this.osVersion,
      osArchitecture: this.osArchitecture,
      osEolDate: this.osEolDate,
      privateIps: this.privateIps,
      publicIp: this.publicIp,
      vlanSubnet: this.vlanSubnet,
      gateway: this.gateway,
      dnsServers: this.dnsServers,
      domain: this.domain,
      fqdn: this.fqdn,
      accessMethod: this.accessMethod,
      accessUser: this.accessUser,
      securityGroup: this.securityGroup,
      dataClassification: this.dataClassification,
      status: this.status,
      environment: this.environment,
      ownerTeam: this.ownerTeam,
      ownerUserId: this.ownerUserId,
      costCenter: this.costCenter,
      hasBackup: this.hasBackup,
      backupPolicy: this.backupPolicy,
      lastBackupAt: this.lastBackupAt,
      monthlyCostEstimate: this.monthlyCostEstimate,
      monitoringUrl: this.monitoringUrl,
      observations: this.observations,
      displayGroup: this.displayGroup,
      tags: this.tags,
      services: this.services,
      metadata: this.metadata,
      disks: this.disks.map((disk) => disk.toJSON()),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
