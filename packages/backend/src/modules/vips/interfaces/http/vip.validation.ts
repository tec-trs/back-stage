import { z } from 'zod';

export const createVIPSchema = z.object({
  hostname: z.string().min(1, 'Hostname é obrigatório').max(255),
  displayName: z.string().max(255).optional(),
  description: z.string().max(1000).optional(),
  vipAddress: z.string().max(45).optional(),
  loadBalancerType: z.string().max(50).optional(),
  healthCheckInterval: z.number().int().min(1).optional(),
  healthCheckPath: z.string().max(255).optional(),
  status: z.enum(['active', 'maintenance', 'inactive']).optional(),
  environment: z.string().max(50).optional(),
  criticality: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  ownerTeam: z.string().max(255).optional(),
  ownerUserId: z.string().uuid().optional(),
  costCenter: z.string().max(100).optional(),
});

export const updateVIPSchema = createVIPSchema.partial();

export const addServerSchema = z.object({
  serverId: z.string().uuid('Server ID deve ser um UUID válido'),
  order: z.number().int().min(0).optional(),
});

export const vipIdParamSchema = z.object({
  id: z.string().uuid('VIP ID deve ser um UUID válido'),
});

export const vipServerParamSchema = z.object({
  id: z.string().uuid('VIP ID deve ser um UUID válido'),
  serverId: z.string().uuid('Server ID deve ser um UUID válido'),
});
