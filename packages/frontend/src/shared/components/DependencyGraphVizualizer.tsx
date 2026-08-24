import { useMemo, useState } from 'react';
import type { GraphNode, GraphEdge } from '../../features/resource-graph/use-resource-graph';

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
  rootNodeId?: string;
}

const NODE_COLORS: Record<string, string> = {
  server: '#3b82f6',
  application: '#8b5cf6',
  database: '#ec4899',
  url: '#f59e0b',
  vip: '#06b6d4',
};

interface LayoutNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  resourceType: string;
  isRoot: boolean;
}

function calculateLayout(nodes: GraphNode[], edges: GraphEdge[], rootNodeId?: string): LayoutNode[] {
  const nodeWidth = 160;
  const nodeHeight = 50;
  const horizontalSpacing = 250;
  const verticalSpacing = 80;

  // BFS para calcular profundidade
  const depths = new Map<string, number>();
  const visited = new Set<string>();
  const queue: { id: string; depth: number }[] = [];

  const rootId = rootNodeId || nodes[0]?.id;
  if (rootId) {
    queue.push({ id: rootId, depth: 0 });
    depths.set(rootId, 0);
  }

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    edges
      .filter((e) => e.sourceId === id)
      .forEach((edge) => {
        if (!visited.has(edge.targetId)) {
          depths.set(edge.targetId, depth + 1);
          queue.push({ id: edge.targetId, depth: depth + 1 });
        }
      });
  }

  // Agrupar nós por profundidade
  const nodesByDepth = new Map<number, string[]>();
  nodes.forEach((node) => {
    const depth = depths.get(node.id) ?? nodes.length;
    if (!nodesByDepth.has(depth)) {
      nodesByDepth.set(depth, []);
    }
    nodesByDepth.get(depth)!.push(node.id);
  });

  // Calcular posições
  const layoutNodes: LayoutNode[] = [];
  nodesByDepth.forEach((nodeIds, depth) => {
    const x = depth * horizontalSpacing;
    nodeIds.forEach((nodeId, index) => {
      const node = nodes.find((n) => n.id === nodeId)!;
      const y = index * verticalSpacing - ((nodeIds.length - 1) * verticalSpacing) / 2;

      layoutNodes.push({
        id: nodeId,
        x,
        y,
        width: nodeWidth,
        height: nodeHeight,
        label: node.label,
        resourceType: node.resourceType,
        isRoot: nodeId === rootNodeId,
      });
    });
  });

  return layoutNodes;
}

export function DependencyGraphVizualizer({ nodes, edges, rootNodeId }: Props) {
  const [zoom, setZoom] = useState(1);

  const layoutNodes = useMemo(() => {
    return calculateLayout(nodes, edges, rootNodeId);
  }, [nodes, edges, rootNodeId]);

  const svgWidth = useMemo(() => {
    const maxDepth = Math.max(...layoutNodes.map((n) => n.x)) + 200;
    return Math.max(800, maxDepth);
  }, [layoutNodes]);

  const svgHeight = useMemo(() => {
    const maxY = Math.max(...layoutNodes.map((n) => n.y + n.height / 2));
    const minY = Math.min(...layoutNodes.map((n) => n.y - n.height / 2));
    return Math.max(600, maxY - minY + 100);
  }, [layoutNodes]);

  return (
    <div className="w-full h-full flex flex-col bg-slate-950">
      <div className="flex gap-4 items-center p-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-400">Nós: {nodes.length}</label>
          <label className="text-sm text-slate-400 ml-4">Relações: {edges.length}</label>
        </div>

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
            className="px-3 py-1 bg-slate-700 text-slate-200 rounded text-sm hover:bg-slate-600"
          >
            −
          </button>
          <span className="text-sm text-slate-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
            className="px-3 py-1 bg-slate-700 text-slate-200 rounded text-sm hover:bg-slate-600"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-950">
        <svg
          width={svgWidth * zoom}
          height={svgHeight * zoom}
          style={{ minWidth: '100%', minHeight: '100%' }}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        >
          {/* Arestas */}
          {edges.map((edge) => {
            const sourceNode = layoutNodes.find((n) => n.id === edge.sourceId);
            const targetNode = layoutNodes.find((n) => n.id === edge.targetId);

            if (!sourceNode || !targetNode) return null;

            const x1 = sourceNode.x + sourceNode.width / 2;
            const y1 = sourceNode.y;
            const x2 = targetNode.x - targetNode.width / 2;
            const y2 = targetNode.y;

            return (
              <g key={`edge-${edge.id}`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#64748b"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
              </g>
            );
          })}

          {/* Marcador de seta */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#64748b" />
            </marker>
          </defs>

          {/* Nós */}
          {layoutNodes.map((node) => {
            const color = NODE_COLORS[node.resourceType] || '#6b7280';
            const borderColor = node.isRoot ? '#2563eb' : color;
            const borderWidth = node.isRoot ? 3 : 2;

            return (
              <g key={`node-${node.id}`}>
                <rect
                  x={node.x - node.width / 2}
                  y={node.y - node.height / 2}
                  width={node.width}
                  height={node.height}
                  fill={color}
                  stroke={borderColor}
                  strokeWidth={borderWidth}
                  rx="6"
                />
                <text
                  x={node.x}
                  y={node.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight={node.isRoot ? 'bold' : 'normal'}
                  textLength={node.width - 20}
                  lengthAdjust="spacingAndGlyphs"
                >
                  {node.label.substring(0, 20)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
