import { useMemo, useState } from 'react';
import { ReactFlow, Background } from '@xyflow/react';
import type { GraphNode, GraphEdge } from '../../features/resource-graph/use-resource-graph';

interface GroupedNode {
  id: string;
  type: 'group' | 'single';
  resourceType: string;
  label: string;
  count?: number;
  children?: GraphNode[];
  expanded: boolean;
}

interface VisualizerProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  rootNodeId?: string;
  onNodeSelect?: (nodeId: string, resourceType: string) => void;
}

const NODE_COLORS: Record<string, string> = {
  server: '#3b82f6',
  application: '#8b5cf6',
  database: '#ec4899',
  url: '#f59e0b',
  vip: '#06b6d4',
  'group': '#6b7280',
};

const NODE_ICONS: Record<string, string> = {
  server: '🖥️',
  application: '⚙️',
  database: '🗄️',
  url: '🌐',
  vip: '⚖️',
};

function useGroupedGraph(nodes: GraphNode[], groupingThreshold: number = 3) {
  return useMemo(() => {
    const groupedNodes: Record<string, GroupedNode> = {};
    const nodesByType: Record<string, GraphNode[]> = {};

    nodes.forEach((node) => {
      if (!nodesByType[node.resourceType]) {
        nodesByType[node.resourceType] = [];
      }
      nodesByType[node.resourceType].push(node);
    });

    let groupId = 0;
    const groupKeys = new Set<string>();
    nodes.forEach((node) => {
      const typeGroup = nodesByType[node.resourceType];
      if (typeGroup.length >= groupingThreshold) {
        const groupKey = `group-${node.resourceType}-${groupId}`;
        if (!groupKeys.has(groupKey)) {
          groupedNodes[groupKey] = {
            id: groupKey,
            type: 'group',
            resourceType: node.resourceType,
            label: `${node.resourceType}s`,
            count: typeGroup.length,
            children: typeGroup,
            expanded: false,
          };
          groupKeys.add(groupKey);
          groupId++;
        }
      } else if (!groupedNodes[node.id]) {
        groupedNodes[node.id] = {
          id: node.id,
          type: 'single',
          resourceType: node.resourceType,
          label: node.label,
          expanded: false,
          children: [node],
        };
      }
    });

    return { groupedNodes, nodesByType };
  }, [nodes, groupingThreshold]);
}

function cascadeLayout(
  nodes: Map<string, any>,
  edges: GraphEdge[],
  rootNodeId?: string,
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const visited = new Set<string>();
  const queue: { id: string; depth: number; index: number }[] = [];

  const rootId = rootNodeId || nodes.keys().next().value;
  if (rootId) {
    queue.push({ id: rootId, depth: 0, index: 0 });
  }

  while (queue.length > 0) {
    const { id, depth, index } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const x = depth * 250;
    const y = index * 100;
    positions.set(id, { x, y });

    const outgoingEdges = edges.filter((e) => e.sourceId === id);
    outgoingEdges.forEach((edge, idx) => {
      if (!visited.has(edge.targetId)) {
        queue.push({ id: edge.targetId, depth: depth + 1, index: idx });
      }
    });
  }

  return positions;
}

export function DependencyFlowVisualizer({
  nodes,
  edges,
  rootNodeId,
}: VisualizerProps) {
  const [groupingThreshold, setGroupingThreshold] = useState(3);
  const [expandedGroups] = useState<Set<string>>(new Set());
  const { groupedNodes } = useGroupedGraph(nodes, groupingThreshold);

  const rfNodes = useMemo(() => {
    const result: Array<any> = [];
    Object.values(groupedNodes).forEach((gn) => {
      const isExpanded = expandedGroups.has(gn.id);

      if (gn.type === 'group' && isExpanded && gn.children) {
        gn.children.forEach((child, idx) => {
          result.push({
            id: child.id,
            data: {
              label: `${NODE_ICONS[child.resourceType] || '📦'} ${child.label}`,
            },
            position: { x: 0, y: idx * 80 },
            style: {
              background: NODE_COLORS[child.resourceType] || '#6b7280',
              color: 'white',
              border: child.id === rootNodeId ? '3px solid #2563eb' : '2px solid #1e293b',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '12px',
              fontWeight: '500',
              minWidth: '140px',
            },
          });
        });
      } else if (gn.type === 'group') {
        result.push({
          id: gn.id,
          data: { label: `${gn.count || 0} ${gn.resourceType}s` },
          position: { x: 0, y: 0 },
          style: {
            background: NODE_COLORS[gn.resourceType] || '#6b7280',
            color: 'white',
            border: gn.id === rootNodeId ? '3px solid #2563eb' : '2px solid #1e293b',
            borderRadius: '50%',
            width: '80px',
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
          },
        });
      } else {
        result.push({
          id: gn.id,
          data: { label: `${NODE_ICONS[gn.resourceType] || '📦'} ${gn.label}` },
          position: { x: 0, y: 0 },
          style: {
            background: NODE_COLORS[gn.resourceType] || '#6b7280',
            color: 'white',
            border: gn.id === rootNodeId ? '3px solid #2563eb' : '2px solid #1e293b',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '12px',
            fontWeight: '500',
            minWidth: '140px',
          },
        });
      }
    });
    return result;
  }, [groupedNodes, rootNodeId, expandedGroups]);

  const rfEdges = useMemo(() => {
    return edges.map((edge) => ({
      id: edge.id,
      source: edge.sourceId,
      target: edge.targetId,
      animated: true,
      style: { stroke: '#64748b', strokeWidth: 2 },
      markerEnd: { type: 'arrowclosed' as const, color: '#64748b' },
    }));
  }, [edges]);

  const positionedNodes = useMemo(() => {
    const nodeMap = new Map(rfNodes.map((n) => [n.id, n]));
    const positions = cascadeLayout(nodeMap, edges, rootNodeId);
    return rfNodes.map((node) => {
      const pos = positions.get(node.id);
      return { ...node, position: pos || node.position };
    });
  }, [rfNodes, edges, rootNodeId]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex gap-4 items-center p-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-400">Limite de agrupamento:</label>
          <input
            type="number"
            min="2"
            max="20"
            value={groupingThreshold}
            onChange={(e) => setGroupingThreshold(Math.max(2, parseInt(e.target.value, 10)))}
            className="w-16 px-2 py-1 rounded bg-slate-800 text-slate-100 text-sm border border-slate-700"
          />
        </div>
        <div className="text-xs text-slate-500">
          {positionedNodes.length} nós · {rfEdges.length} relações
        </div>
        <div className="ml-auto text-xs text-slate-500">
          💡 Clique em grupos para expandir/colapsar
        </div>
      </div>

      <div className="flex-1 relative">
        <ReactFlow
          nodes={positionedNodes}
          edges={rfEdges}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
}
