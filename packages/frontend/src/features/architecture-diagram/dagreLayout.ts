// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import dagre from 'dagre';

export const DIAGRAM_NODE_W = 120;
export const DIAGRAM_NODE_H = 76;

/**
 * Auto-arrange a set of xyflow nodes/edges left-to-right with dagre.
 *
 * rankdir=LR (not top-to-bottom) intentionally mirrors iTop's own
 * impact-analysis graph: it computes layout with GraphViz's `dot`, a
 * layered/Sugiyama-family algorithm — dagre is a JS port of the same
 * family — also run with rankdir=LR. Shared by the manual diagram editor
 * and the live, auto-generated CMDB graph so both read the same way.
 */
export function layoutWithDagre(
  nodes: { id: string; width?: number; height?: number }[],
  edges: { source: string; target: string }[],
  options: { nodeWidth?: number; nodeHeight?: number; nodesep?: number; ranksep?: number } = {},
): Map<string, { x: number; y: number }> {
  const { nodeWidth = DIAGRAM_NODE_W, nodeHeight = DIAGRAM_NODE_H, nodesep = 36, ranksep = 80 } = options;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = new (dagre as any).graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep, ranksep });
  // Nodes may carry their own width/height (e.g. a server grown taller to fit
  // nested services) — those override the uniform default so dagre reserves
  // enough room instead of overlapping taller nodes with their neighbors.
  nodes.forEach((n) => g.setNode(n.id, { width: n.width ?? nodeWidth, height: n.height ?? nodeHeight }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (dagre as any).layout(g);

  const positions = new Map<string, { x: number; y: number }>();
  nodes.forEach((n) => {
    const pos = g.node(n.id);
    const w = n.width ?? nodeWidth;
    const h = n.height ?? nodeHeight;
    positions.set(n.id, pos ? { x: pos.x - w / 2, y: pos.y - h / 2 } : { x: 0, y: 0 });
  });
  return positions;
}
