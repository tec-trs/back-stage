import { useCallback, useMemo, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  type Edge as RFEdge,
  type Node as RFNode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Button } from '../../shared/components/Button';
import { DownloadIcon, LayersIcon, PlusIcon } from '../../shared/components/icons';
import { ErrorMessage } from '../../shared/components/ErrorMessage';
import { PageHeader } from '../../shared/components/PageHeader';
import { AddRelationshipDialog } from '../resource-graph/AddRelationshipDialog';
import { useFullGraph } from '../resource-graph/use-resource-graph';
import { ResourceNodeWithIcon } from './ResourceNodeWithIcon';
import { getResourceNodeSize } from './nodeSizing';
import { ExportImageDialog } from './ExportImageDialog';
import { useNodeClickHandler } from './NodeClickHandler';
import { layoutWithDagre } from './dagreLayout';
import { RESOURCE_COLORS, type ResourceType } from './types';

// Only these carry a real detail page + icon in the architecture-diagram feature.
// 'group' (server groups) exists in the CMDB but has no standalone route yet, so
// nodes of that type are left out rather than shown as a dead end.
const KNOWN_TYPES = new Set<string>(['server', 'application', 'database', 'url', 'vip']);

const nodeTypes = {
  server: ResourceNodeWithIcon as any,
  application: ResourceNodeWithIcon as any,
  database: ResourceNodeWithIcon as any,
  url: ResourceNodeWithIcon as any,
  vip: ResourceNodeWithIcon as any,
};

const POSITIONS_STORAGE_KEY = 'architecture-diagram:live-graph-positions:v1';

type SavedPositions = Record<string, { x: number; y: number }>;

function loadSavedPositions(): SavedPositions {
  try {
    const raw = localStorage.getItem(POSITIONS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedPositions) : {};
  } catch {
    return {};
  }
}

function persistPositions(positions: SavedPositions): void {
  try {
    localStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(positions));
  } catch {
    // ignore storage quota errors
  }
}

/**
 * The "iTop-style" live graph: unlike the manual diagram editor below it (still
 * available under the "Diagramas manuais" tab), this view has no data of its
 * own — it renders exactly the same resource_relationships data the Ecosystem
 * page and the "Adicionar Relacionamento" dialog (used across every resource
 * detail page) already read and write. Creating a relationship anywhere in the
 * app refreshes this view automatically, because useCreateRelationship already
 * invalidates every resource-graph query on success.
 */
export function LiveArchitectureGraph() {
  const { data, isLoading, isError, error } = useFullGraph({ page: 1, pageSize: 500 });
  const { handleNodeClick } = useNodeClickHandler();
  const [isRelationshipOpen, setIsRelationshipOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [manualPositions, setManualPositions] = useState<SavedPositions>(() => loadSavedPositions());

  const knownNodes = useMemo(
    () => (data?.nodes ?? []).filter((n) => KNOWN_TYPES.has(n.resourceType)),
    [data],
  );
  const knownEdges = useMemo(
    () =>
      (data?.edges ?? []).filter(
        (e) => KNOWN_TYPES.has(e.sourceType) && KNOWN_TYPES.has(e.targetType),
      ),
    [data],
  );

  const { rfNodes, rfEdges } = useMemo(() => {
    const dagreNodes = knownNodes.map((n) => {
      const { width, height } = getResourceNodeSize(n.resourceType as ResourceType, n.services);
      return { id: `${n.resourceType}:${n.id}`, width, height };
    });
    const dagreEdges = knownEdges.map((e) => ({
      source: `${e.sourceType}:${e.sourceId}`,
      target: `${e.targetType}:${e.targetId}`,
    }));
    const autoPositions = layoutWithDagre(dagreNodes, dagreEdges);

    const nodes: RFNode[] = knownNodes.map((n) => {
      const id = `${n.resourceType}:${n.id}`;
      return {
        id,
        type: n.resourceType,
        position: manualPositions[id] ?? autoPositions.get(id) ?? { x: 0, y: 0 },
        data: {
          label: n.label,
          resourceType: n.resourceType as ResourceType,
          description: n.status,
          resourceId: n.id,
          services: n.services,
        },
      };
    });

    const edges: RFEdge[] = knownEdges.map((e) => ({
      id: e.id,
      source: `${e.sourceType}:${e.sourceId}`,
      target: `${e.targetType}:${e.targetId}`,
    }));

    return { rfNodes: nodes, rfEdges: edges };
  }, [knownNodes, knownEdges, manualPositions]);

  const handleNodeDragStop = useCallback(
    (_: unknown, node: RFNode) => {
      setManualPositions((prev) => {
        const next = { ...prev, [node.id]: node.position };
        persistPositions(next);
        return next;
      });
    },
    [],
  );

  const handleOrganize = useCallback(() => {
    setManualPositions({});
    persistPositions({});
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-t-transparent border-blue-500 animate-spin" />
          <p className="text-sm text-slate-400">Carregando grafo...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <PageHeader
          title="Arquitetura"
          description="Visão gerada automaticamente a partir dos relacionamentos reais do inventário"
        />
        <ErrorMessage message={error instanceof Error ? error.message : 'Erro ao carregar o grafo'} />
      </div>
    );
  }

  const total = data?.pagination.total ?? 0;
  const isGraphLimited = total > 500;

  if (!data || data.nodes.length === 0 || isGraphLimited) {
    return (
      <div>
        <PageHeader
          title="Arquitetura"
          description="Visão gerada automaticamente a partir dos relacionamentos reais do inventário"
        />
        <ErrorMessage
          message={
            isGraphLimited
              ? `Grafo muito grande (${total} recursos) para exibir de uma vez. Use a página Ecossistema com filtros, ou explore por recurso individual.`
              : 'Nenhum recurso encontrado. Crie um relacionamento entre dois recursos do inventário para começar.'
          }
        />
        <div className="mt-4">
          <Button icon={<PlusIcon />} onClick={() => setIsRelationshipOpen(true)}>
            Adicionar Relacionamento
          </Button>
        </div>
        <AddRelationshipDialog isOpen={isRelationshipOpen} onClose={() => setIsRelationshipOpen(false)} />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-canvas">
      <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-3">
        <div>
          <h1 className="text-sm font-semibold text-slate-100">Arquitetura</h1>
          <p className="text-xs text-slate-500">
            {rfNodes.length} recursos · {rfEdges.length} relacionamentos — gerado a partir do inventário real
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={<LayersIcon />} onClick={handleOrganize}>
            Organizar
          </Button>
          <Button variant="secondary" size="sm" icon={<DownloadIcon />} onClick={() => setIsExportOpen(true)}>
            Exportar imagem
          </Button>
          <Button size="sm" icon={<PlusIcon />} onClick={() => setIsRelationshipOpen(true)}>
            Adicionar Relacionamento
          </Button>
        </div>
      </div>

      <div className="flex-1">
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={nodeTypes}
          onNodeClick={(_, node) => handleNodeClick(node)}
          onNodeDragStop={handleNodeDragStop}
          defaultEdgeOptions={{
            type: 'smoothstep',
            style: { stroke: '#475569', strokeWidth: 1.25 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#475569', width: 11, height: 11 },
          }}
          fitView
          fitViewOptions={{ padding: 0.15, maxZoom: 1.5 }}
          minZoom={0.1}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
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

      <AddRelationshipDialog isOpen={isRelationshipOpen} onClose={() => setIsRelationshipOpen(false)} />
      <ExportImageDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        diagramName="arquitetura"
      />
    </div>
  );
}
