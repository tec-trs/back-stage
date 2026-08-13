import { z } from 'zod';

const serverTypeEnum = z.enum([
  'vm',
  'bare_metal',
  'container_host',
  'kubernetes_node',
  'serverless',
  'managed_cloud',
]);
const providerEnum = z.enum([
  'on_premise',
  'aws',
  'azure',
  'gcp',
  'oracle_cloud',
  'own_datacenter',
]);
const statusEnum = z.enum(['active', 'maintenance', 'provisioning', 'deactivated']);
const environmentEnum = z.enum(['production', 'staging', 'development', 'dr', 'sandbox']);
const diskTypeEnum = z.enum(['ssd', 'hdd', 'nvme']);
const diskPurposeEnum = z.enum(['system', 'data', 'log', 'backup']);

const hostnameSchema = z
  .string()
  .min(1)
  .max(255)
  .regex(/^[a-z0-9.-]+$/, 'hostname deve conter apenas letras minusculas, numeros, ponto e hifen');

const diskSchema = z.object({
  mountPoint: z.string().min(1).max(255),
  capacityGb: z.coerce.number().int().positive(),
  diskType: diskTypeEnum,
  purpose: diskPurposeEnum,
});

const baseFields = {
  displayName: z.string().max(255).nullable().optional(),
  description: z.string().nullable().optional(),
  serverType: serverTypeEnum,
  provider: providerEnum,
  cpuCores: z.coerce.number().int().positive().nullable().optional(),
  cpuModel: z.string().max(255).nullable().optional(),
  ramGb: z.coerce.number().int().positive().nullable().optional(),
  hypervisor: z.string().max(100).nullable().optional(),
  osName: z.string().max(100).nullable().optional(),
  osVersion: z.string().max(100).nullable().optional(),
  osArchitecture: z.string().max(20).nullable().optional(),
  osEolDate: z.string().max(10).nullable().optional(),
  privateIps: z.array(z.string()).optional(),
  publicIp: z.string().max(100).nullable().optional(),
  vlanSubnet: z.string().max(100).nullable().optional(),
  gateway: z.string().max(100).nullable().optional(),
  dnsServers: z.array(z.string()).optional(),
  accessMethod: z.string().max(50).nullable().optional(),
  securityGroup: z.string().max(255).nullable().optional(),
  dataClassification: z.string().max(50).nullable().optional(),
  status: statusEnum.optional(),
  environment: environmentEnum,
  ownerTeam: z.string().max(255).nullable().optional(),
  ownerUserId: z.string().uuid().nullable().optional(),
  costCenter: z.string().max(100).nullable().optional(),
  hasBackup: z.boolean().optional(),
  backupPolicy: z.string().max(255).nullable().optional(),
  monthlyCostEstimate: z.coerce.number().nonnegative().nullable().optional(),
  monitoringUrl: z.string().url().max(2048).nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
  disks: z.array(diskSchema).optional(),
};

export const createServerBodySchema = z.object({
  hostname: hostnameSchema,
  ...baseFields,
});

export const updateServerBodySchema = z.object({
  hostname: hostnameSchema.optional(),
  ...baseFields,
  serverType: serverTypeEnum.optional(),
  provider: providerEnum.optional(),
  environment: environmentEnum.optional(),
});

export const setServerStatusBodySchema = z.object({
  status: statusEnum,
});

export const serverIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listServersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: statusEnum.optional(),
  environment: environmentEnum.optional(),
  provider: providerEnum.optional(),
  search: z.string().optional(),
});
