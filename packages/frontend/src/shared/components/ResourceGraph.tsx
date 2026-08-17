import { useCallback, useEffect, useMemo } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  useUpdateNodeInternals,
  type Edge as RFEdge,
  type Node as RFNode,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import dagre from 'dagre';

/* ── Constants ─────────────────────────────────────────────────────────── */

const NODE_W = 180;
const NODE_H = 64;

const TYPE_STYLE = {
  server:      { bg: '#0d1f33', border: '#3b82f6', text: '#93c5fd' },
  application: { bg: '#160d36', border: '#8b5cf6', text: '#c4b5fd' },
  database:    { bg: '#250820', border: '#ec4899', text: '#f9a8d4' },
  url:         { bg: '#221100', border: '#f59e0b', text: '#fcd34d' },
} as const;

type RType = keyof typeof TYPE_STYLE;

const EDGE_LABEL: Record<string, string> = {
  hosts:       'hospeda',
  depends_on:  'depende',
  connects_to: 'conecta',
  exposes:     'expõe',
  consumes:    'consome',
  part_of:     'parte de',
};

/* ── Dagre layout ───────────────────────────────────────────────────────── */

function layoutGraph(
  nodeIds: string[],
  edgePairs: { source: string; target: string }[],
): Map<string, { x: number; y: number }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = new (dagre as any).graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 55, ranksep: 90 });

  nodeIds.forEach((id) => g.setNode(id, { width: NODE_W, height: NODE_H }));

  // Foundational nodes (servers that others depend_on) go LEFT; dependents RIGHT
  edgePairs.forEach(({ source, target }) => g.setEdge(target, source));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (dagre as any).layout(g);

  const posMap = new Map<string, { x: number; y: number }>();
  nodeIds.forEach((id) => {
    const pos = g.node(id);
    posMap.set(id, { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 });
  });
  return posMap;
}

/* ── Custom node component ──────────────────────────────────────────────── */

interface NodeData extends Record<string, unknown> {
  label: string;
  resourceType: RType;
  status?: string;
  isImpacted: boolean;
}

function ResourceNode({ data, selected, id }: NodeProps) {
  const d = data as NodeData;
  const s = TYPE_STYLE[d.resourceType] ?? TYPE_STYLE.server;
  const updateNodeInternals = useUpdateNodeInternals();
  // Force handle-bounds registration on mount (required in @xyflow/react v12)
  useEffect(() => { updateNodeInternals(id); }, [id, updateNodeInternals]);

  return (
    <div
      style={{
        width: NODE_W,
        background: d.isImpacted ? `${s.border}22` : s.bg,
        borderColor: selected ? '#f1f5f9' : d.isImpacted ? s.border : `${s.border}99`,
        borderWidth: selected || d.isImpacted ? 2 : 1,
      }}
      className="rounded-lg border px-3 py-2 shadow-lg cursor-pointer"
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#64748b', border: 'none', width: 8, height: 8 }}
      />

      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.border }} />
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: s.text }}>
          {d.resourceType}
        </span>
      </div>

      <p className="text-sm font-semibold text-slate-100 leading-snug" style={{ maxWidth: NODE_W - 28 }}>
        {d.label}
      </p>

      {d.status && (
        <p className="text-[10px] text-slate-500 mt-0.5 capitalize">{d.status}</p>
      )}

      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#64748b', border: 'none', width: 8, height: 8 }}
      />
    </div>
  );
}

const NODE_TYPES = { resource: ResourceNode };

/* ── Main component ─────────────────────────────────────────────────────── */

interface ResourceGraphProps {
  nodes: Array<{
    id: string;
    resourceType: 'server' | 'application' | 'database' | 'url';
    label: string;
    status?: string;
    criticality?: string;
  }>;
  edges: Array<{
    id: string;
    sourceType: string;
    sourceId: string;
    targetType: string;
    targetId: string;
    relationType: string;
  }>;
  mode?: 'overview' | 'subgraph' | 'impact';
  impactedNodeIds?: Set<string>;
  onNodeSelect?: (nodeId: string, resourceType: string) => void;
  onNodeNavigate?: (nodeId: string, resourceType: string) => void;
  isLoading?: boolean;
}

