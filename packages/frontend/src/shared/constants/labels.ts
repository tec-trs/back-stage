export const LIFECYCLE_LABELS: Record<string, string> = {
  production: 'Producao',
  experimental: 'Experimental',
  deprecated: 'Descontinuado',
};

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  maintainer: 'Mantenedor',
  viewer: 'Visualizador',
};

export const SERVER_TYPE_LABELS: Record<string, string> = {
  vm: 'Maquina Virtual',
  bare_metal: 'Bare Metal',
  container_host: 'Container Host',
  kubernetes_node: 'No Kubernetes',
  serverless: 'Serverless',
  managed_cloud: 'Nuvem Gerenciada',
};

export const PROVIDER_LABELS: Record<string, string> = {
  on_premise: 'On-premise',
  aws: 'AWS',
  azure: 'Azure',
  gcp: 'Google Cloud',
  oracle_cloud: 'Oracle Cloud',
  own_datacenter: 'Datacenter Proprio',
};

export const SERVER_STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  maintenance: 'Manutencao',
  provisioning: 'Provisionando',
  deactivated: 'Desativado',
};

export const ENVIRONMENT_LABELS: Record<string, string> = {
  production: 'Producao',
  staging: 'Staging',
  development: 'Desenvolvimento',
  dr: 'DR',
  sandbox: 'Sandbox',
};

export const DISK_TYPE_LABELS: Record<string, string> = {
  ssd: 'SSD',
  hdd: 'HDD',
  nvme: 'NVMe',
};

export const DISK_PURPOSE_LABELS: Record<string, string> = {
  system: 'Sistema',
  data: 'Dados',
  log: 'Log',
  backup: 'Backup',
};

export const APP_TYPE_LABELS: Record<string, string> = {
  web_app: 'Aplicacao Web',
  api_backend: 'API / Backend',
  mobile: 'Mobile',
  batch_job: 'Batch/Job',
  microservice: 'Microsservico',
  monolith: 'Monolito',
  internal_library: 'Biblioteca Interna',
  middleware: 'Middleware/Integracao',
};

export const CRITICALITY_LABELS: Record<string, string> = {
  critical: 'Critica',
  high: 'Alta',
  medium: 'Media',
  low: 'Baixa',
};

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  developing: 'Em desenvolvimento',
  active: 'Ativa',
  maintenance: 'Manutencao',
  deprecated: 'Descontinuada',
  deactivated: 'Desativada',
};

function translateWith(map: Record<string, string>, value: string): string {
  return map[value] ?? value;
}

export function translateLifecycle(lifecycle: string): string {
  return translateWith(LIFECYCLE_LABELS, lifecycle);
}

export function translateRole(role: string): string {
  return translateWith(ROLE_LABELS, role);
}

export function translateServerType(type: string): string {
  return translateWith(SERVER_TYPE_LABELS, type);
}

export function translateProvider(provider: string): string {
  return translateWith(PROVIDER_LABELS, provider);
}

export function translateServerStatus(status: string): string {
  return translateWith(SERVER_STATUS_LABELS, status);
}

export function translateEnvironment(environment: string): string {
  return translateWith(ENVIRONMENT_LABELS, environment);
}

export function translateDiskType(type: string): string {
  return translateWith(DISK_TYPE_LABELS, type);
}

export function translateDiskPurpose(purpose: string): string {
  return translateWith(DISK_PURPOSE_LABELS, purpose);
}

export function translateAppType(type: string): string {
  return translateWith(APP_TYPE_LABELS, type);
}

export function translateCriticality(criticality: string): string {
  return translateWith(CRITICALITY_LABELS, criticality);
}

export function translateApplicationStatus(status: string): string {
  return translateWith(APPLICATION_STATUS_LABELS, status);
}
