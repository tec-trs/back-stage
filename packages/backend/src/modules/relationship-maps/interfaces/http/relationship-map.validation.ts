import { z } from 'zod';

const MAP_RESOURCE_TYPES = ['server', 'application', 'database', 'url', 'vip'] as const;
const RELATION_TYPES = ['hosts', 'depends_on', 'connects_to', 'exposes', 'consumes', 'part_of'] as const;

export const createRelationshipMapSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255),
  description: z.string().max(1000).optional(),
});

export const updateRelationshipMapSchema = createRelationshipMapSchema.partial();

// A relationship can be attached either by the id of a real resource_relationships
// row, or — for a type the CMDB derives elsewhere instead of storing its own row
// (e.g. "hosts" servidor->aplicacao, "expoe" ->url) — by its natural key.
const attachExplicitRelationshipSchema = z.object({
  relationshipId: z.string().uuid('relationshipId deve ser um UUID válido'),
});

const attachImplicitRelationshipSchema = z.object({
  sourceType: z.enum(MAP_RESOURCE_TYPES),
  sourceId: z.string().uuid('sourceId deve ser um UUID válido'),
  targetType: z.enum(MAP_RESOURCE_TYPES),
  targetId: z.string().uuid('targetId deve ser um UUID válido'),
  relationType: z.enum(RELATION_TYPES),
});

export const attachRelationshipSchema = z.union([attachExplicitRelationshipSchema, attachImplicitRelationshipSchema]);

export const mapIdParamSchema = z.object({
  mapId: z.string().uuid('mapId deve ser um UUID válido'),
});

export const mapMemberParamSchema = z.object({
  mapId: z.string().uuid('mapId deve ser um UUID válido'),
  memberId: z.string().uuid('memberId deve ser um UUID válido'),
});
