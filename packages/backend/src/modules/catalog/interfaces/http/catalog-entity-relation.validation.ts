import { z } from 'zod';

export const createRelationSchema = z.object({
  sourceEntityId: z.string().uuid('sourceEntityId deve ser um UUID válido'),
  targetEntityId: z.string().uuid('targetEntityId deve ser um UUID válido'),
  relationType: z.enum(['dependsOn', 'dependencyOf', 'partOf', 'hasPart', 'providesApi', 'consumesApi']),
  metadata: z.record(z.unknown()).optional(),
});

export const deleteRelationParamsSchema = z.object({
  sourceId: z.string().uuid('sourceId deve ser um UUID válido'),
  targetId: z.string().uuid('targetId deve ser um UUID válido'),
  relationType: z.enum(['dependsOn', 'dependencyOf', 'partOf', 'hasPart', 'providesApi', 'consumesApi']),
});

export const getRelationsBySourceParamsSchema = z.object({
  sourceId: z.string().uuid('sourceId deve ser um UUID válido'),
});

export const getRelationsByTargetParamsSchema = z.object({
  targetId: z.string().uuid('targetId deve ser um UUID válido'),
});
