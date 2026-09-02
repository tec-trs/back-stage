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
  type Edge,
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
import { EdgeRelationshipDialog } from './EdgeRelationshipDialog';
import { useNodeClickHandler } from './NodeClickHandler';
import { useDiagramState } from './useDiagramState';
import { RESOURCE_COLORS, type ResourceType, type RelationshipEdgeData } from './types';
import { getResourceNodeSize, type NodeServiceSummary } from './nodeSizing';
import type { ArchitectureDiagram } from './use-architecture-diagrams';
import { layoutWithDagre } from './dagreLayout';
import {
  isRelationshipCapableResourceType,
  relationTypeLabel,
  type RelationType,
  type ResourceType as RelationshipResourceType,
} from '../resource-graph/relationship-types';
import { useCreateRelationship, useDeleteRelationship } from '../resource-graph/use-resource-graph';

const GRID_COLS = 5;
const GRID_GAP_X = 200; // wide enough for a server node grown to 176px for nested services
const GRID_GAP_Y = 110;

// Visual treatment for an edge that mirrors a real resource_relationships row,
// so a "real" dependency reads differently at a glance from a purely visual line.
const REAL_EDGE_COLOR = '#38bdf8';
const REAL_EDGE_STYLE = { stroke: REAL_EDGE_COLOR, strokeWidth: 1.75 };
const REAL_EDGE_LABEL_STYLE = { fill: '#e2e8f0', fontSize: 11, fontWeight: 600 } as const;
const REAL_EDGE_LABEL_BG_STYLE = { fill: '#0f172a', fillOpacity: 0.85 } as const;
const REAL_EDGE_MARKER = { type: MarkerType.ArrowClosed, color: REAL_EDGE_COLOR, width: 12, height: 12 };

const nodeTypes = {
  url: ResourceNodeWithIcon as any,
  application: ResourceNodeWithIcon as any,
  service: ResourceNodeWithIcon as any,
  database: ResourceNodeWithIcon as any,
  server: ResourceNodeWithIcon as any,
  'db-group': ResourceNodeWithIcon as any,
};

type NodeResourceData = { resourceType?: ResourceType; resourceId?: string; label?: string };

interface PendingEdgeDialog {
  mode: 'create' | 'edit';
  connection?: Connection;
  edge?: Edge;
  sourceLabel: string;
  targetLabel: string;
  sourceType: RelationshipResourceType;
  sourceId: string;
  targetType: RelationshipResourceType;
  targetId: string;
  initialRelationType: RelationType;
  initialReason: string;
}

function realEdgeData(edge: Edge | undefined): RelationshipEdgeData | undefined {
  const data = edge?.data as RelationshipEdgeData | undefined;
  return data?.relationshipId ? data : undefined;
}

function styleRealEdge(edge: Edge, relationType: string): Edge {
  return {
    ...edge,
    label: relationTypeLabel(relationType),
    style: REAL_EDGE_STYLE,
    labelStyle: REAL_EDGE_LABEL_STYLE,
    labelBgStyle: REAL_EDGE_LABEL_BG_STYLE,
    labelBgPadding: [4, 2] as [number, number],
    labelBgBorderRadius: 3,
    markerEnd: REAL_EDGE_MARKER,
  };
}

