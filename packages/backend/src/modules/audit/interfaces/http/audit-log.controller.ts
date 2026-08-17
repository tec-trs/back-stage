import type { Request, Response } from 'express';
import type { z } from 'zod';

import type { AuditLogService } from '../../application/audit-log.service.js';

import type { deleteAuditLogsBodySchema, listAuditLogsQuerySchema } from './audit-log.validation.js';

type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;
type DeleteAuditLogsBody = z.infer<typeof deleteAuditLogsBodySchema>;

export class AuditLogController {
  public constructor(private readonly auditLogService: AuditLogService) {}

  public list = async (request: Request, response: Response): Promise<void> => {
    const query = request.query as unknown as ListAuditLogsQuery;
    const result = await this.auditLogService.list(
      {
        action: query.action,
        resourceType: query.resourceType,
        resourceId: query.resourceId,
        actorUserId: query.actorUserId,
      },
      { page: query.page, pageSize: query.pageSize },
    );
    response.status(200).json(result);
  };

  public deleteMany = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as DeleteAuditLogsBody;
    const result = await this.auditLogService.deleteByIds(body.ids);
    response.status(200).json(result);
  };
}
