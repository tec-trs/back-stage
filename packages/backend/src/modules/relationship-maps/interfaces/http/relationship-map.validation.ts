import { z } from 'zod';

export const createRelationshipMapSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255),
  description: z.string().max(1000).optional(),
});

export const updateRelationshipMapSchema = createRelationshipMapSchema.partial();

export const attachRelationshipSchema = z.object({
  relationshipId: z.string().uuid('relationshipId deve ser um UUID válido'),
});

export const mapIdParamSchema = z.object({
  mapId: z.string().uuid('mapId deve ser um UUID válido'),
});

export const mapRelationshipParamSchema = z.object({
  mapId: z.string().uuid('mapId deve ser um UUID válido'),
  relationshipId: z.string().uuid('relationshipId deve ser um UUID válido'),
});
