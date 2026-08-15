import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

import type {
  DiskPurpose,
  DiskType,
  ServerEnvironment,
  ServerProvider,
  ServerStatus,
  ServerSummary,
  ServerType,
} from './use-servers';

export interface ServerDiskInput {
  mountPoint: string;
  capacityGb: number;
  diskType: DiskType;
  purpose: DiskPurpose;
}

export interface CreateServerInput {
  hostname: string;
  displayName?: string | null;
  description?: string | null;
  serverType: ServerType;
  provider: ServerProvider;
  domain?: string | null;
  fqdn?: string | null;
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
  accessMethod?: string | null;
  securityGroup?: string | null;
  dataClassification?: string | null;
  status?: ServerStatus;
  environment: ServerEnvironment;
  ownerTeam?: string | null;
  ownerUserId?: string | null;
  costCenter?: string | null;
  hasBackup?: boolean;
  backupPolicy?: string | null;
  monthlyCostEstimate?: number | null;
  monitoringUrl?: string | null;
  disks?: ServerDiskInput[];
}

export function useCreateServer(): UseMutationResult<ServerSummary, Error, CreateServerInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateServerInput) =>
      apiRequest<ServerSummary>('/api/servers', { method: 'POST', body: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['servers'] });
    },
  });
}
