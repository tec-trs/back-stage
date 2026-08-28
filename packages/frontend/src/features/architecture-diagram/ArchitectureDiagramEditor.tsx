import { useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
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
import { ResourceNodeWithIcon } from './ResourceNodeWithIcon';
import { ToolBarSimple } from './ToolBarSimple';
import { Sidebar } from './Sidebar';
import { SaveDiagramDialog } from './SaveDiagramDialog';
import { LoadDiagramDialog } from './LoadDiagramDialog';
import { ExportImageDialog } from './ExportImageDialog';
import { useNodeClickHandler } from './NodeClickHandler';
import { useDiagramState } from './useDiagramState';
import type { ResourceType } from './types';
import type { ArchitectureDiagram } from './use-architecture-diagrams';

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
      setNodes((nds) => [
        ...nds,
        {
          id: nodeId,
          type: type as string,
          position: { x: Math.random() * 300, y: Math.random() * 300 },
          data: {
            label,
            resourceType: type,
            description,
            resourceId,
          },
        },
      ]);
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
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
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
