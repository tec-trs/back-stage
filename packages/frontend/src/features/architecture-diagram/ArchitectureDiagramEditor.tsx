import { useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  useNodesState,
  useEdgesState,
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import dagre from 'dagre';
import { ResourceNodeWithIcon } from './ResourceNodeWithIcon';
import { ToolBarSimple } from './ToolBarSimple';
import { Sidebar } from './Sidebar';
import { SaveDiagramDialog } from './SaveDiagramDialog';
import { LoadDiagramDialog } from './LoadDiagramDialog';
import { ExportImageDialog } from './ExportImageDialog';
import { useNodeClickHandler } from './NodeClickHandler';
import { useDiagramState } from './useDiagramState';
import { RESOURCE_COLORS, type ResourceType } from './types';
import type { ArchitectureDiagram } from './use-architecture-diagrams';

const GRID_COLS = 5;
const GRID_GAP_X = 140;
const GRID_GAP_Y = 110;
const NODE_W = 120;
const NODE_H = 76;

// Auto-arrange the current graph left-to-right with dagre — an explicit,
// on-demand action (not automatic) so manual placement is never fought.
// LR (not TB) intentionally mirrors iTop's own impact-analysis graph, which
// computes its layout the same way (a layered/Sugiyama algorithm — dagre is a
// JS port of the same family GraphViz's `dot` uses) with rankdir=LR.
function layoutWithDagre(nodes: any[], edges: any[]): Map<string, { x: number; y: number }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = new (dagre as any).graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 36, ranksep: 80 });
  nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (dagre as any).layout(g);
  const positions = new Map<string, { x: number; y: number }>();
  nodes.forEach((n) => {
    const pos = g.node(n.id);
    positions.set(n.id, pos ? { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 } : { x: 0, y: 0 });
  });
  return positions;
}

const nodeTypes = {
  url: ResourceNodeWithIcon as any,
  application: ResourceNodeWithIcon as any,
  service: ResourceNodeWithIcon as any,
  database: ResourceNodeWithIcon as any,
  server: ResourceNodeWithIcon as any,
};

