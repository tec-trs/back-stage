// Shared vocabulary for real resource-to-resource relationships
// (`resource_relationships` rows, created through POST /api/resource-graph/relationships).
// Used by the "+ Relacionamento" dialog (AddRelationshipDialog) and by the manual
// Architecture Diagram editor, which can create/edit/delete the same real
// relationships when the user connects two catalog-linked nodes.
//
// Keep this in sync with the backend enums in
// packages/backend/src/modules/resource-graph/interfaces/http/graph.validation.ts
// (resourceTypeEnum, relationTypeEnum). The backend also accepts 'vip' and
// 'group' as resource types, but no UI here creates relationships for those
// yet, so they're intentionally left out of RESOURCE_TYPES.

export type ResourceType = 'server' | 'application' | 'database' | 'url';

export type RelationType = 'hosts' | 'depends_on' | 'connects_to' | 'exposes' | 'consumes' | 'part_of';

export const RESOURCE_TYPES: Array<{ value: ResourceType; label: string }> = [
  { value: 'server', label: 'Servidor' },
  { value: 'application', label: 'Aplicacao' },
  { value: 'database', label: 'Banco de Dados' },
  { value: 'url', label: 'URL' },
];

export const RELATION_TYPES: Array<{ value: RelationType; label: string; description: string }> = [
  { value: 'hosts', label: 'Hospeda', description: 'Ex: Servidor hospeda banco de dados' },
  { value: 'depends_on', label: 'Depende de', description: 'Ex: Aplicacao depende de banco' },
  { value: 'connects_to', label: 'Conecta a', description: 'Ex: Aplicacao conecta a outra' },
  { value: 'exposes', label: 'Expoe', description: 'Ex: Aplicacao expoe URL/endpoint' },
  { value: 'consumes', label: 'Consome', description: 'Ex: Aplicacao consome servico externo' },
  { value: 'part_of', label: 'Parte de', description: 'Ex: Microsservico e parte de sistema' },
];

export function relationTypeLabel(relationType: string | undefined): string {
  return RELATION_TYPES.find((r) => r.value === relationType)?.label ?? relationType ?? '';
}

// A resource type qualifies for a *real* relationship only when it's one of
// the catalog types the resource-graph API understands. Architecture-diagram
// nodes of type 'service' or 'vip' are either lightweight metadata (servers.services,
// not a graph node at all) or not yet wired to this flow, so they're excluded.
export function isRelationshipCapableResourceType(resourceType: string | undefined): resourceType is ResourceType {
  return RESOURCE_TYPES.some((t) => t.value === resourceType);
}
