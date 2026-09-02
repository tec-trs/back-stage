import { z } from 'zod';

const RESOURCE_TYPES = ['server', 'application', 'database', 'url', 'vip'] as const;
const RELATION_TYPES = ['hosts', 'depends_on', 'connects_to', 'exposes', 'consumes', 'part_of'] as const;

export const createRelationshipRegistrationBodySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255),
  description: z.string().max(1000).nullable().optional(),
});

export const updateRelationshipRegistrationBodySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
});

export const addRelationshipBodySchema = z.object({
  sourceType: z.enum(RESOURCE_TYPES),
  sourceId: z.string().uuid(),
  sourceLabel: z.string().max(255).optional(),
  targetType: z.enum(RESOURCE_TYPES),
  targetId: z.string().uuid(),
  targetLabel: z.string().max(255).optional(),
  relationType: z.enum(RELATION_TYPES),
  reason: z.string().max(1000).nullable().optional(),
});

export const registrationIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const addRelationshipParamsSchema = z.object({
  registrationId: z.string().uuid(),
});

export const relationshipParamsSchema = z.object({
  registrationId: z.string().uuid(),
  relationshipId: z.string().uuid(),
});