export function ArchitectureDiagramEditor() {
  const diagramState = useDiagramState();
  const [nodes, setNodes, onNodesChange] = useNodesState(diagramState.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(diagramState.edges);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [isLoadOpen, setIsLoadOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [diagramId, setDiagramId] = useState<string>();
  const { handleNodeClick } = useNodeClickHandler();

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const updated = applyNodeChanges(changes, nodes);
      setNodes(updated);
      diagramState.setNodes(updated as any);
    },
    [nodes, setNodes, diagramState]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const updated = applyEdgeChanges(changes, edges);
      setEdges(updated);
      diagramState.setEdges(updated);
    },
    [edges, setEdges, diagramState]
  );

  onNodesChange;
  onEdgesChange;

  const handleConnect = useCallback(
    (connection: Connection) => {
      diagramState.handleConnect(connection);
      setEdges((eds) => {
        // @ts-ignore - React Flow addEdge expects specific types
        return [...eds, { id: `${connection.source}-${connection.target}`, ...connection }];
      });
    },
    [diagramState, setEdges]
  );

  const handleAddNode = useCallback(
    (type: ResourceType, label: string, description?: string, resourceId?: string) => {
      const nodeId = resourceId || `${type}-${Date.now()}`;
      diagramState.addNode(type, label, description);
      setNodes((nds) => {
        const index = nds.length;
        const col = index % GRID_COLS;
        const row = Math.floor(index / GRID_COLS);
        return [
          ...nds,
          {
            id: nodeId,
            type: type as string,
            position: { x: 40 + col * GRID_GAP_X, y: 40 + row * GRID_GAP_Y },
            data: {
              label,
              resourceType: type,
              description,
              resourceId,
            },
          },
        ];
      });
    },
    [diagramState, setNodes]
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      diagramState.deleteNode(nodeId);
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    },
    [diagramState, setNodes, setEdges]
  );

  const handleOrganize = useCallback(() => {
    setNodes((nds) => {
      const positions = layoutWithDagre(nds, edges);
      const arranged = nds.map((n) => ({ ...n, position: positions.get(n.id) ?? n.position }));
      diagramState.setNodes(arranged as any);
      return arranged;
    });
  }, [edges, setNodes, diagramState]);

  const handleClear = useCallback(() => {
    if (!confirm('Tem certeza que deseja limpar todo o diagrama?')) return;
    diagramState.clear();
    setNodes([]);
    setEdges([]);
  }, [diagramState, setNodes, setEdges]);

  const handleExport = useCallback(() => {
    const data = {
      name: diagramState.diagramName,
      nodes,
      edges,
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${diagramState.diagramName}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges, diagramState.diagramName]);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          diagramState.setDiagramName(data.name || 'Diagrama Importado');
          setNodes(data.nodes || []);
          setEdges(data.edges || []);
          diagramState.setNodesAndEdges(data.nodes || [], data.edges || []);
        } catch (error) {
          alert('Erro ao importar diagrama');
        }
      };
      reader.readAsText(file);
    },
    [diagramState, setNodes, setEdges]
  );

  const handleLoadDiagram = useCallback(
    (diagram: ArchitectureDiagram) => {
      diagramState.setDiagramName(diagram.name);
      setNodes(diagram.nodes as any);
      setEdges(diagram.edges);
      diagramState.setNodesAndEdges(diagram.nodes as any, diagram.edges);
      setDiagramId(diagram.id);
      setIsLoadOpen(false);
    },
    [diagramState, setNodes, setEdges]
  );

  return (
    <div className="flex flex-col h-screen bg-canvas">
      <ToolBarSimple
        onAddNode={handleAddNode}
        onClear={handleClear}
        onExport={handleExport}
        onImport={handleImport}
        onOrganize={handleOrganize}
        onSaveToDatabase={() => setIsSaveOpen(true)}
        onLoadFromDatabase={() => setIsLoadOpen(true)}
        onExportImage={() => setIsExportOpen(true)}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            onNodeClick={(_, node) => handleNodeClick(node)}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={{
              type: 'straight',
              style: { stroke: '#475569', strokeWidth: 1.25 },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#475569', width: 11, height: 11 },
            }}
            fitView
          >
            <Background color="#1e293b" variant={BackgroundVariant.Dots} gap={20} size={1.5} />
            <Controls className="!rounded-md !border !border-line !bg-surface !shadow-lg [&>button]:!border-line [&>button]:!bg-surface [&>button]:!text-slate-300 [&>button:hover]:!bg-surface-raised [&_svg]:!fill-slate-300" />
            <MiniMap
              className="!rounded-md !border !border-line !bg-surface"
              maskColor="rgba(11,15,25,0.65)"
              nodeColor={(n) => RESOURCE_COLORS[(n.data as { resourceType?: ResourceType })?.resourceType ?? 'service']}
              nodeBorderRadius={4}
            />
          </ReactFlow>
        </div>

        <Sidebar
          selectedNodeId={null}
          onDeleteNode={handleDeleteNode}
          diagramName={diagramState.diagramName}
          onDiagramNameChange={diagramState.setDiagramName}
          nodeCount={nodes.length}
          edgeCount={edges.length}
        />
      </div>

      <SaveDiagramDialog
        isOpen={isSaveOpen}
        onClose={() => setIsSaveOpen(false)}
        diagramName={diagramState.diagramName}
        nodes={nodes as any}
        edges={edges}
        diagramId={diagramId}
      />

      <LoadDiagramDialog
        isOpen={isLoadOpen}
        onClose={() => setIsLoadOpen(false)}
        onLoad={handleLoadDiagram}
      />

      <ExportImageDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        diagramName={diagramState.diagramName}
      />
    </div>
  );
}
