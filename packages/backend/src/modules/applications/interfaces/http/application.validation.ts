import { z } from 'zod';

const appTypeEnum = z.string().min(1).max(50).regex(/^[a-z0-9_-]+$/, 'tipo de aplicacao invalido');
const criticalityEnum = z.enum(['critical', 'high', 'medium', 'low']);
const statusEnum = z.enum(['developing', 'active', 'maintenance', 'deprecated', 'deactivated']);
const environmentEnum = z.string().min(1).max(50).regex(/^[a-z0-9_-]+$/, 'ambiente invalido');

const codeSchema = z
  .string()
  .min(3)
  .max(100)
  .regex(/^[a-z0-9._-]+$/, 'codigo deve conter apenas letras minusculas, numeros, ponto, hifen e underscore');

const deploymentSchema = z.object({
  serverId: z.string().uuid(),
  environment: environmentEnum,
  deployMethod: z.string().max(50).nullable().optional(),
  accessUrl: z.string().url().max(2048).nullable().optional(),
  ports: z.array(z.string()).optional(),
  deployedVersion: z.string().max(50).nullable().optional(),
});

const baseFields = {
  displayName: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  appType: appTypeEnum,
  businessCategory: z.string().max(255).nullable().optional(),
  criticality: criticalityEnum.optional(),
  status: statusEnum.optional(),
  language: z.string().max(100).nullable().optional(),
  framework: z.string().max(100).nullable().optional(),
  currentVersion: z.string().max(50).nullable().optional(),
  repositoryUrl: z.string().url().max(2048).nullable().optional(),
  cicdUrl: z.string().url().max(2048).nullable().optional(),
  containerImage: z.string().max(512).nullable().optional(),
  dataClassification: z.string().max(50).nullable().optional(),
  authMethod: z.string().max(50).nullable().optional(),
  ownerTeam: z.string().max(255).nullable().optional(),
  ownerUserId: z.string().uuid().nullable().optional(),
  costCenter: z.string().max(100).nullable().optional(),
  monthlyCostEstimate: z.coerce.number().nonnegative().nullable().optional(),
  docsUrl: z.string().url().max(2048).nullable().optional(),
  apiSpecUrl: z.string().url().max(2048).nullable().optional(),
  runbookUrl: z.string().url().max(2048).nullable().optional(),
  monitoringUrl: z.string().url().max(2048).nullable().optional(),
  sla: z.string().max(100).nullable().optional(),
  healthCheckUrl: z.string().url().max(2048).nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
  deployments: z.array(deploymentSchema).optional(),
  dependsOnIds: z.array(z.string().uuid()).optional(),
};

export const createApplicationBodySchema = z.object({
  code: codeSchema,
  ...baseFields,
});

export const updateApplicationBodySchema = z.object({
  code: codeSchema.optional(),
  ...baseFields,
  displayName: baseFields.displayName.optional(),
  appType: appTypeEnum.optional(),
});

export const setApplicationStatusBodySchema = z.object({
  status: statusEnum,
});

export const applicationIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listApplicationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: statusEnum.optional(),
  criticality: criticalityEnum.optional(),
  appType: appTypeEnum.optional(),
  search: z.string().optional(),
});
