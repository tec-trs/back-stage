import type { HealthStatus } from '@back-stage/shared';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

async function fetchHealthStatus(): Promise<HealthStatus> {
  const response = await fetch(`${API_URL}/api/health`);
  if (!response.ok) {
    throw new Error(`Falha ao consultar status: ${response.status}`);
  }
  return (await response.json()) as HealthStatus;
}

export function useHealthStatus(): UseQueryResult<HealthStatus, Error> {
  return useQuery({
    queryKey: ['health-status'],
    queryFn: fetchHealthStatus,
  });
}
