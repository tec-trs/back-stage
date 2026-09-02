import { type FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  ReactFlow,
  type Edge as RFEdge,
  type Node as RFNode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Button } from '../shared/components/Button';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { Modal } from '../shared/components/Modal';
import { PageHeader } from '../shared/components/PageHeader';
import { PencilIcon, PlusIcon, TrashIcon } from '../shared/components/icons';
import { Spinner } from '../shared/components/Spinner';
import { useDatabaseGroups } from '../features/database-groups/use-database-groups';
import { AddRelationshipDialog } from '../features/resource-graph/AddRelationshipDialog';
import type { GraphEdge } from '../features/resource-graph/use-resource-graph';
import {
  useDeleteRelationshipMap,
  useDetachRelationshipFromMap,
  useAttachRelationshipToMap,
  useRelationshipMap,
  useUpdateRelationshipMap,
  type MapResourceType,
  type RelationshipMapEdge,
} from '../features/relationship-maps/use-relationship-maps';
import { ResourceNodeWithIcon } from '../features/architecture-diagram/ResourceNodeWithIcon';
import { getResourceNodeSize } from '../features/architecture-diagram/nodeSizing';
import { layoutWithDagre } from '../features/architecture-diagram/dagreLayout';
import type { ResourceType } from '../features/architecture-diagram/types';

const inputClass =
  'rounded border border-line bg-canvas px-3 py-2 text-slate-100 outline-none focus:border-slate-500';

// Some relationship types are derived by the CMDB rather than stored as a
// standalone row in resource_relationships (e.g. "hospeda" between servidor e
// aplicacao is modeled via application_deployments, and "expoe" to a URL
// updates the URL's owner) — their create-relationship response carries a
// synthetic id, not a real relationship id. When that happens we tag the map
// membership by natural key (source/target/relation type) instead.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const RELATION_LABEL: Record<string, string> = {
  hosts: 'hospeda',
  depends_on: 'depende de',
  connects_to: 'conecta a',
  exposes: 'expõe',
  consumes: 'consome',
  part_of: 'parte de',
};

const nodeTypes = {
  server: ResourceNodeWithIcon as any,
  application: ResourceNodeWithIcon as any,
  database: ResourceNodeWithIcon as any,
  url: ResourceNodeWithIcon as any,
  vip: ResourceNodeWithIcon as any,
  'db-group': ResourceNodeWithIcon as any,
};

