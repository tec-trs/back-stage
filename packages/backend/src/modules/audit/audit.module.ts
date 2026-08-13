import { Router } from 'express';

import { db } from '../../database/connection.js';
import { container } from '../../shared/container.js';

import { AuditLogService } from './application/audit-log.service.js';
import { AuditLogRepository } from './infrastructure/audit-log.repository.js';
import { AuditLogController } from './interfaces/http/audit-log.controller.js';
import { createAuditLogRouter } from './interfaces/http/audit-log.routes.js';

export function registerAuditModule(): Router {
  container.register('AuditLogRepository', () => new AuditLogRepository(db));
  container.register(
    'AuditLogService',
    () => new AuditLogService(container.resolve('AuditLogRepository')),
  );
  container.register(
    'AuditLogController',
    () => new AuditLogController(container.resolve('AuditLogService')),
  );

  return createAuditLogRouter(container.resolve('AuditLogController'));
}
