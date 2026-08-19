import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

export type ServerType = 'vm' | 'bare_metal' | 'container_host';
export type ServerProvider = 'on_premise' | 'aws' | 'azure' | 'gcp' | 'oracle_cloud' | 'own_datacenter';
export type ServerStatus = 'active' | 'deactivated';
export type ServerEnvironment = string;
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

export interface ServerDisk {
  id: string;
  mountPoint: string;
  capacityGb: number;
  diskType: DiskType;
  purpose: DiskPurpose;
}

export interface ServerSummary {
  id: string;
  hostname: string;
  displayName: string | null;
  description: string | null;
  serverType: ServerType;
  provider: ServerProvider;
  cpuCores: number | null;
  cpuModel: string | null;
  ramGb: number | null;
  hypervisor: string | null;
  osName: string | null;
  osVersion: string | null;
  osArchitecture: string | null;
  osEolDate: string | null;
  privateIps: string[];
  publicIp: string | null;
  vlanSubnet: string | null;
  gateway: string | null;
  dnsServers: string[];
  domain: string | null;
  fqdn: string | null;
  accessMethod: string | null;
  accessUser: string | null;
  securityGroup: string | null;
  dataClassification: string | null;
  status: ServerStatus;
  environment: ServerEnvironment;
  ownerTeam: string | null;
  ownerUserId: string | null;
  costCenter: string | null;
  hasBackup: boolean;
  backupPolicy: string | null;
  lastBackupAt: string | null;
  monthlyCostEstimate: number | null;
  monitoringUrl: string | null;
  observations: string | null;
  displayGroup: string | null;
  tags: string[];
  services: ServerService[];
  metadata: Record<string, unknown>;
  disks: ServerDisk[];
  createdAt: string;
  updatedAt: string;
}

interface ListServersResponse {
  items: ServerSummary[];
  pagination: { page: number; pageSize: number; total: number };
}

export function useServers(page = 1): UseQueryResult<ListServersResponse, Error> {
  return useQuery({
    queryKey: ['servers', page],
    queryFn: () => apiRequest<ListServersResponse>('/api/servers', { query: { page, pageSize: 50 } }),
  });
}

export function useAllServers(): UseQueryResult<ServerSummary[], Error> {
  return useQuery({
    queryKey: ['servers-all'],
    queryFn: async () => {
      let allItems: ServerSummary[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await apiRequest<ListServersResponse>('/api/servers', {
          query: { page, pageSize: 100 },
        });
        allItems = allItems.concat(response.items);
        hasMore = response.pagination.page * response.pagination.pageSize < response.pagination.total;
        page++;
      }

      return allItems;
    },
  });
}
