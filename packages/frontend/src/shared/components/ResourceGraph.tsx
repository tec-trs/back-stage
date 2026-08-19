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

const NODE_W_COMPACT = 130;
const NODE_H_COMPACT = 48;

const NODE_W_EXPANDED = 180;
const NODE_H_EXPANDED = 68;

// Server-container layout constants
const SERVER_HEADER_H = 60; // height of the server header inside the container
const INNER_PAD       = 12; // padding inside server container
const SERVER_SPACING  = 16; // gap between server containers within a group
const GROUP_PAD       = 24; // padding inside group container
const GROUP_LABEL_H   = 28; // height of the group label area

const TYPE_STYLE = {
  server:         { bg: '#0d1f33', border: '#3b82f6', text: '#93c5fd' },
  application:    { bg: '#160d36', border: '#8b5cf6', text: '#c4b5fd' },
  database:       { bg: '#250820', border: '#ec4899', text: '#f9a8d4' },
  url:            { bg: '#221100', border: '#f59e0b', text: '#fcd34d' },
  'db-group':     { bg: '#1a0a1e', border: '#a855f7', text: '#d8b4fe' },
  'server-group': { bg: 'transparent', border: '#3b82f6', text: '#93c5fd' },
} as const;

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

/* ── Dagre layout (supports custom per-node sizes) ──────────────────────── */

function layoutGraph(
  nodes: { id: string; width?: number; height?: number }[],
  edgePairs: { source: string; target: string; relationType: string }[],
  compactMode = false,
): Map<string, { x: number; y: number }> {
  const NODE_W = compactMode ? NODE_W_COMPACT : NODE_W_EXPANDED;
  const NODE_H = compactMode ? NODE_H_COMPACT : NODE_H_EXPANDED;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = new (dagre as any).graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 100 });

  nodes.forEach(({ id, width = NODE_W, height = NODE_H }) =>
    g.setNode(id, { width, height }),
  );

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
  nodes.forEach(({ id, width = NODE_W, height = NODE_H }) => {
    const pos = g.node(id);
    if (pos) posMap.set(id, { x: pos.x - width / 2, y: pos.y - height / 2 });
  });
  return posMap;
}

/* ── Node data ──────────────────────────────────────────────────────────── */

