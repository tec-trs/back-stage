/**
 * Ecosystem Graph Types
 *
 * Type definitions for the ecosystem visualization feature.
 * Matches the backend EcosystemGraph schema from ecosystem-graph.repository.ts
 */

/**
 * Represents a node in the ecosystem graph
 * Can be either a server or an application
 */
export interface EcosystemNode {
  id: string;
  kind: 'server' | 'application';
  type: string;
  name: string;
  title?: string;
  lifecycle: string;
}

/**
 * Represents an edge (relationship) between two nodes in the ecosystem graph
 */
export interface EcosystemEdge {
  id: string;
  source: string;
  target: string;
  relationType: 'hosts' | 'dependsOn';
}

/**
 * Response wrapper for ecosystem graph data
 * Contains nodes and edges that make up the complete ecosystem visualization
 */
export interface EcosystemGraphResponse {
  nodes: EcosystemNode[];
  edges: EcosystemEdge[];
}

/**
 * Query parameters for filtering ecosystem data
 */
export interface EcosystemFilters {
  resourceTypes?: string[];
  environment?: string;
  page?: number;
  pageSize?: number;
}