export function ResourceGraph({
  nodes: propNodes,
  edges: propEdges,
  impactedNodeIds = new Set(),
  onNodeSelect,
  onNodeNavigate,
  isLoading = false,
}: ResourceGraphProps) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const impactedKey = useMemo(() => [...impactedNodeIds].sort().join(','), [impactedNodeIds]);

  const defaultNodes = useMemo<RFNode<NodeData>[]>(() => {
    if (!propNodes.length) return [];
    const posMap = layoutGraph(
      propNodes.map((n) => n.id),
      propEdges.map((e) => ({ source: e.sourceId, target: e.targetId })),
    );
    return propNodes.map((n) => ({
      id: n.id,
      type: 'resource',
      position: posMap.get(n.id) ?? { x: 0, y: 0 },
      data: {
        label: n.label,
        resourceType: n.resourceType as RType,
        status: n.status,
        isImpacted: impactedNodeIds.has(n.id),
      },
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propNodes, propEdges, impactedKey]);

  const defaultEdges = useMemo<RFEdge[]>(
    () =>
      propEdges.map((e) => {
        const isLit = impactedNodeIds.has(e.sourceId) || impactedNodeIds.has(e.targetId);
        return {
          id: e.id,
          source: e.sourceId,
          target: e.targetId,
          label: EDGE_LABEL[e.relationType] ?? e.relationType,
          type: 'smoothstep',
          animated: isLit,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isLit ? '#f59e0b' : '#475569',
            width: 14,
            height: 14,
          },
          style: { stroke: isLit ? '#f59e0b' : '#475569', strokeWidth: 1.5 },
          labelStyle: { fill: '#94a3b8', fontSize: 10 },
          labelBgStyle: { fill: '#0f172a', fillOpacity: 0.85 },
          labelBgPadding: [4, 2] as [number, number],
          labelBgBorderRadius: 3,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [propEdges, impactedKey],
  );

  const onNodeClick = useCallback(
    (_e: React.MouseEvent, node: RFNode) => {
      onNodeSelect?.(node.id, (node.data as NodeData).resourceType);
    },
    [onNodeSelect],
  );

  const onNodeDoubleClick = useCallback(
    (_e: React.MouseEvent, node: RFNode) => {
      onNodeNavigate?.(node.id, (node.data as NodeData).resourceType);
    },
    [onNodeNavigate],
  );

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-t-transparent border-blue-500 animate-spin" />
          <p className="text-sm text-slate-400">Carregando grafo...</p>
        </div>
      </div>
    );
  }

  return (
    // key forces remount when data first arrives so defaultNodes/defaultEdges are used
    <ReactFlow
      key={propNodes.length > 0 ? 'loaded' : 'empty'}
      defaultNodes={defaultNodes}
      defaultEdges={defaultEdges}
      onNodeClick={onNodeClick}
      onNodeDoubleClick={onNodeDoubleClick}
      nodeTypes={NODE_TYPES}
      fitView
      fitViewOptions={{ padding: 0.2, maxZoom: 1.2 }}
      minZoom={0.15}
      maxZoom={2.5}
      className="bg-slate-950"
      proOptions={{ hideAttribution: true }}
    >
      <Background
        color="#1e293b"
        variant={BackgroundVariant.Dots}
        gap={20}
        size={1.5}
      />
      <Controls
        style={{ background: '#1e293b', border: '1px solid #334155' }}
        showInteractive={false}
      />
      <MiniMap
        nodeColor={(node) => {
          const s = TYPE_STYLE[(node.data as NodeData)?.resourceType];
          return s?.border ?? '#475569';
        }}
        maskColor="#0f172acc"
        style={{ background: '#1e293b', border: '1px solid #334155' }}
      />
    </ReactFlow>
  );
}
