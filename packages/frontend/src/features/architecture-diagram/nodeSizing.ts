import type { ResourceType } from './types';

export interface NodeServiceSummary {
  name: string;
  status: string;
}

// Lightweight services (servers.services) rendered nested inside a server's
// node — not independent graph resources, just metadata shown so the diagram
// communicates what runs on a server without adding edges for them.
export const MAX_VISIBLE_NODE_SERVICES = 6;
const SERVICES_NODE_WIDTH = 176;
const BASE_NODE_WIDTH = 120;
const BASE_NODE_HEIGHT = 76;
const SERVICES_BLOCK_HEADER = 14;
const SERVICE_ROW_HEIGHT = 20;

/**
 * Footprint a server node needs once its services are rendered nested inside
 * it, for the dagre layout pass to reserve enough room. Kept in its own
 * module (rather than alongside the component) so ResourceNodeWithIcon.tsx
 * only exports the component, per react-refresh/only-export-components; both
 * LiveArchitectureGraph and the Mapa graph import this rather than guessing
 * dimensions themselves.
 */
export function getResourceNodeSize(
  resourceType: ResourceType,
  services?: NodeServiceSummary[] | null,
): { width: number; height: number } {
  const list = resourceType === 'server' ? services ?? [] : [];
  if (list.length === 0) return { width: BASE_NODE_WIDTH, height: BASE_NODE_HEIGHT };

  const visibleRows = Math.min(list.length, MAX_VISIBLE_NODE_SERVICES) + (list.length > MAX_VISIBLE_NODE_SERVICES ? 1 : 0);
  return {
    width: SERVICES_NODE_WIDTH,
    height: BASE_NODE_HEIGHT + SERVICES_BLOCK_HEADER + visibleRows * SERVICE_ROW_HEIGHT,
  };
}
