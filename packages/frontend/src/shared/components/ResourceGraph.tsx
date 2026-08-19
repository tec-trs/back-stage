import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  BaseEdge,
  EdgeLabelRenderer,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  applyEdgeChanges,
  applyNodeChanges,
  getSmoothStepPath,
  useUpdateNodeInternals,
  type Connection,
  type Edge as RFEdge,
  type EdgeChange,
  type EdgeProps,
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

/* ── Position persistence (localStorage) ───────────────────────────────── */

type SavedPositions = Record<string, { x: number; y: number }>;

function loadPositions(key: string): SavedPositions {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as SavedPositions) : {};
  } catch {
    return {};
  }
}

function savePositions(key: string, nodes: RFNode[]): void {
  try {
    const positions: SavedPositions = {};
    for (const n of nodes) positions[n.id] = n.position;
    localStorage.setItem(key, JSON.stringify(positions));
  } catch {
    // ignore storage quota errors
  }
}

/* ── Dagre layout ───────────────────────────────────────────────────────── */

function layoutGraph(
  nodeIds: string[],
  edgePairs: { source: string; target: string; relationType: string }[],
): Map<string, { x: number; y: number }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = new (dagre as any).graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 70, ranksep: 120 });

  nodeIds.forEach((id) => g.setNode(id, { width: NODE_W, height: NODE_H }));

  // hosts/exposes: source provides to target → source ranks above target (correct TB)
  // depends_on/connects_to/consumes: source depends on target → invert so the
  //   provider (dependency) ranks above the consumer in the layout, keeping the
  //   visual hierarchy: infrastructure base at top, end services at bottom
  const DEPENDENCY_TYPES = new Set(['depends_on', 'connects_to', 'consumes']);
  edgePairs.forEach(({ source, target, relationType }) => {
    if (DEPENDENCY_TYPES.has(relationType)) {
      g.setEdge(target, source);
    } else {
      g.setEdge(source, target);
    }
  });

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
  editMode: boolean;
}

/* ── Custom edge (deletable) ────────────────────────────────────────────── */

interface DeletableEdgeData extends Record<string, unknown> {
  editMode?: boolean;
  isImplicit?: boolean;
  edgeLabel?: string;
  edgeLabelColor?: string;
  onDelete?: (id: string) => void;
}

function DeletableEdge({
  id,
  sourceX, sourceY, sourcePosition,
  targetX, targetY, targetPosition,
  style, markerEnd, animated, data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition,
  });
  const d = (data ?? {}) as DeletableEdgeData;
  const canDelete = d.editMode && !d.isImplicit;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd as string}
        style={{ ...style, animation: animated ? undefined : 'none' }}
        interactionWidth={20}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {d.editMode ? (
            canDelete ? (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); d.onDelete?.(id); }}
                className="flex h-5 w-5 items-center justify-center rounded-full border border-red-800 bg-red-950 text-red-400 text-xs leading-none shadow-md hover:bg-red-900 hover:text-red-200"
                title="Remover relacao"
              >
                ×
              </button>
            ) : (
              <span className="rounded border border-slate-800 bg-slate-900/80 px-1 py-0.5 text-[9px] text-slate-600">
                {d.edgeLabel}
              </span>
            )
          ) : d.edgeLabel ? (
            <span
              className="rounded text-[10px]"
              style={{ background: '#0f172a', opacity: 0.85, padding: '2px 4px', color: d.edgeLabelColor ?? '#94a3b8' }}
            >
              {d.edgeLabel}
            </span>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

const EDGE_TYPES = { deletable: DeletableEdge };

/* ── Edge builder ───────────────────────────────────────────────────────── */

interface PropEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationType: string;
}

interface BuildEdgeOpts {
  editMode?: boolean;
  onDelete?: (id: string) => void;
}

function buildEdge(
  e: PropEdge,
  impactedNodeIds: Set<string>,
  simulationSourceId?: string,
  opts?: BuildEdgeOpts,
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
  const isImplicit = e.id.startsWith('deploy:') || e.id.startsWith('url-owner:') || e.id.startsWith('edge-');

  return {
    id:     e.id,
    source: e.sourceId,
    target: e.targetId,
    type:   'deletable',
    animated,
    markerEnd: { type: MarkerType.ArrowClosed, color: stroke, width: 14, height: 14 },
    style: {
      stroke,
      strokeWidth: touchesSource || touchesImpact ? 2 : 1.5,
      opacity: isDimmed ? 0.08 : 1,
      transition: 'stroke 0.4s, opacity 0.4s',
    },
    data: {
      editMode:       !!opts?.editMode,
      isImplicit,
      edgeLabel:      EDGE_LABEL[e.relationType] ?? e.relationType,
      edgeLabelColor: isDimmed ? '#334155' : '#94a3b8',
      onDelete:       opts?.onDelete,
    } as DeletableEdgeData,
  };
}

