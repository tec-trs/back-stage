import { useMemo, useState } from 'react';
import * as Dagre from 'dagre';
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

const NODE_WIDTH = 180;
const NODE_HEIGHT = 60;

interface LayoutNode extends GraphNode {
  x: number;
  y: number;
  isRoot: boolean;
}

function layoutGraph(nodes: GraphNode[], edges: GraphEdge[], rootNodeId?: string): LayoutNode[] {
  const g = new Dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: 'LR',
    nodesep: 50,
    ranksep: 100,
    marginx: 40,
    marginy: 40,
  });

  // Adicionar nós
  nodes.forEach((node) => {
    g.setNode(node.id, {
      label: node.label,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    });
  });

  // Adicionar arestas
  edges.forEach((edge) => {
    g.setEdge(edge.sourceId, edge.targetId);
  });

  // Executar layout
  Dagre.layout(g);

  // Extrair posições
  const layoutNodes: LayoutNode[] = [];
  g.nodes().forEach((nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    const dagNode = g.node(nodeId);
    if (node && dagNode) {
      layoutNodes.push({
        ...node,
        x: dagNode.x,
        y: dagNode.y,
        isRoot: nodeId === rootNodeId,
      });
    }
  });

  return layoutNodes;
}

export function DependencyGraphVizualizer({ nodes, edges, rootNodeId }: Props) {
  const [zoom, setZoom] = useState(1);

  const layoutNodes = useMemo(() => {
    return layoutGraph(nodes, edges, rootNodeId);
  }, [nodes, edges, rootNodeId]);

  const bounds = useMemo(() => {
    if (layoutNodes.length === 0) {
      return { minX: 0, minY: 0, maxX: 800, maxY: 600 };
    }

    const minX = Math.min(...layoutNodes.map((n) => n.x - NODE_WIDTH / 2)) - 40;
    const maxX = Math.max(...layoutNodes.map((n) => n.x + NODE_WIDTH / 2)) + 40;
    const minY = Math.min(...layoutNodes.map((n) => n.y - NODE_HEIGHT / 2)) - 40;
    const maxY = Math.max(...layoutNodes.map((n) => n.y + NODE_HEIGHT / 2)) + 40;

    return { minX, minY, maxX, maxY };
  }, [layoutNodes]);

  const svgWidth = bounds.maxX - bounds.minX;
  const svgHeight = bounds.maxY - bounds.minY;

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
          viewBox={`${bounds.minX} ${bounds.minY} ${svgWidth} ${svgHeight}`}
          className="bg-slate-950"
        >
          {/* Defs para seta */}
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

          {/* Arestas */}
          {edges.map((edge) => {
            const sourceNode = layoutNodes.find((n) => n.id === edge.sourceId);
            const targetNode = layoutNodes.find((n) => n.id === edge.targetId);

            if (!sourceNode || !targetNode) return null;

            const x1 = sourceNode.x + NODE_WIDTH / 2;
            const y1 = sourceNode.y;
            const x2 = targetNode.x - NODE_WIDTH / 2;
            const y2 = targetNode.y;

            return (
              <line
                key={`edge-${edge.id}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#64748b"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />
            );
          })}

          {/* Nós */}
          {layoutNodes.map((node) => {
            const color = NODE_COLORS[node.resourceType] || '#6b7280';
            const borderColor = node.isRoot ? '#2563eb' : color;
            const borderWidth = node.isRoot ? 3 : 2;

            return (
              <g key={`node-${node.id}`}>
                <rect
                  x={node.x - NODE_WIDTH / 2}
                  y={node.y - NODE_HEIGHT / 2}
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  fill={color}
                  stroke={borderColor}
                  strokeWidth={borderWidth}
                  rx="8"
                />
                <text
                  x={node.x}
                  y={node.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="13"
                  fontWeight={node.isRoot ? 'bold' : '500'}
                  pointerEvents="none"
                >
                  {node.label.length > 25 ? node.label.substring(0, 22) + '...' : node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
