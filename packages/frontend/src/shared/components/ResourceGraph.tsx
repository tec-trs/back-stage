import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  applyEdgeChanges,
  applyNodeChanges,
  useUpdateNodeInternals,
  type Edge as RFEdge,
  type EdgeChange,
  type Node as RFNode,
  type NodeChange,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import dagre from 'dagre';

/* ── Constants ─────────────────────────────────────────────────────────── */

const NODE_W = 180;
const NODE_H = 68;

const TYPE_STYLE = {
  server:      { bg: '#0d1f33', border: '#3b82f6', text: '#93c5fd' },
  application: { bg: '#160d36', border: '#8b5cf6', text: '#c4b5fd' },
  database:    { bg: '#250820', border: '#ec4899', text: '#f9a8d4' },
  url:         { bg: '#221100', border: '#f59e0b', text: '#fcd34d' },
  'db-group':  { bg: '#1a0a1e', border: '#a855f7', text: '#d8b4fe' },
} as const;

// Impact palette — infra-manager view: red = offline, orange = direct hit, amber = downstream
const IMPACT_STYLE = {
  source:   { bg: '#450a0a', border: '#ef4444', text: '#fca5a5' },
  direct:   { bg: '#431407', border: '#f97316', text: '#fed7aa' },
  indirect: { bg: '#1c1003', border: '#f59e0b', text: '#fcd34d' },
} as const;

type RType = keyof typeof TYPE_STYLE;

const EDGE_LABEL: Record<string, string> = {
  hosts:       'hospeda',
  depends_on:  'depende',
  connects_to: 'conecta',
  exposes:     'expos',
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
  g.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 100 });

  nodeIds.forEach((id) => g.setNode(id, { width: NODE_W, height: NODE_H }));
  // Natural direction: server→application→url, so servers rank leftmost in LR layout
  edgePairs.forEach(({ source, target }) => g.setEdge(source, target));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (dagre as any).layout(g);

  const posMap = new Map<string, { x: number; y: number }>();
  nodeIds.forEach((id) => {
    const pos = g.node(id);
    posMap.set(id, { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 });
  });
  return posMap;
}

/* ── Node data ──────────────────────────────────────────────────────────── */

interface NodeData extends Record<string, unknown> {
  label: string;
  resourceType: RType;
  status?: string;
  /** depth=0 means this node is the offline source; undefined = not in blast radius */
  impactDepth: number | undefined;
  simulationActive: boolean;
  /** Only on db-group nodes */
  dbLabels?: string[];
}

/* ── Edge builder ───────────────────────────────────────────────────────── */

interface PropEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationType: string;
}

function buildEdge(
  e: PropEdge,
  impactedNodeIds: Set<string>,
  simulationSourceId?: string,
): RFEdge {
  const touchesSource = e.sourceId === simulationSourceId || e.targetId === simulationSourceId;
  const touchesImpact = impactedNodeIds.has(e.sourceId) || impactedNodeIds.has(e.targetId);
  const simulationActive = !!simulationSourceId;

  let stroke: string;
  let animated: boolean;
  if (touchesSource) {
    stroke = '#ef4444';
    animated = true;
  } else if (touchesImpact) {
    stroke = '#f59e0b';
    animated = true;
  } else {
    stroke = '#334155';
    animated = false;
  }

  const isDimmed = simulationActive && !touchesSource && !touchesImpact;

  return {
    id:     e.id,
    source: e.sourceId,
    target: e.targetId,
    label:  EDGE_LABEL[e.relationType] ?? e.relationType,
    type:   'smoothstep',
    animated,
    markerEnd: { type: MarkerType.ArrowClosed, color: stroke, width: 14, height: 14 },
    style: {
      stroke,
      strokeWidth: touchesSource || touchesImpact ? 2 : 1.5,
      opacity: isDimmed ? 0.08 : 1,
      transition: 'stroke 0.4s, opacity 0.4s',
    },
    labelStyle:      { fill: isDimmed ? '#334155' : '#94a3b8', fontSize: 10 },
    labelBgStyle:    { fill: '#0f172a', fillOpacity: isDimmed ? 0.3 : 0.85 },
    labelBgPadding:  [4, 2] as [number, number],
    labelBgBorderRadius: 3,
  };
}

/* ── Custom node component ──────────────────────────────────────────────── */

