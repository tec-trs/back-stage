import { z } from 'zod';

const policyTypeEnum = z.enum(['security', 'cost', 'compliance', 'quality']);

export const createPolicyBodySchema = z.object({
  name: z.string().min(1).max(255),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9-]+$/, 'slug deve conter apenas letras minusculas, numeros e hifen'),
  description: z.string().nullable().optional(),
  policyType: policyTypeEnum,
  definition: z.string().min(1),
  isActive: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updatePolicyBodySchema = createPolicyBodySchema.partial();

export const policyIdParamsSchema = z.object({ id: z.string().uuid() });

export const listPoliciesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  policyType: policyTypeEnum.optional(),
  isActive: z.coerce.boolean().optional(),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const evaluateEntityParamsSchema = z.object({
  id: z.string().uuid(),
  entityId: z.string().uuid(),
});

export const createExemptionBodySchema = z.object({
  policyId: z.string().uuid(),
  entityId: z.string().uuid(),
  reason: z.string().min(1),
  expiresAt: z.coerce.date().optional(),
});

export const exemptionIdParamsSchema = z.object({ id: z.string().uuid() });

export const listExemptionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
});
