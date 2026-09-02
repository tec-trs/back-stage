import { z } from 'zod';

const engineEnum = z.string().min(1).max(50).regex(/^[a-z0-9_-]+$/, 'engine invalido');
const criticalityEnum = z.enum(['critical', 'high', 'medium', 'low']);
const statusEnum = z.enum(['active', 'maintenance', 'provisioning', 'deactivated', 'deprecated']);
const environmentEnum = z.string().min(1).max(50).regex(/^[a-z0-9_-]+$/, 'ambiente invalido');

const baseFields = {
  displayName: z.string().min(1).max(255).nullable().optional(),
  description: z.string().nullable().optional(),
  physicalName: z.string().max(255).nullable().optional(),
  logicalName: z.string().max(255).nullable().optional(),
  path: z.string().max(1024).nullable().optional(),
  engine: engineEnum,
  version: z.string().max(50).nullable().optional(),
  port: z.coerce.number().int().positive().nullable().optional(),
  hostedOnServerId: z.string().uuid().nullable().optional(),
  connectionHost: z.string().max(255).nullable().optional(),
  connectionStringTemplate: z.string().max(2048).nullable().optional(),
  isManagedService: z.boolean().optional(),
  dataClassification: z.string().max(50).nullable().optional(),
  criticality: criticalityEnum.optional(),
  ownerTeam: z.string().max(255).nullable().optional(),
  ownerUserId: z.string().uuid().nullable().optional(),
  costCenter: z.string().max(100).nullable().optional(),
  storageGb: z.coerce.number().int().nonnegative().nullable().optional(),
  replicationMode: z.string().max(50).nullable().optional(),
  hasBackup: z.boolean().optional(),
  backupPolicy: z.string().max(255).nullable().optional(),
  lastBackupAt: z.coerce.date().nullable().optional(),
  status: statusEnum.optional(),
  environment: environmentEnum,
  monitoringUrl: z.string().url().max(2048).nullable().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
};

export const createDatabaseBodySchema = z.object({
  name: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9._-]+$/i, 'nome deve conter apenas letras, numeros, ponto, hifen e underscore'),
  ...baseFields,
});

export const updateDatabaseBodySchema = z.object({
  name: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9._-]+$/i, 'nome deve conter apenas letras, numeros, ponto, hifen e underscore')
    .optional(),
  engine: baseFields.engine.optional(),
  displayName: baseFields.displayName,
  description: baseFields.description,
  physicalName: baseFields.physicalName,
  logicalName: baseFields.logicalName,
  path: baseFields.path,
  version: baseFields.version,
  port: baseFields.port,
  hostedOnServerId: baseFields.hostedOnServerId,
  connectionHost: baseFields.connectionHost,
  connectionStringTemplate: baseFields.connectionStringTemplate,
  isManagedService: baseFields.isManagedService,
  dataClassification: baseFields.dataClassification,
  criticality: baseFields.criticality,
  ownerTeam: baseFields.ownerTeam,
  ownerUserId: baseFields.ownerUserId,
  costCenter: baseFields.costCenter,
  storageGb: baseFields.storageGb,
  replicationMode: baseFields.replicationMode,
  hasBackup: baseFields.hasBackup,
  backupPolicy: baseFields.backupPolicy,
  lastBackupAt: baseFields.lastBackupAt,
  status: baseFields.status,
  monitoringUrl: baseFields.monitoringUrl,
  tags: baseFields.tags,
  metadata: baseFields.metadata,
});

export const setDatabaseStatusBodySchema = z.object({
  status: statusEnum,
});

export const databaseIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listDatabasesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: statusEnum.optional(),
  criticality: criticalityEnum.optional(),
  engine: engineEnum.optional(),
  environment: environmentEnum.optional(),
  tags: z.string().transform((str) => str.split(',')).optional(),
  search: z.string().optional(),
});

export const bulkDeleteDatabasesBodySchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

// Port management schemas
export const createDatabasePortBodySchema = z.object({
  port: z.coerce.number().int().min(1).max(65535),
  parameters: z.string().max(5000).nullable().optional(),
});

export const updateDatabasePortBodySchema = z.object({
  parameters: z.string().max(5000).nullable().optional(),
});

export const portIdParamsSchema = z.object({
  id: z.string().uuid(),
  portId: z.string().uuid(),
});
