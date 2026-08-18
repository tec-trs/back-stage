import { z } from 'zod';

export const loginBodySchema = z.object({
  code: z.string().min(1).max(50),
  password: z.string().min(8),
});

export const selectOrgBodySchema = z.object({
  pendingToken: z.string().min(1),
  organizationId: z.string().uuid(),
});

export const switchOrgBodySchema = z.object({
  organizationId: z.string().uuid(),
});
