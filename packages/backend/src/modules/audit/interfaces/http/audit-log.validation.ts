import { z } from 'zod';

export const listAuditLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  action: z.string().optional(),
  resourceType: z.string().optional(),
  resourceId: z.string().uuid().optional(),
  actorUserId: z.string().uuid().optional(),
});

export const deleteAuditLogsBodySchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(500),
});
