import { z } from 'zod';

const urlTypeEnum = z.string().min(1).max(50).regex(/^[a-z0-9_-]+$/, 'tipo de url invalido');
const statusEnum = z.enum(['active', 'inactive', 'deprecated', 'error']);
const methodEnum = z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']).nullable().optional();

const baseFields = {
  url: z.string().min(1).max(2048),
  urlType: urlTypeEnum,
  description: z.string().nullable().optional(),
  method: methodEnum,
  authRequired: z.boolean().optional(),
  authMethod: z.string().max(50).nullable().optional(),
  status: statusEnum.optional(),
  healthcheckEnabled: z.boolean().optional(),
  lastCheckStatus: z.string().max(20).nullable().optional(),
  lastCheckedAt: z.coerce.date().nullable().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
};

export const createUrlBodySchema = z.object({
  label: z.string().min(1).max(255),
  ...baseFields,
});

export const updateUrlBodySchema = z.object({
  label: z.string().min(1).max(255).optional(),
  url: baseFields.url.optional(),
  urlType: baseFields.urlType.optional(),
  description: baseFields.description,
  method: baseFields.method,
  authRequired: baseFields.authRequired,
  authMethod: baseFields.authMethod,
  status: baseFields.status,
  healthcheckEnabled: baseFields.healthcheckEnabled,
  lastCheckStatus: baseFields.lastCheckStatus,
  lastCheckedAt: baseFields.lastCheckedAt,
  tags: baseFields.tags,
  metadata: baseFields.metadata,
});

export const setUrlStatusBodySchema = z.object({
  status: statusEnum,
});

export const urlIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const bulkDeleteBodySchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
});

export const listUrlsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: statusEnum.optional(),
  urlType: urlTypeEnum.optional(),
  tags: z.string().transform((str) => str.split(',')).optional(),
  search: z.string().optional(),
});
