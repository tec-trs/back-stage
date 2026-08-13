export type UUID = string;

export type ISODateString = string;

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: Pagination;
}

export type HealthState = 'ok' | 'degraded' | 'down';

export interface HealthStatus {
  status: HealthState;
  uptimeSeconds: number;
  timestamp: ISODateString;
  version: string;
}