interface NodeData extends Record<string, unknown> {
  label: string;
  resourceType: RType;
  status?: string;
  impactDepth: number | undefined;
  simulationActive: boolean;
  dbLabels?: string[];
  editMode: boolean;
  compactMode?: boolean;
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
            pointerEvents: canDelete ? 'all' : 'none',
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

/* ── Custom node: resource ──────────────────────────────────────────────── */

const TYPE_ICON: Record<string, string> = {
  server:      '🖥',
  application: '⚙',
  database:    '🗄',
  url:         '🌐',
  'db-group':  '📦',
};

function ResourceNode({ data, selected, id }: NodeProps) {
  const d = data as NodeData;
  const updateNodeInternals = useUpdateNodeInternals();
  useEffect(() => { updateNodeInternals(id); }, [id, updateNodeInternals, d.editMode, d.compactMode]);

  const isOffline  = d.impactDepth === 0;
  const isDirect   = d.impactDepth === 1;
  const isIndirect = d.impactDepth !== undefined && d.impactDepth >= 2;
  const isImpacted = isDirect || isIndirect;
  const isDimmed   = d.simulationActive && d.impactDepth === undefined;

  let palette: { bg: string; border: string; text: string };
  if (isOffline)       palette = IMPACT_STYLE.source;
  else if (isDirect)   palette = IMPACT_STYLE.direct;
  else if (isIndirect) palette = IMPACT_STYLE.indirect;
  else                 palette = TYPE_STYLE[d.resourceType] ?? TYPE_STYLE.server;

  const borderColor   = selected ? '#f1f5f9' : palette.border;
  const hasBoldBorder = selected || isOffline || isImpacted;

  const NODE_W = d.editMode ? NODE_W_EXPANDED : (d.compactMode ? NODE_W_COMPACT : NODE_W_EXPANDED);

  return (
    <div
      style={{
        width:        NODE_W,
        padding:      d.compactMode ? '6px 8px' : '12px',
        background:   palette.bg,
        borderColor:  d.editMode ? '#3b82f6' : borderColor,
        borderWidth:  hasBoldBorder || d.editMode ? 2 : 1,
        opacity:      isDimmed ? 0.2 : 1,
        filter:       isDimmed ? 'grayscale(0.8)' : 'none',
        transition:   'opacity 0.4s ease, filter 0.4s ease, border-color 0.25s ease, background 0.4s ease, box-shadow 0.25s ease',
        boxShadow:    d.editMode ? '0 0 0 2px rgba(59,130,246,0.15)' : undefined,
        cursor:       d.editMode ? 'default' : 'pointer',
      }}
      className="rounded-lg border shadow-lg"
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

      {d.compactMode ? (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-lg leading-none">{TYPE_ICON[d.resourceType] ?? '•'}</span>
          <p
            className="text-[9px] font-bold uppercase tracking-wider text-center"
            style={{ color: palette.text, maxWidth: NODE_W - 12 }}
            title={d.label}
          >
            {d.label.length > 12 ? d.label.substring(0, 10) + '…' : d.label}
          </p>
        </div>
      ) : (
        <>
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

          <p
            className="text-sm font-semibold leading-snug"
            style={{ color: palette.text, maxWidth: NODE_W - 28 }}
          >
            {d.label}
          </p>

          {d.resourceType === 'db-group' && d.dbLabels && (
            <div className="mt-1 flex flex-col gap-0.5">
              {d.dbLabels.slice(0, 2).map((name, i) => (
                <span key={i} className="text-[10px] text-slate-400 truncate">• {name}</span>
              ))}
              {d.dbLabels.length > 2 && (
                <span className="text-[10px] text-slate-500">+{d.dbLabels.length - 2} mais</span>
              )}
            </div>
          )}

          {isDirect && d.resourceType !== 'db-group' && (
            <p className="text-[10px] mt-0.5 font-medium text-orange-400">impacto direto</p>
          )}
          {isIndirect && d.resourceType !== 'db-group' && (
            <p className="text-[10px] mt-0.5 text-amber-500">{d.impactDepth}° nivel</p>
          )}
          {!isOffline && !isImpacted && d.status && d.resourceType !== 'db-group' && (
            <p className="text-[10px] text-slate-500 mt-0.5 capitalize">{d.status}</p>
          )}
        </>
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

/* ── Custom node: server-container (server hosting apps) ────────────────── */

function ServerContainerNode({ data, id }: NodeProps) {
  const d = data as NodeData;
  const updateNodeInternals = useUpdateNodeInternals();
  useEffect(() => { updateNodeInternals(id); }, [id, updateNodeInternals, d.editMode]);

  const palette = TYPE_STYLE.server;

  return (
    <div
      style={{
        width:        '100%',
        height:       '100%',
        background:   'rgba(13, 31, 51, 0.85)',
        border:       `2px dashed ${palette.border}`,
        borderRadius: 8,
        boxSizing:    'border-box',
        position:     'relative',
      }}
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
          transition:  'all 0.25s',
          cursor:      d.editMode ? 'crosshair' : 'default',
          zIndex:      20,
        }}
      />

      {/* Server header */}
      <div
        style={{
          padding:      '8px 10px 6px',
          borderBottom: '1px solid rgba(59,130,246,0.20)',
          height:       SERVER_HEADER_H,
          boxSizing:    'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: palette.border, flexShrink: 0 }} />
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.text }}>
            server
          </span>
        </div>
        <p style={{
          fontSize:     13,
          fontWeight:   600,
          color:        palette.text,
          marginTop:    2,
          lineHeight:   1.2,
          overflow:     'hidden',
          textOverflow: 'ellipsis',
          whiteSpace:   'nowrap',
        }}>
          {d.label}
        </p>
        {d.status && (
          <p style={{ fontSize: 10, color: '#64748b', marginTop: 1, textTransform: 'capitalize' }}>
            {d.status}
          </p>
        )}
      </div>

      {/* Children (app nodes) are placed here by ReactFlow */}

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background:  d.editMode ? '#3b82f6' : '#475569',
          border:      d.editMode ? '3px solid #93c5fd' : '2px solid #64748b',
          width:       d.editMode ? 20 : 8,
          height:      d.editMode ? 20 : 8,
          bottom:      d.editMode ? -10 : -4,
          transition:  'all 0.25s',
          cursor:      d.editMode ? 'crosshair' : 'default',
          zIndex:      20,
        }}
      />
    </div>
  );
}

/* ── Custom node: server-group (outer displayGroup container) ───────────── */

function ServerGroupNode({ data }: NodeProps) {
  const d = data as NodeData;
  return (
    <div
      style={{
        width:        '100%',
        height:       '100%',
        position:     'relative',
        background:   'rgba(59, 130, 246, 0.04)',
        border:       '2px dashed rgba(59, 130, 246, 0.30)',
        borderRadius: 10,
        boxSizing:    'border-box',
      }}
    >
      <span
        style={{
          position:      'absolute',
          top:           8,
          left:          12,
          color:         '#93c5fd',
          fontSize:      10,
          fontWeight:    700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          userSelect:    'none',
          pointerEvents: 'none',
          whiteSpace:    'nowrap',
        }}
      >
        {d.label}
      </span>
    </div>
  );
}

const NODE_TYPES = {
  resource:           ResourceNode,
  'server-container': ServerContainerNode,
  'server-group':     ServerGroupNode,
};

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
    displayGroup?: string | null;
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
  impactedByDepth?: Map<string, number>;
  simulationSourceId?: string;
  onNodeSelect?: (nodeId: string, resourceType: string) => void;
  onNodeNavigate?: (nodeId: string, resourceType: string) => void;
  isLoading?: boolean;
  editMode?: boolean;
  compactMode?: boolean;
  onConnect?: (payload: ConnPayload) => void;
  onEdgeDelete?: (edgeId: string) => void;
  storageKey?: string;
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
  compactMode = false,
  onConnect,
  onEdgeDelete,
  storageKey,
  resetLayoutKey = 0,
}: ResourceGraphProps) {
  const [rfNodes, setRfNodes] = useState<RFNode<NodeData>[]>([]);
  const [rfEdges, setRfEdges] = useState<RFEdge[]>([]);

  const editModeRef     = useRef(editMode);
  const onEdgeDeleteRef = useRef(onEdgeDelete);
  editModeRef.current     = editMode;
  onEdgeDeleteRef.current = onEdgeDelete;

  const prevResetKeyRef = useRef(resetLayoutKey);

  const impactedKey = useMemo(
    () => [...impactedNodeIds].sort().join(','),
    [impactedNodeIds],
  );

  // ── Effect 1: recompute layout when graph data changes ─────────────────
  useEffect(() => {
    if (!propNodes.length) {
      setRfNodes([]);
      setRfEdges([]);
      return;
    }

    const NODE_W = editMode ? NODE_W_EXPANDED : (compactMode ? NODE_W_COMPACT : NODE_W_EXPANDED);
    const NODE_H = editMode ? NODE_H_EXPANDED : (compactMode ? NODE_H_COMPACT : NODE_H_EXPANDED);

    // ── 1. Build server→apps and app→server maps from 'hosts' edges ──────
    const serverToApps = new Map<string, string[]>();
    const appToServer  = new Map<string, string>();
    for (const e of propEdges) {
      if (e.relationType === 'hosts' && e.sourceType === 'server' && e.targetType === 'application') {
        if (!serverToApps.has(e.sourceId)) serverToApps.set(e.sourceId, []);
        serverToApps.get(e.sourceId)!.push(e.targetId);
        appToServer.set(e.targetId, e.sourceId);
      }
    }
    const hostedAppIds = new Set(appToServer.keys());

    // ── 2. Build group→servers and server→group maps ──────────────────────
    const groupToServers = new Map<string, string[]>();
    const serverToGroup  = new Map<string, string>(); // serverId → 'server-group:GroupName'
    for (const n of propNodes) {
      if (n.resourceType === 'server' && n.displayGroup) {
        if (!groupToServers.has(n.displayGroup)) groupToServers.set(n.displayGroup, []);
        groupToServers.get(n.displayGroup)!.push(n.id);
        serverToGroup.set(n.id, `server-group:${n.displayGroup}`);
      }
    }
    const serversInGroups = new Set(serverToGroup.keys());

    // ── 3. Helper: compute server-container size based on app count ───────
    function containerSize(numApps: number) {
      if (numApps === 0) return { w: NODE_W, h: NODE_H };
      return {
        w: Math.max(220, numApps * NODE_W + (numApps + 1) * INNER_PAD),
        h: SERVER_HEADER_H + NODE_H + INNER_PAD * 2,
      };
    }

    // ── 4. Compute group bounding sizes (arrange server containers in a row)
    const groupSize = new Map<string, { w: number; h: number }>();
    for (const [groupName, serverIds] of groupToServers) {
      const sizes = serverIds.map((id) => containerSize(serverToApps.get(id)?.length ?? 0));
      const maxH  = Math.max(...sizes.map((s) => s.h));
      const totalW = sizes.reduce((sum, s) => sum + s.w, 0) + Math.max(0, serverIds.length - 1) * SERVER_SPACING;
      groupSize.set(groupName, {
        w: totalW + GROUP_PAD * 2,
        h: maxH + GROUP_PAD * 2 + GROUP_LABEL_H,
      });
    }

    // ── 5. Build dagre input ──────────────────────────────────────────────
    // Top-level dagre nodes: groups, standalone server-containers, standalone servers, free nodes
    const dagreNodes: { id: string; width?: number; height?: number }[] = [];
    for (const [groupName, _servers] of groupToServers) {
      const gs = groupSize.get(groupName)!;
      dagreNodes.push({ id: `server-group:${groupName}`, width: gs.w, height: gs.h });
    }
    for (const n of propNodes) {
      if (serversInGroups.has(n.id)) continue;    // grouped servers → represented by their group
      if (hostedAppIds.has(n.id)) continue;        // hosted apps → inside server container
      if (n.resourceType === 'server' && serverToApps.has(n.id)) {
        // Standalone server-container
        const { w, h } = containerSize(serverToApps.get(n.id)!.length);
        dagreNodes.push({ id: n.id, width: w, height: h });
      } else {
        dagreNodes.push({ id: n.id }); // default NODE_W × NODE_H
      }
    }

    // Dagre edges: replace server/app IDs with their top-level dagre node ID
    function topLevelId(nodeId: string): string {
      if (hostedAppIds.has(nodeId)) {
        const srv = appToServer.get(nodeId);
        if (srv) return topLevelId(srv);
      }
      return serverToGroup.get(nodeId) ?? nodeId;
    }

    const addedDagreEdges = new Set<string>();
    const dagreEdges: { source: string; target: string; relationType: string }[] = [];
    for (const e of propEdges) {
      // "hosts" edges become visual containment — skip for dagre
      if (e.relationType === 'hosts' && hostedAppIds.has(e.targetId)) continue;
      const src = topLevelId(e.sourceId);
      const tgt = topLevelId(e.targetId);
      if (src === tgt) continue;
      const key = `${src}→${tgt}`;
      if (addedDagreEdges.has(key)) continue;
      addedDagreEdges.add(key);
      dagreEdges.push({ source: src, target: tgt, relationType: e.relationType });
    }

    const posMap = layoutGraph(dagreNodes, dagreEdges, compactMode);

    // ── 6. Handle reset and load saved positions ──────────────────────────
    const isReset = resetLayoutKey !== prevResetKeyRef.current;
    if (isReset) {
      prevResetKeyRef.current = resetLayoutKey;
      if (storageKey) try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
    }
    const saved = (storageKey && !isReset) ? loadPositions(storageKey) : {};

    // ── 7. Build RF nodes (parents MUST come before children) ─────────────
    const nodeMap = new Map(propNodes.map((n) => [n.id, n]));
    const newRfNodes: RFNode<NodeData>[] = [];

    function nodeData(n: { id: string; label: string; resourceType: string; status?: string; dbLabels?: string[] }): NodeData {
      return {
        label:            n.label,
        resourceType:     n.resourceType as RType,
        status:           n.status,
        impactDepth:      n.id === simulationSourceId ? 0 : impactedByDepth?.get(n.id),
        simulationActive: !!simulationSourceId,
        dbLabels:         n.dbLabels,
        editMode:         editModeRef.current,
        compactMode,
      };
    }

    // 7a. Group containers → then server-containers within them → then app children
    for (const [groupName, serverIds] of groupToServers) {
      const groupId = `server-group:${groupName}`;
      const gs      = groupSize.get(groupName)!;
      const groupPos = saved[groupId] ?? posMap.get(groupId) ?? { x: 0, y: 0 };

      newRfNodes.push({
        id:       groupId,
        type:     'server-group',
        position: groupPos,
        style:    { width: gs.w, height: gs.h },
        data: {
          label:            groupName,
          resourceType:     'server-group' as RType,
          impactDepth:      undefined,
          simulationActive: !!simulationSourceId,
          editMode:         editModeRef.current,
          compactMode,
        } as NodeData,
      } as RFNode<NodeData>);

      // Arrange server-containers horizontally inside the group
      let xCursor = GROUP_PAD;
      const yInner = GROUP_LABEL_H + GROUP_PAD;

      for (const serverId of serverIds) {
        const n = nodeMap.get(serverId);
        if (!n) continue;
        const numApps   = serverToApps.get(serverId)?.length ?? 0;
        const { w: cW, h: cH } = containerSize(numApps);
        const isContainer = numApps > 0;

        // Relative position within group (persisted in localStorage)
        const defaultRelPos = { x: xCursor, y: yInner };
        const serverRelPos  = saved[serverId] ?? defaultRelPos;
        xCursor += cW + SERVER_SPACING;

        newRfNodes.push({
          id:       serverId,
          type:     isContainer ? 'server-container' : 'resource',
          parentId: groupId,
          extent:   'parent',
          position: serverRelPos,
          ...(isContainer ? { style: { width: cW, height: cH } } : {}),
          data:     nodeData(n) as NodeData,
        } as RFNode<NodeData>);

        // 7b. App nodes inside this server-container
        if (isContainer) {
          const appIds = serverToApps.get(serverId) ?? [];
          appIds.forEach((appId, i) => {
            const appNode = nodeMap.get(appId);
            if (!appNode) return;
            newRfNodes.push({
              id:        appId,
              type:      'resource',
              parentId:  serverId,
              extent:    'parent',
              draggable: false,
              position:  {
                x: INNER_PAD + i * (NODE_W + INNER_PAD),
                y: SERVER_HEADER_H + INNER_PAD,
              },
              data: nodeData(appNode) as NodeData,
            } as RFNode<NodeData>);
          });
        }
      }
    }

    // 7c. Standalone server-containers (not in any group but have hosted apps)
    for (const n of propNodes) {
      if (n.resourceType !== 'server') continue;
      if (serversInGroups.has(n.id)) continue;
      if (!serverToApps.has(n.id)) continue;

      const numApps = serverToApps.get(n.id)!.length;
      const { w: cW, h: cH } = containerSize(numApps);
      const pos = saved[n.id] ?? posMap.get(n.id) ?? { x: 0, y: 0 };

      newRfNodes.push({
        id:       n.id,
        type:     'server-container',
        position: pos,
        style:    { width: cW, height: cH },
        data:     nodeData(n) as NodeData,
      } as RFNode<NodeData>);

      const appIds = serverToApps.get(n.id) ?? [];
      appIds.forEach((appId, i) => {
        const appNode = nodeMap.get(appId);
        if (!appNode) return;
        newRfNodes.push({
          id:        appId,
          type:      'resource',
          parentId:  n.id,
          extent:    'parent',
          draggable: false,
          position:  {
            x: INNER_PAD + i * (NODE_W + INNER_PAD),
            y: SERVER_HEADER_H + INNER_PAD,
          },
          data: nodeData(appNode) as NodeData,
        } as RFNode<NodeData>);
      });
    }

    // 7d. All remaining free-floating nodes
    for (const n of propNodes) {
      if (serversInGroups.has(n.id)) continue;   // grouped server
      if (hostedAppIds.has(n.id)) continue;       // hosted app
      if (n.resourceType === 'server' && serverToApps.has(n.id)) continue; // standalone container (already added)

      newRfNodes.push({
        id:       n.id,
        type:     'resource',
        position: saved[n.id] ?? posMap.get(n.id) ?? { x: 0, y: 0 },
        data:     nodeData(n) as NodeData,
      });
    }

    setRfNodes(newRfNodes);

    // ── 8. Build RF edges — filter "hosts" edges replaced by containment ──
    const visibleEdges = propEdges.filter((e) =>
      !(e.relationType === 'hosts' && e.targetType === 'application' && hostedAppIds.has(e.targetId)),
    );
    setRfEdges(visibleEdges.map((e) => buildEdge(
      { id: e.id, sourceId: e.sourceId, targetId: e.targetId, relationType: e.relationType },
      impactedNodeIds,
      simulationSourceId,
      { editMode: editModeRef.current, onDelete: onEdgeDeleteRef.current },
    )));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propNodes, propEdges, resetLayoutKey, compactMode]);

  // ── Effect 2: update colors/states when simulation changes (no relayout) ─
  useEffect(() => {
    setRfNodes((prev) =>
      prev.map((n) => ({
        ...n,
        data: {
          ...n.data,
          impactDepth:      n.id === simulationSourceId ? 0 : impactedByDepth?.get(n.id),
          simulationActive: !!simulationSourceId,
          compactMode,
        } as NodeData,
      })),
    );
    const visibleEdges = propEdges.filter((e) =>
      !(e.relationType === 'hosts' && e.targetType === 'application'),
    );
    setRfEdges(visibleEdges.map((e) => buildEdge(
      { id: e.id, sourceId: e.sourceId, targetId: e.targetId, relationType: e.relationType },
      impactedNodeIds,
      simulationSourceId,
      { editMode: editModeRef.current, onDelete: onEdgeDeleteRef.current },
    )));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [impactedKey, simulationSourceId, compactMode]);

  // ── Effect 3: propagate editMode / onEdgeDelete ───────────────────────
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

  const onNodesChange = useCallback(
    (changes: NodeChange<RFNode<NodeData>>[]) => {
      setRfNodes((prev) => {
        const next = applyNodeChanges(changes, prev);
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
      return srcType !== 'db-group' && tgtType !== 'db-group'
        && srcType !== 'server-group' && tgtType !== 'server-group';
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