function ResourceNode({ data, selected, id }: NodeProps) {
  const d = data as NodeData;
  const updateNodeInternals = useUpdateNodeInternals();
  // Required in @xyflow/react v12 to populate handleBounds so edges render
  useEffect(() => { updateNodeInternals(id); }, [id, updateNodeInternals]);

  const isOffline   = d.impactDepth === 0;
  const isDirect    = d.impactDepth === 1;
  const isIndirect  = d.impactDepth !== undefined && d.impactDepth >= 2;
  const isImpacted  = isDirect || isIndirect;
  const isDimmed    = d.simulationActive && d.impactDepth === undefined;

  let palette: { bg: string; border: string; text: string };
  if (isOffline)       palette = IMPACT_STYLE.source;
  else if (isDirect)   palette = IMPACT_STYLE.direct;
  else if (isIndirect) palette = IMPACT_STYLE.indirect;
  else                 palette = TYPE_STYLE[d.resourceType] ?? TYPE_STYLE.server;

  const borderColor   = selected ? '#f1f5f9' : palette.border;
  const hasBoldBorder = selected || isOffline || isImpacted;

  return (
    <div
      style={{
        width:        NODE_W,
        background:   palette.bg,
        borderColor,
        borderWidth:  hasBoldBorder ? 2 : 1,
        opacity:      isDimmed ? 0.2 : 1,
        filter:       isDimmed ? 'grayscale(0.8)' : 'none',
        transition:   'opacity 0.4s ease, filter 0.4s ease, border-color 0.4s ease, background 0.4s ease',
      }}
      className="rounded-lg border px-3 py-2 shadow-lg cursor-pointer"
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#64748b', border: 'none', width: 8, height: 8 }}
      />

      {/* Type badge / offline label */}
      <div className="flex items-center gap-1.5 mb-0.5">
        {d.resourceType === 'db-group' ? (
          <>
            <span className="text-[11px]">🗄</span>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: palette.text }}>
              Bancos
            </span>
          </>
        ) : isOffline ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-red-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-red-400 animate-pulse">
              OFFLINE
            </span>
          </>
        ) : (
          <>
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: palette.border }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: palette.text }}>
              {d.resourceType}
            </span>
          </>
        )}
      </div>

      {/* Node label */}
      <p
        className="text-sm font-semibold leading-snug"
        style={{ color: palette.text, maxWidth: NODE_W - 28 }}
      >
        {d.label}
      </p>

      {/* DB group: list of database names */}
      {d.resourceType === 'db-group' && d.dbLabels && (
        <div className="mt-1 flex flex-col gap-0.5">
          {d.dbLabels.slice(0, 3).map((name, i) => (
            <span key={i} className="text-[10px] text-slate-400 truncate">• {name}</span>
          ))}
          {d.dbLabels.length > 3 && (
            <span className="text-[10px] text-slate-500">+{d.dbLabels.length - 3} mais</span>
          )}
        </div>
      )}

      {/* Impact depth hint */}
      {isDirect && d.resourceType !== 'db-group' && (
        <p className="text-[10px] mt-0.5 font-medium text-orange-400">impacto direto</p>
      )}
      {isIndirect && d.resourceType !== 'db-group' && (
        <p className="text-[10px] mt-0.5 text-amber-500">{d.impactDepth}° nivel</p>
      )}
      {!isOffline && !isImpacted && d.status && d.resourceType !== 'db-group' && (
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

/* ── Props ──────────────────────────────────────────────────────────────── */

interface ResourceGraphProps {
  nodes: Array<{
    id: string;
    resourceType: 'server' | 'application' | 'database' | 'url' | 'db-group';
    label: string;
    status?: string;
    criticality?: string;
    dbLabels?: string[];
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
  /** IDs of nodes in the impact blast radius (not including the source itself) */
  impactedNodeIds?: Set<string>;
  /** Depth of each impacted node (resourceId → depth, where depth ≥ 1) */
  impactedByDepth?: Map<string, number>;
  /** The node currently being simulated as offline */
  simulationSourceId?: string;
  onNodeSelect?: (nodeId: string, resourceType: string) => void;
  onNodeNavigate?: (nodeId: string, resourceType: string) => void;
  isLoading?: boolean;
}

/* ── Main component ─────────────────────────────────────────────────────── */

export function ResourceGraph({
  nodes: propNodes,
  edges: propEdges,
  impactedNodeIds = new Set(),
  impactedByDepth,
  simulationSourceId,
  onNodeSelect,
  onNodeNavigate,
  isLoading = false,
}: ResourceGraphProps) {
  const [rfNodes, setRfNodes] = useState<RFNode<NodeData>[]>([]);
  const [rfEdges, setRfEdges] = useState<RFEdge[]>([]);

  // Impact key — stable string that changes only when the impacted set changes
  const impactedKey = useMemo(
    () => [...impactedNodeIds].sort().join(','),
    [impactedNodeIds],
  );

  // ── Effect 1: recompute layout when graph data changes ──────────────────
  useEffect(() => {
    if (!propNodes.length) {
      setRfNodes([]);
      setRfEdges([]);
      return;
    }
    const posMap = layoutGraph(
      propNodes.map((n) => n.id),
      propEdges.map((e) => ({ source: e.sourceId, target: e.targetId })),
    );
    setRfNodes(
      propNodes.map((n) => ({
        id:       n.id,
        type:     'resource',
        position: posMap.get(n.id) ?? { x: 0, y: 0 },
        data: {
          label:           n.label,
          resourceType:    n.resourceType as RType,
          status:          n.status,
          impactDepth:     n.id === simulationSourceId ? 0 : impactedByDepth?.get(n.id),
          simulationActive: !!simulationSourceId,
          dbLabels:        n.dbLabels,
        },
      })),
    );
    setRfEdges(propEdges.map((e) => buildEdge(e, impactedNodeIds, simulationSourceId)));
    // Layout only re-runs when the graph topology changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propNodes, propEdges]);

  // ── Effect 2: update colors/states when simulation changes (no relayout) ─
  useEffect(() => {
    setRfNodes((prev) =>
      prev.map((n) => ({
        ...n,
        data: {
          ...n.data,
          impactDepth:      n.id === simulationSourceId ? 0 : impactedByDepth?.get(n.id),
          simulationActive: !!simulationSourceId,
          // dbLabels preserved from spread above
        } as NodeData,
      })),
    );
    setRfEdges(propEdges.map((e) => buildEdge(e, impactedNodeIds, simulationSourceId)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [impactedKey, simulationSourceId]);

  // Controlled mode handlers — dragging and pan both enabled
  const onNodesChange = useCallback(
    (changes: NodeChange<RFNode<NodeData>>[]) =>
      setRfNodes((prev) => applyNodeChanges(changes, prev)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setRfEdges((prev) => applyEdgeChanges(changes, prev)),
    [],
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
    <ReactFlow
      nodes={rfNodes}
      edges={rfEdges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
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
      <Background color="#1e293b" variant={BackgroundVariant.Dots} gap={20} size={1.5} />
    </ReactFlow>
  );
}
