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

export function translateLifecycle(lifecycle: string): string {
  return LIFECYCLE_LABELS[lifecycle] ?? lifecycle;
}

export function translateRole(role: string): string {
  return ROLE_LABELS[role] ?? role;
}