function stripToVisualEdge(edge: Edge): Edge {
  return {
    ...edge,
    data: undefined,
    label: undefined,
    style: undefined,
    labelStyle: undefined,
    labelBgStyle: undefined,
    markerEnd: undefined,
  };
}

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

  const createRelationship = useCreateRelationship();
  const deleteRelationship = useDeleteRelationship();
  const [pendingEdgeDialog, setPendingEdgeDialog] = useState<PendingEdgeDialog | null>(null);
  const [isEdgeDialogSubmitting, setIsEdgeDialogSubmitting] = useState(false);
  const [edgeDialogError, setEdgeDialogError] = useState<string | undefined>();

  const closeEdgeDialog = useCallback(() => {
    setPendingEdgeDialog(null);
    setIsEdgeDialogSubmitting(false);
    setEdgeDialogError(undefined);
  }, []);

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
      // Edges backed by a real resource_relationships row need a confirmation +
      // an API call before they can disappear from the canvas — a bare "remove"
      // change from React Flow (Delete key, right-click delete) would otherwise
      // desync the diagram from the live dependency graph silently.
      const removalIds = new Set(
        changes.filter((c) => c.type === 'remove').map((c) => (c as { id: string }).id),
      );
      const realRemovals = edges.filter((e) => removalIds.has(e.id) && realEdgeData(e));

      if (realRemovals.length > 0) {
        for (const edge of realRemovals) {
          const data = realEdgeData(edge);
          if (!data) continue;
          const confirmed = window.confirm(
            `Este e um relacionamento real (${relationTypeLabel(data.relationType)}). Remove-lo tambem tira essa ` +
              'dependencia da Analise de Impacto e do grafo de dependencias. Continuar?',
          );
          if (!confirmed) continue;
          deleteRelationship.mutate(data.relationshipId, {
            onSuccess: () => {
              setEdges((eds) => eds.filter((e) => e.id !== edge.id));
              diagramState.setEdges((eds) => eds.filter((e) => e.id !== edge.id));
            },
            onError: (err) => {
              alert(
                `Nao foi possivel remover o relacionamento (${
                  err instanceof Error ? err.message : 'erro desconhecido'
                }). A ligacao foi mantida no diagrama.`,
              );
            },
          });
        }
      }

      // Everything else (selection, non-real removals, drag, etc.) applies immediately.
      const rest = changes.filter((c) => !(c.type === 'remove' && removalIds.has((c as { id: string }).id) && realRemovals.some((e) => e.id === (c as { id: string }).id)));
      const updated = applyEdgeChanges(rest, edges);
      setEdges(updated);
      diagramState.setEdges(updated);
    },
    [edges, setEdges, diagramState, deleteRelationship]
  );

  onNodesChange;
  onEdgesChange;

  const handleConnect = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);
      const sourceData = sourceNode?.data as NodeResourceData | undefined;
      const targetData = targetNode?.data as NodeResourceData | undefined;

      // Only two nodes that both point at a real catalog resource (added via the
      // inventory picker in ToolBarSimple, not hand-typed or a lightweight
      // "service") are eligible to become a real resource_relationships row.
      if (
        sourceData?.resourceId &&
        targetData?.resourceId &&
        isRelationshipCapableResourceType(sourceData.resourceType) &&
        isRelationshipCapableResourceType(targetData.resourceType)
      ) {
        setEdgeDialogError(undefined);
        setPendingEdgeDialog({
          mode: 'create',
          connection,
          sourceLabel: sourceData.label ?? '',
          targetLabel: targetData.label ?? '',
          sourceType: sourceData.resourceType,
          sourceId: sourceData.resourceId,
          targetType: targetData.resourceType,
          targetId: targetData.resourceId,
          initialRelationType: 'depends_on',
          initialReason: '',
        });
        return;
      }

      diagramState.handleConnect(connection);
      setEdges((eds) => {
        // @ts-ignore - React Flow addEdge expects specific types
        return [...eds, { id: `${connection.source}-${connection.target}`, ...connection }];
      });
    },
    [nodes, diagramState, setEdges]
  );

  const handleEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);
      const sourceData = sourceNode?.data as NodeResourceData | undefined;
      const targetData = targetNode?.data as NodeResourceData | undefined;

      if (
        !sourceData?.resourceId ||
        !targetData?.resourceId ||
        !isRelationshipCapableResourceType(sourceData.resourceType) ||
        !isRelationshipCapableResourceType(targetData.resourceType)
      ) {
        // Free-typed nodes or lightweight "service" nodes have nothing real to edit.
        return;
      }

      const data = realEdgeData(edge);
      setEdgeDialogError(undefined);
      setPendingEdgeDialog({
        mode: 'edit',
        edge,
        sourceLabel: sourceData.label ?? '',
        targetLabel: targetData.label ?? '',
        sourceType: sourceData.resourceType,
        sourceId: sourceData.resourceId,
        targetType: targetData.resourceType,
        targetId: targetData.resourceId,
        initialRelationType: (data?.relationType as RelationType) ?? 'depends_on',
        initialReason: data?.reason ?? '',
      });
    },
    [nodes]
  );

  const applyResolvedRealEdge = useCallback(
    (relationshipId: string, relationType: RelationType, reason: string, pending: PendingEdgeDialog) => {
      const data: RelationshipEdgeData = { relationshipId, relationType, reason: reason || undefined };

      if (pending.mode === 'create' && pending.connection) {
        const connection = pending.connection;
        const newEdge = styleRealEdge(
          { id: `${connection.source}-${connection.target}`, ...connection } as Edge,
          relationType,
        );
        newEdge.data = data;
        diagramState.handleConnect(connection);
        setEdges((eds) => [...eds, newEdge]);
        diagramState.setEdges((eds) => [...eds, newEdge]);
      } else if (pending.mode === 'edit' && pending.edge) {
        const updated = styleRealEdge({ ...pending.edge }, relationType);
        updated.data = data;
        setEdges((eds) => eds.map((e) => (e.id === pending.edge!.id ? updated : e)));
        diagramState.setEdges((eds) => eds.map((e) => (e.id === pending.edge!.id ? updated : e)));
      }

      closeEdgeDialog();
    },
    [diagramState, setEdges, closeEdgeDialog]
  );

  const handleEdgeDialogConfirm = useCallback(
    (relationType: RelationType, reason: string) => {
      if (!pendingEdgeDialog) return;
      setIsEdgeDialogSubmitting(true);
      setEdgeDialogError(undefined);

      const createPayload = {
        sourceType: pendingEdgeDialog.sourceType,
        sourceId: pendingEdgeDialog.sourceId,
        targetType: pendingEdgeDialog.targetType,
        targetId: pendingEdgeDialog.targetId,
        relationType,
        reason: reason || undefined,
      };

      const existing = pendingEdgeDialog.mode === 'edit' ? realEdgeData(pendingEdgeDialog.edge) : undefined;

      if (existing) {
        // There is no PATCH endpoint for resource_relationships — "editing" a
        // relationship means deleting the old row and creating a fresh one.
        deleteRelationship.mutate(existing.relationshipId, {
          onSuccess: () => {
            createRelationship.mutate(createPayload, {
              onSuccess: (created) => applyResolvedRealEdge(created.id, relationType, reason, pendingEdgeDialog),
              onError: (err) => {
                // The old relationship is already gone — leave the arrow on the
                // canvas but strip it down to a plain visual line rather than
                // pointing at a relationship that no longer exists.
                if (pendingEdgeDialog.edge) {
                  const plain = stripToVisualEdge(pendingEdgeDialog.edge);
                  setEdges((eds) => eds.map((e) => (e.id === pendingEdgeDialog.edge!.id ? plain : e)));
                  diagramState.setEdges((eds) => eds.map((e) => (e.id === pendingEdgeDialog.edge!.id ? plain : e)));
                }
                setIsEdgeDialogSubmitting(false);
                setEdgeDialogError(
                  `O relacionamento anterior foi removido, mas criar o novo falhou (${
                    err instanceof Error ? err.message : 'erro desconhecido'
                  }). A ligacao ficou apenas visual — edite novamente para recriar.`,
                );
              },
            });
          },
          onError: (err) => {
            setIsEdgeDialogSubmitting(false);
            setEdgeDialogError(
              `Nao foi possivel remover o relacionamento atual (${
                err instanceof Error ? err.message : 'erro desconhecido'
              }).`,
            );
          },
        });
        return;
      }

      createRelationship.mutate(createPayload, {
        onSuccess: (created) => applyResolvedRealEdge(created.id, relationType, reason, pendingEdgeDialog),
        onError: (err) => {
          setIsEdgeDialogSubmitting(false);
          setEdgeDialogError(err instanceof Error ? err.message : 'Erro ao criar relacionamento');
        },
      });
    },
    [pendingEdgeDialog, createRelationship, deleteRelationship, applyResolvedRealEdge, setEdges, diagramState]
  );

  const handleCreateVisualOnly = useCallback(() => {
    if (!pendingEdgeDialog?.connection) return;
    const connection = pendingEdgeDialog.connection;
    diagramState.handleConnect(connection);
    setEdges((eds) => {
      // @ts-ignore - React Flow addEdge expects specific types
      return [...eds, { id: `${connection.source}-${connection.target}`, ...connection }];
    });
    closeEdgeDialog();
  }, [pendingEdgeDialog, diagramState, setEdges, closeEdgeDialog]);

  const handleRemoveRealLink = useCallback(() => {
    if (pendingEdgeDialog?.mode !== 'edit' || !pendingEdgeDialog.edge) return;
    const data = realEdgeData(pendingEdgeDialog.edge);
    if (!data) {
      closeEdgeDialog();
      return;
    }
    setIsEdgeDialogSubmitting(true);
    deleteRelationship.mutate(data.relationshipId, {
      onSuccess: () => {
        const plain = stripToVisualEdge(pendingEdgeDialog.edge!);
        setEdges((eds) => eds.map((e) => (e.id === pendingEdgeDialog.edge!.id ? plain : e)));
        diagramState.setEdges((eds) => eds.map((e) => (e.id === pendingEdgeDialog.edge!.id ? plain : e)));
        closeEdgeDialog();
      },
      onError: (err) => {
        setIsEdgeDialogSubmitting(false);
        setEdgeDialogError(err instanceof Error ? err.message : 'Erro ao remover relacionamento');
      },
    });
  }, [pendingEdgeDialog, deleteRelationship, setEdges, diagramState, closeEdgeDialog]);

  const handleDeleteEdge = useCallback(() => {
    if (pendingEdgeDialog?.mode !== 'edit' || !pendingEdgeDialog.edge) return;
    const edge = pendingEdgeDialog.edge;
    const data = realEdgeData(edge);

    // Plain visual edge — nothing backing it in the API, just drop it from the canvas.
    if (!data) {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      diagramState.setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      closeEdgeDialog();
      return;
    }

    const confirmed = window.confirm(
      `Este e um relacionamento real (${relationTypeLabel(data.relationType)}). Excluir tambem tira essa ` +
        'dependencia da Analise de Impacto e do grafo de dependencias. Continuar?',
    );
    if (!confirmed) return;

    setIsEdgeDialogSubmitting(true);
    deleteRelationship.mutate(data.relationshipId, {
      onSuccess: () => {
        setEdges((eds) => eds.filter((e) => e.id !== edge.id));
        diagramState.setEdges((eds) => eds.filter((e) => e.id !== edge.id));
        closeEdgeDialog();
      },
      onError: (err) => {
        setIsEdgeDialogSubmitting(false);
        setEdgeDialogError(
          `Nao foi possivel excluir o relacionamento (${
            err instanceof Error ? err.message : 'erro desconhecido'
          }).`,
        );
      },
    });
  }, [pendingEdgeDialog, deleteRelationship, setEdges, diagramState, closeEdgeDialog]);

  const handleAddNode = useCallback(
    (type: ResourceType, label: string, description?: string, resourceId?: string, services?: NodeServiceSummary[]) => {
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
              services,
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
      const sized = nds.map((n) => {
        const data = n.data as { resourceType?: ResourceType; services?: NodeServiceSummary[] } | undefined;
        const { width, height } = getResourceNodeSize(data?.resourceType ?? 'service', data?.services);
        return { id: n.id, width, height };
      });
      const positions = layoutWithDagre(sized, edges);
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
    <div className="flex h-full flex-col bg-canvas">
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
            onEdgeClick={handleEdgeClick}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={{
              type: 'straight',
              style: { stroke: '#475569', strokeWidth: 1.25 },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#475569', width: 11, height: 11 },
            }}
            fitView
          >
            <Background color="#1e293b" variant={BackgroundVariant.Dots} gap={20} size={1.5} />
            <Controls className="!rounded !border !border-line !bg-surface !shadow-lg [&>button]:!border-line [&>button]:!bg-surface [&>button]:!text-slate-300 [&>button:hover]:!bg-surface-raised [&_svg]:!fill-slate-300" />
            <MiniMap
              className="!rounded !border !border-line !bg-surface"
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

      {pendingEdgeDialog && (
        <EdgeRelationshipDialog
          isOpen
          mode={pendingEdgeDialog.mode}
          sourceLabel={pendingEdgeDialog.sourceLabel}
          targetLabel={pendingEdgeDialog.targetLabel}
          initialRelationType={pendingEdgeDialog.initialRelationType}
          initialReason={pendingEdgeDialog.initialReason}
          isSubmitting={isEdgeDialogSubmitting}
          errorMessage={edgeDialogError}
          onCancel={closeEdgeDialog}
          onConfirm={handleEdgeDialogConfirm}
          onCreateVisualOnly={pendingEdgeDialog.mode === 'create' ? handleCreateVisualOnly : undefined}
          onRemoveRealLink={
            pendingEdgeDialog.mode === 'edit' && realEdgeData(pendingEdgeDialog.edge) ? handleRemoveRealLink : undefined
          }
          onDeleteEdge={pendingEdgeDialog.mode === 'edit' ? handleDeleteEdge : undefined}
        />
      )}
    </div>
  );
}
