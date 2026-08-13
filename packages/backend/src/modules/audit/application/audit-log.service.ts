import type {
  AuditLogFilters,
  AuditLogRow,
  IAuditLogRepository,
  Pagination,
} from '../infrastructure/audit-log.repository.js';

export interface AuditLogDto {
  id: string;
  actorUserId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface ListAuditLogsResult {
  items: AuditLogDto[];
  pagination: { page: number; pageSize: number; total: number };
}

function toDto(row: AuditLogRow): AuditLogDto {
  return {
    id: row.id,
    actorUserId: row.actor_user_id,
    action: row.action,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}

export class AuditLogService {
  public constructor(private readonly auditLogRepository: IAuditLogRepository) {}

  public async list(
    filters: AuditLogFilters,
    pagination: Pagination,
  ): Promise<ListAuditLogsResult> {
    const { items, total } = await this.auditLogRepository.findMany(filters, pagination);
    return { items: items.map(toDto), pagination: { ...pagination, total } };
  }
}
