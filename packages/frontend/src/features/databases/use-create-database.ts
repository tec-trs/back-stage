import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

import type { Database } from './use-databases';

export interface CreateDatabaseInput {
  name: string;
  displayName?: string | null;
  description?: string | null;
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
  costCenter?: string | null;
  storageGb?: number | null;
  replicationMode?: string | null;
  hasBackup?: boolean;
  backupPolicy?: string | null;
  status?: string;
  environment: string;
  monitoringUrl?: string | null;
  tags?: string[];
}

export function useCreateDatabase(): UseMutationResult<Database, Error, CreateDatabaseInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDatabaseInput) =>
      apiRequest<Database>('/api/databases', { method: 'POST', body: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['databases'] });
    },
  });
}
