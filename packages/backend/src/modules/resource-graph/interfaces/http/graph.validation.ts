import { z } from 'zod';

const resourceTypeEnum = z.enum(['server', 'application', 'database', 'url']);
const relationTypeEnum = z.enum(['hosts', 'depends_on', 'connects_to', 'exposes', 'consumes', 'part_of']);
const criticality = z.enum(['critical', 'high', 'medium', 'low']);

export const getFullGraphQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(20),
  resourceTypes: z.string().transform((s) => s.split(',')).optional(),
  environment: z.string().optional(),
  criticality: criticality.optional(),
  status: z.string().optional(),
});

export const getSubgraphParamsSchema = z.object({
  type: resourceTypeEnum,
  id: z.string().uuid(),
});

export const getSubgraphQuerySchema = z.object({
  depth: z.coerce.number().int().min(1).max(10).default(2),
  direction: z.enum(['upstream', 'downstream', 'both']).default('both'),
  relationType: relationTypeEnum.optional(),
});

export const simulateImpactBodySchema = z.object({
  resourceType: resourceTypeEnum,
  resourceId: z.string().uuid(),
  maxDepth: z.coerce.number().int().min(1).max(20).default(10).optional(),
});

export const createRelationshipBodySchema = z.object({
  sourceType: resourceTypeEnum,
  sourceId: z.string().uuid(),
  targetType: resourceTypeEnum,
  targetId: z.string().uuid(),
  relationType: relationTypeEnum,
  metadata: z.record(z.unknown()).optional(),
  reason: z.string().max(500).optional(),
});

export const deleteRelationshipParamsSchema = z.object({
  relationshipId: z.string().uuid(),
});

export const listRelationshipsQuerySchema = z.object({
  sourceType: resourceTypeEnum.optional(),
  sourceId: z.string().uuid().optional(),
  targetType: resourceTypeEnum.optional(),
  targetId: z.string().uuid().optional(),
  relationType: relationTypeEnum.optional(),
});
