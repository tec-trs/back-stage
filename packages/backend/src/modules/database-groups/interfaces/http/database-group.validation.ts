import { z } from 'zod';

export const createDatabaseGroupSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255),
  description: z.string().max(1000).optional(),
});

export const updateDatabaseGroupSchema = createDatabaseGroupSchema.partial();

export const addMemberSchema = z.object({
  databaseId: z.string().uuid('databaseId deve ser um UUID válido'),
});

export const addApplicationLinkSchema = z.object({
  applicationId: z.string().uuid('applicationId deve ser um UUID válido'),
});

export const groupIdParamSchema = z.object({
  groupId: z.string().uuid('groupId deve ser um UUID válido'),
});

export const groupMemberParamSchema = z.object({
  groupId: z.string().uuid('groupId deve ser um UUID válido'),
  memberId: z.string().uuid('memberId deve ser um UUID válido'),
});

export const groupApplicationLinkParamSchema = z.object({
  groupId: z.string().uuid('groupId deve ser um UUID válido'),
  linkId: z.string().uuid('linkId deve ser um UUID válido'),
});
