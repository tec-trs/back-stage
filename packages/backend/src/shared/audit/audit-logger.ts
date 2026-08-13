import type { Knex } from 'knex';

import { db } from '../../database/connection.js';
import { getRequestId } from '../context/request-context.js';

export interface AuditLogEntry {
  actorUserId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}

export class AuditLogger {
  public constructor(private readonly database: Knex = db) {}

  public async record(entry: AuditLogEntry): Promise<void> {
    await this.database('audit_logs').insert({
      actor_user_id: entry.actorUserId ?? null,
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId ?? null,
      ip_address: entry.ipAddress ?? null,
      user_agent: entry.userAgent ?? null,
      metadata: JSON.stringify({ ...entry.metadata, requestId: getRequestId() }),
    });
  }
}

export const auditLogger = new AuditLogger();
