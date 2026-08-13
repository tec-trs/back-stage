import { z } from 'zod';

const roleEnum = z.enum(['admin', 'maintainer', 'viewer']);

export const createUserBodySchema = z.object({
  email: z.string().email().max(255),
  fullName: z.string().min(1).max(255),
  password: z.string().min(8).max(255),
  roles: z.array(roleEnum).min(1),
});

export const updateUserBodySchema = z.object({
  email: z.string().email().max(255).optional(),
  fullName: z.string().min(1).max(255).optional(),
  roles: z.array(roleEnum).min(1).optional(),
});

export const userIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
});