function EditMapDialog({
  isOpen,
  onClose,
  mapId,
  initialName,
  initialDescription,
}: {
  isOpen: boolean;
  onClose: () => void;
  mapId: string;
  initialName: string;
  initialDescription: string;
}) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const updateMap = useUpdateRelationshipMap(mapId);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    updateMap.mutate(
      { name: name.trim(), description: description.trim() || undefined },
      { onSuccess: () => onClose() },
    );
  }

  return (
    <Modal title="Editar Mapa" isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Nome *</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Descrição (opcional)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputClass} resize-none`}
            rows={2}
          />
        </label>
        {updateMap.isError && (
          <ErrorMessage
            message={updateMap.error instanceof Error ? updateMap.error.message : 'Erro ao salvar mapa'}
          />
        )}
        <div className="flex justify-end gap-3 border-t border-line pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={updateMap.isPending || !name.trim()}>
            {updateMap.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function MapGraph({ nodes, edges }: { nodes: RFNode[]; edges: RFEdge[] }) {
  return (
    <div className="h-[70vh] rounded border border-line bg-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: '#475569', strokeWidth: 1.25 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#475569', width: 11, height: 11 },
        }}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1.5 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1e293b" variant={BackgroundVariant.Dots} gap={20} size={1.5} />
        <Controls className="!rounded !border !border-line !bg-surface !shadow-lg [&>button]:!border-line [&>button]:!bg-surface [&>button]:!text-slate-300 [&>button:hover]:!bg-surface-raised [&_svg]:!fill-slate-300" />
      </ReactFlow>
    </div>
  );
}

export function RelationshipMapDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: map, isLoading, isError, error } = useRelationshipMap(id ?? null);
  const { data: databaseGroups } = useDatabaseGroups();
  const detachRelationship = useDetachRelationshipFromMap(id ?? '');
  const attachRelationship = useAttachRelationshipToMap(id ?? '');
  const deleteMap = useDeleteRelationshipMap();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddRelationshipOpen, setIsAddRelationshipOpen] = useState(false);
  const [isGraphOpen, setIsGraphOpen] = useState(false);

  // Visão gráfica apenas — a tabela de Relacionamentos abaixo continua
  // listando cada banco individualmente (nodeLabelById não passa por este
  // agrupamento). Mesmo critério do Ecossistema: um Agrupador de Bancos
  // curado cujos bancos (2+) estejam neste mapa colapsa num único nó, não
  // importa quantos relacionamentos reais o mapa já documenta entre eles —
  // a existência do agrupador é o gatilho, não a contagem de arestas.
  const { rfNodes, rfEdges, nodeLabelById } = useMemo(() => {
    if (!map) return { rfNodes: [] as RFNode[], rfEdges: [] as RFEdge[], nodeLabelById: new Map<string, string>() };

    const dbNodeIds = new Set(map.nodes.filter((n) => n.resourceType === 'database').map((n) => n.id));
    const dbLabelById = new Map(map.nodes.map((n) => [n.id, n.label]));

    const dbIdToGroupNodeId = new Map<string, string>();
    const groupMeta = new Map<string, { label: string; dbIds: string[] }>();

    const sortedGroups = (databaseGroups ?? [])
      .filter((g) => g.databaseIds && g.databaseIds.length > 0)
      .slice()
      .sort((a, b) => (a.databaseIds!.length - b.databaseIds!.length));

    for (const group of sortedGroups) {
      const presentDbIds = group.databaseIds!.filter((dbId) => dbNodeIds.has(dbId) && !dbIdToGroupNodeId.has(dbId));
      if (presentDbIds.length < 2) continue;
      const groupNodeId = `db-group:curated-${group.id}`;
      groupMeta.set(groupNodeId, { label: group.name, dbIds: presentDbIds });
      for (const dbId of presentDbIds) dbIdToGroupNodeId.set(dbId, groupNodeId);
    }

    function keyFor(resourceType: string, resourceId: string): string {
      const groupNodeId = resourceType === 'database' ? dbIdToGroupNodeId.get(resourceId) : undefined;
      return groupNodeId ?? `${resourceType}:${resourceId}`;
    }

    const visibleNodes = map.nodes.filter((n) => !(n.resourceType === 'database' && dbIdToGroupNodeId.has(n.id)));

    const dagreNodes = [
      ...visibleNodes.map((n) => {
        const { width, height } = getResourceNodeSize(n.resourceType as ResourceType, n.services);
        return { id: `${n.resourceType}:${n.id}`, width, height };
      }),
      ...Array.from(groupMeta.keys()).map((groupNodeId) => {
        const { width, height } = getResourceNodeSize('database' as ResourceType);
        return { id: groupNodeId, width, height };
      }),
    ];

    // Redireciona as pontas de cada relacionamento para o nó do agrupador
    // quando o banco original entrou num grupo, deduplicando arestas que
    // colapsariam para o mesmo par (origem, destino) — por exemplo, dois
    // relacionamentos distintos apontando para bancos diferentes do mesmo
    // agrupador viram uma única aresta até o nó do agrupador.
    const dagreEdges: { source: string; target: string }[] = [];
    const edgeByKey = new Map<string, RFEdge>();
    for (const e of map.edges) {
      const source = keyFor(e.sourceType, e.sourceId);
      const target = keyFor(e.targetType, e.targetId);
      if (source === target) continue; // colapsou num auto-relacionamento — descarta
      dagreEdges.push({ source, target });
      const key = `${source}->${target}`;
      if (!edgeByKey.has(key)) {
        edgeByKey.set(key, { id: `edge-${key}`, source, target });
      }
    }

    const positions = layoutWithDagre(dagreNodes, dagreEdges);

    const nodes: RFNode[] = [
      ...visibleNodes.map((n) => {
        const nodeId = `${n.resourceType}:${n.id}`;
        return {
          id: nodeId,
          type: n.resourceType,
          position: positions.get(nodeId) ?? { x: 0, y: 0 },
          data: {
            label: n.label,
            resourceType: n.resourceType as ResourceType,
            description: n.status,
            resourceId: n.id,
            services: n.services,
          },
        };
      }),
      ...Array.from(groupMeta.entries()).map(([groupNodeId, meta]) => ({
        id: groupNodeId,
        type: 'db-group',
        position: positions.get(groupNodeId) ?? { x: 0, y: 0 },
        data: {
          label: meta.label,
          resourceType: 'db-group' as ResourceType,
          description: meta.dbIds.map((dbId) => dbLabelById.get(dbId) ?? dbId).join(', '),
        },
      })),
    ];

    const edges: RFEdge[] = Array.from(edgeByKey.values());

    const labelById = new Map<string, string>();
    for (const n of map.nodes) {
      labelById.set(`${n.resourceType}:${n.id}`, n.label);
    }

    return { rfNodes: nodes, rfEdges: edges, nodeLabelById: labelById };
  }, [map, databaseGroups]);

  function describeNode(labelById: Map<string, string>, type: string, id: string): string {
    const label = labelById.get(`${type}:${id}`);
    return label ?? `${type}:${id.slice(0, 8)}`;
  }

  function handleRelationshipCreated(edge: GraphEdge): void {
    if (UUID_RE.test(edge.id)) {
      attachRelationship.mutate({ relationshipId: edge.id });
      return;
    }

    // Implicit relationship (e.g. "hospeda" servidor->aplicacao, "expoe" ->url) —
    // there's no standalone relationship row to point at, so tag it by its
    // source/target/relation-type instead.
    attachRelationship.mutate({
      sourceType: edge.sourceType as MapResourceType,
      sourceId: edge.sourceId,
      targetType: edge.targetType as MapResourceType,
      targetId: edge.targetId,
      relationType: edge.relationType,
    });
  }

  function handleDeleteMap(): void {
    if (!id) return;
    if (!confirm(`Tem certeza que deseja eliminar o mapa "${map?.name}"? Os relacionamentos em si não são afetados.`)) return;
    deleteMap.mutate(id, { onSuccess: () => navigate('/relationship-maps') });
  }

  if (isLoading) {
    return (
      <div>
        <Link to="/relationship-maps" className="text-sm text-slate-400 hover:underline">
          &larr; Voltar aos mapas
        </Link>
        <Spinner />
      </div>
    );
  }

  if (isError || !map) {
    return (
      <div>
        <Link to="/relationship-maps" className="text-sm text-slate-400 hover:underline">
          &larr; Voltar aos mapas
        </Link>
        <ErrorMessage message={error instanceof Error ? error.message : 'Mapa não encontrado'} />
      </div>
    );
  }

  return (
    <div>
      <Link to="/relationship-maps" className="text-sm text-slate-400 hover:underline">
        &larr; Voltar aos mapas
      </Link>

      <PageHeader
        title={map.name}
        description={map.description || 'Sem descrição'}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={<PencilIcon />} onClick={() => setIsEditOpen(true)}>
              Editar
            </Button>
            <Button variant="ghost-danger" size="sm" icon={<TrashIcon />} onClick={handleDeleteMap}>
              Eliminar Mapa
            </Button>
            <Button size="sm" onClick={() => setIsGraphOpen(true)} disabled={rfNodes.length === 0}>
              Ver graficamente
            </Button>
          </div>
        }
      />

      <EditMapDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        mapId={map.id}
        initialName={map.name}
        initialDescription={map.description ?? ''}
      />

      <AddRelationshipDialog
        isOpen={isAddRelationshipOpen}
        onClose={() => setIsAddRelationshipOpen(false)}
        onCreated={handleRelationshipCreated}
      />

      <Modal title={`${map.name} — visão gráfica`} isOpen={isGraphOpen} onClose={() => setIsGraphOpen(false)} size="lg">
        <MapGraph nodes={rfNodes} edges={rfEdges} />
      </Modal>

      {attachRelationship.isError && (
        <div className="mb-4">
          <ErrorMessage
            message={
              attachRelationship.error instanceof Error
                ? attachRelationship.error.message
                : 'Erro ao adicionar relacionamento ao mapa'
            }
          />
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300">
          Relacionamentos ({map.edges.length})
        </h2>
        <Button size="sm" icon={<PlusIcon />} onClick={() => setIsAddRelationshipOpen(true)}>
          Adicionar Relacionamento
        </Button>
      </div>

      {map.edges.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 rounded border border-dashed border-line p-10 text-center">
          <p className="font-medium text-slate-200">Este mapa ainda não tem relacionamentos</p>
          <p className="text-sm text-slate-500">
            Use &quot;Adicionar Relacionamento&quot; para começar a documentar esta arquitetura.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium">Origem</th>
                <th className="px-4 py-2 font-medium">Relação</th>
                <th className="px-4 py-2 font-medium">Destino</th>
                <th className="px-4 py-2 font-medium">Motivo</th>
                <th className="w-10 px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {map.edges.map((edge: RelationshipMapEdge) => (
                <tr key={edge.id} className="border-t border-line">
                  <td className="px-4 py-2 font-medium text-slate-200">
                    {describeNode(nodeLabelById, edge.sourceType, edge.sourceId)}
                  </td>
                  <td className="px-4 py-2 text-slate-400">
                    {RELATION_LABEL[edge.relationType] ?? edge.relationType}
                    {edge.isImplicit && (
                      <span
                        className="ml-2 rounded border border-line px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-500"
                        title="Este relacionamento e derivado automaticamente pelo CMDB (ex: deployments, dono da URL) e nao tem um registro proprio em Relacionamentos."
                      >
                        derivado
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 font-medium text-slate-200">
                    {describeNode(nodeLabelById, edge.targetType, edge.targetId)}
                  </td>
                  <td className="px-4 py-2 text-slate-500">{edge.reason || '—'}</td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => detachRelationship.mutate(edge.id)}
                      className="text-slate-500 hover:text-red-400"
                      title="Remover deste mapa"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
