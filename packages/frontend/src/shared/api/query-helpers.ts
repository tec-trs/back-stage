import type { Query } from '@tanstack/react-query';

/**
 * Creates a predicate function for invalidating queries by their first key element.
 * @param keys Array of query key names to invalidate
 * @returns Predicate function for use with queryClient.invalidateQueries()
 */
export function createQueryKeyPredicate(keys: string[]) {
  return (query: Query) => keys.includes(String(query.queryKey[0]));
}

/**
 * Predicate for invalidating resource graph related queries
 */
export const resourceGraphQueryPredicate = createQueryKeyPredicate([
  'resource-graph',
  'resource-graph-subgraph',
  'resource-graph-all-relationships',
  'resource-graph-relationships',
  'resource-graph-critical-resources',
  'dependency-graph',
  'applications',
  'servers',
  'urls',
]);

/**
 * Predicate for invalidating URL related queries
 */
export const urlQueryPredicate = createQueryKeyPredicate([
  'urls',
  'resource-graph',
  'resource-graph-subgraph',
]);

/**
 * Predicate for invalidating server related queries
 */
export const serverQueryPredicate = createQueryKeyPredicate([
  'servers',
  'resource-graph',
  'resource-graph-subgraph',
]);
