import { z } from 'zod';

export const createArchitectureDiagramBodySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  nodes: z.array(z.unknown()).optional(),
  edges: z.array(z.unknown()).optional(),
});

export const updateArchitectureDiagramBodySchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  nodes: z.array(z.unknown()).optional(),
  edges: z.array(z.unknown()).optional(),
});

export const architectureDiagramIdParamsSchema = z.object({
  id: z.string().uuid(),
});