/* ── Custom node component ──────────────────────────────────────────────── */

function ResourceNode({ data, selected, id }: NodeProps) {
  const d = data as NodeData;
  const updateNodeInternals = useUpdateNodeInternals();
  // Required in @xyflow/react v12 to populate handleBounds so edges render
  useEffect(() => { updateNodeInternals(id); }, [id, updateNodeInternals, d.editMode]);

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
        borderColor:  d.editMode ? '#3b82f6' : borderColor,
        borderWidth:  hasBoldBorder || d.editMode ? 2 : 1,
        opacity:      isDimmed ? 0.2 : 1,
        filter:       isDimmed ? 'grayscale(0.8)' : 'none',
        transition:   'opacity 0.4s ease, filter 0.4s ease, border-color 0.25s ease, background 0.4s ease, box-shadow 0.25s ease',
        boxShadow:    d.editMode ? '0 0 0 2px rgba(59,130,246,0.15)' : undefined,
        cursor:       d.editMode ? 'default' : 'pointer',
      }}
      className="rounded-lg border px-3 py-2 shadow-lg"
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background:  d.editMode ? '#3b82f6' : '#475569',
          border:      d.editMode ? '3px solid #93c5fd' : '2px solid #64748b',
          width:       d.editMode ? 20 : 8,
          height:      d.editMode ? 20 : 8,
          top:         d.editMode ? -10 : -4,
          boxShadow:   d.editMode ? '0 0 0 4px rgba(59,130,246,0.25)' : 'none',
          transition:  'all 0.25s',
          cursor:      d.editMode ? 'crosshair' : 'default',
          zIndex:      d.editMode ? 20 : 1,
        }}
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
        position={Position.Bottom}
        style={{
          background:  d.editMode ? '#3b82f6' : '#475569',
          border:      d.editMode ? '3px solid #93c5fd' : '2px solid #64748b',
          width:       d.editMode ? 20 : 8,
          height:      d.editMode ? 20 : 8,
          bottom:      d.editMode ? -10 : -4,
          boxShadow:   d.editMode ? '0 0 0 4px rgba(59,130,246,0.25)' : 'none',
          transition:  'all 0.25s',
          cursor:      d.editMode ? 'crosshair' : 'default',
          zIndex:      d.editMode ? 20 : 1,
        }}
      />
    </div>
  );
}

const NODE_TYPES = { resource: ResourceNode };

/* ── Props ──────────────────────────────────────────────────────────────── */

