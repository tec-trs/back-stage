import { z } from 'zod';

export const createServerGroupSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255),
  description: z.string().max(1000).optional(),
  environment: z.enum(['production', 'staging', 'development', 'dr', 'sandbox']).optional(),
  status: z.enum(['active', 'maintenance', 'inactive']).optional(),
  criticality: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  vipHostname: z.string().max(255).optional(),
  vipAddress: z.string().max(45).optional(),
  loadBalancerType: z.string().max(50).optional(),
  healthCheckInterval: z.number().int().min(1).optional(),
  healthCheckPath: z.string().max(255).optional(),
});

export const updateServerGroupSchema = createServerGroupSchema.partial();

export const addGroupMemberSchema = z.object({
  serverId: z.string().uuid('Server ID deve ser um UUID válido'),
  order: z.number().int().min(0).optional(),
});

export const groupIdParamSchema = z.object({
  groupId: z.string().uuid('Group ID deve ser um UUID válido'),
});

export const memberParamSchema = z.object({
  groupId: z.string().uuid('Group ID deve ser um UUID válido'),
  serverId: z.string().uuid('Server ID deve ser um UUID válido'),
});