export interface ConnPayload {
  sourceId: string;
  sourceType: string;
  targetId: string;
  targetType: string;
}

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
  editMode?: boolean;
  onConnect?: (payload: ConnPayload) => void;
  onEdgeDelete?: (edgeId: string) => void;
  /** localStorage key for persisting node positions. Omit to disable persistence. */
  storageKey?: string;
  /** Increment to force a full dagre relayout, discarding saved positions. */
  resetLayoutKey?: number;
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
  editMode = false,
  onConnect,
  onEdgeDelete,
  storageKey,
  resetLayoutKey = 0,
}: ResourceGraphProps) {
  const [rfNodes, setRfNodes] = useState<RFNode<NodeData>[]>([]);
  const [rfEdges, setRfEdges] = useState<RFEdge[]>([]);

  // Stable refs so effects can read latest values without adding them as deps
  const editModeRef     = useRef(editMode);
  const onEdgeDeleteRef = useRef(onEdgeDelete);
  editModeRef.current     = editMode;
  onEdgeDeleteRef.current = onEdgeDelete;

  // Tracks the last resetLayoutKey we acted on; when it changes we skip saved positions
  const prevResetKeyRef = useRef(resetLayoutKey);

  // Impact key — stable string that changes only when the impacted set changes
  const impactedKey = useMemo(
    () => [...impactedNodeIds].sort().join(','),
    [impactedNodeIds],
  );

  // ── Effect 1: recompute layout when graph data or resetLayoutKey changes ─
  useEffect(() => {
    if (!propNodes.length) {
      setRfNodes([]);
      setRfEdges([]);
      return;
    }

    const posMap = layoutGraph(
      propNodes.map((n) => n.id),
      propEdges.map((e) => ({ source: e.sourceId, target: e.targetId, relationType: e.relationType })),
    );

    // Detect a layout reset request
    const isReset = resetLayoutKey !== prevResetKeyRef.current;
    if (isReset) {
      prevResetKeyRef.current = resetLayoutKey;
      if (storageKey) {
        try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
      }
    }

    // Restore saved positions for known nodes; use dagre for new ones
    const saved = (storageKey && !isReset) ? loadPositions(storageKey) : {};

    setRfNodes(
      propNodes.map((n) => ({
        id:       n.id,
        type:     'resource',
        position: saved[n.id] ?? posMap.get(n.id) ?? { x: 0, y: 0 },
        data: {
          label:            n.label,
          resourceType:     n.resourceType as RType,
          status:           n.status,
          impactDepth:      n.id === simulationSourceId ? 0 : impactedByDepth?.get(n.id),
          simulationActive: !!simulationSourceId,
          dbLabels:         n.dbLabels,
          editMode:         editModeRef.current,
        },
      })),
    );
    setRfEdges(propEdges.map((e) => buildEdge(e, impactedNodeIds, simulationSourceId, {
      editMode: editModeRef.current,
      onDelete: onEdgeDeleteRef.current,
    })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propNodes, propEdges, resetLayoutKey]);

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
    setRfEdges(propEdges.map((e) => buildEdge(e, impactedNodeIds, simulationSourceId, {
      editMode: editModeRef.current,
      onDelete: onEdgeDeleteRef.current,
    })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [impactedKey, simulationSourceId]);

  // ── Effect 3: propagate editMode / onEdgeDelete to existing nodes and edges ─
  useEffect(() => {
    if (!rfNodes.length) return;
    setRfNodes((prev) =>
      prev.map((n) => ({ ...n, data: { ...n.data, editMode } as NodeData })),
    );
    setRfEdges((prev) =>
      prev.map((e) => ({
        ...e,
        data: { ...e.data, editMode, onDelete: onEdgeDelete } as DeletableEdgeData,
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode, onEdgeDelete]);

  // Controlled mode handlers — dragging and pan both enabled
  const onNodesChange = useCallback(
    (changes: NodeChange<RFNode<NodeData>>[]) => {
      setRfNodes((prev) => {
        const next = applyNodeChanges(changes, prev);
        // Persist positions when the user finishes dragging a node
        if (storageKey && changes.some((c) => c.type === 'position' && !(c as { dragging?: boolean }).dragging)) {
          savePositions(storageKey, next);
        }
        return next;
      });
    },
    [storageKey],
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setRfEdges((prev) => applyEdgeChanges(changes, prev)),
    [],
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!onConnect || !connection.source || !connection.target) return;
      const src = rfNodes.find((n) => n.id === connection.source);
      const tgt = rfNodes.find((n) => n.id === connection.target);
      if (!src || !tgt) return;
      onConnect({
        sourceId:   connection.source,
        sourceType: (src.data as NodeData).resourceType,
        targetId:   connection.target,
        targetType: (tgt.data as NodeData).resourceType,
      });
    },
    [onConnect, rfNodes],
  );

  const isValidConnection = useCallback(
    (connection: Connection | RFEdge) => {
      if (connection.source === connection.target) return false;
      const src = rfNodes.find((n) => n.id === connection.source);
      const tgt = rfNodes.find((n) => n.id === connection.target);
      if (!src || !tgt) return false;
      const srcType = (src.data as NodeData).resourceType;
      const tgtType = (tgt.data as NodeData).resourceType;
      return srcType !== 'db-group' && tgtType !== 'db-group';
    },
    [rfNodes],
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
      onConnect={editMode ? handleConnect : undefined}
      isValidConnection={editMode ? isValidConnection : undefined}
      nodeTypes={NODE_TYPES}
      edgeTypes={EDGE_TYPES}
      fitView
      fitViewOptions={{ padding: 0.2, maxZoom: 1.2 }}
      minZoom={0.15}
      maxZoom={2.5}
      deleteKeyCode={null}
      connectionLineStyle={{ stroke: '#60a5fa', strokeWidth: 2, strokeDasharray: '5 4' }}
      className="bg-slate-950"
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#1e293b" variant={BackgroundVariant.Dots} gap={20} size={1.5} />
    </ReactFlow>
  );
}
