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
import { AddRelationshipDialog } from '../features/resource-graph/AddRelationshipDialog';
import type { GraphEdge } from '../features/resource-graph/use-resource-graph';
import {
  useDeleteRelationshipMap,
  useDetachRelationshipFromMap,
  useAttachRelationshipToMap,
  useRelationshipMap,
  useUpdateRelationshipMap,
  type RelationshipMapEdge,
} from '../features/relationship-maps/use-relationship-maps';
import { ResourceNodeWithIcon } from '../features/architecture-diagram/ResourceNodeWithIcon';
import { layoutWithDagre } from '../features/architecture-diagram/dagreLayout';
import type { ResourceType } from '../features/architecture-diagram/types';

const inputClass =
  'rounded-md border border-slate-700 bg-canvas px-3 py-2 text-slate-100 outline-none focus:border-slate-500';

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
        <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
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
    <div className="h-[70vh] rounded-lg border border-line bg-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{
          type: 'straight',
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
        <Controls className="!rounded-md !border !border-line !bg-surface !shadow-lg [&>button]:!border-line [&>button]:!bg-surface [&>button]:!text-slate-300 [&>button:hover]:!bg-surface-raised [&_svg]:!fill-slate-300" />
      </ReactFlow>
    </div>
  );
}

export function RelationshipMapDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: map, isLoading, isError, error } = useRelationshipMap(id ?? null);
  const detachRelationship = useDetachRelationshipFromMap(id ?? '');
  const attachRelationship = useAttachRelationshipToMap(id ?? '');
  const deleteMap = useDeleteRelationshipMap();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddRelationshipOpen, setIsAddRelationshipOpen] = useState(false);
  const [isGraphOpen, setIsGraphOpen] = useState(false);

  const { rfNodes, rfEdges, nodeLabelById } = useMemo(() => {
    if (!map) return { rfNodes: [] as RFNode[], rfEdges: [] as RFEdge[], nodeLabelById: new Map<string, string>() };

    const dagreNodes = map.nodes.map((n) => ({ id: `${n.resourceType}:${n.id}` }));
    const dagreEdges = map.edges.map((e) => ({
      source: `${e.sourceType}:${e.sourceId}`,
      target: `${e.targetType}:${e.targetId}`,
    }));
    const positions = layoutWithDagre(dagreNodes, dagreEdges);

    const nodes: RFNode[] = map.nodes.map((n) => {
      const nodeId = `${n.resourceType}:${n.id}`;
      return {
        id: nodeId,
        type: n.resourceType,
        position: positions.get(nodeId) ?? { x: 0, y: 0 },
        data: { label: n.label, resourceType: n.resourceType as ResourceType, description: n.status, resourceId: n.id },
      };
    });

    const edges: RFEdge[] = map.edges.map((e) => ({
      id: e.id,
      source: `${e.sourceType}:${e.sourceId}`,
      target: `${e.targetType}:${e.targetId}`,
    }));

    const labelById = new Map<string, string>();
    for (const n of map.nodes) {
      labelById.set(`${n.resourceType}:${n.id}`, n.label);
    }

    return { rfNodes: nodes, rfEdges: edges, nodeLabelById: labelById };
  }, [map]);

  function describeNode(labelById: Map<string, string>, type: string, id: string): string {
    const label = labelById.get(`${type}:${id}`);
    return label ?? `${type}:${id.slice(0, 8)}`;
  }

  function handleRelationshipCreated(edge: GraphEdge): void {
    attachRelationship.mutate(edge.id);
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

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300">
          Relacionamentos ({map.edges.length})
        </h2>
        <Button size="sm" icon={<PlusIcon />} onClick={() => setIsAddRelationshipOpen(true)}>
          Adicionar Relacionamento
        </Button>
      </div>

      {map.edges.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-800 p-10 text-center">
          <p className="font-medium text-slate-200">Este mapa ainda não tem relacionamentos</p>
          <p className="text-sm text-slate-500">
            Use &quot;Adicionar Relacionamento&quot; para começar a documentar esta arquitetura.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400">
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
                <tr key={edge.id} className="border-t border-slate-800">
                  <td className="px-4 py-2 font-medium text-slate-200">
                    {describeNode(nodeLabelById, edge.sourceType, edge.sourceId)}
                  </td>
                  <td className="px-4 py-2 text-slate-400">{RELATION_LABEL[edge.relationType] ?? edge.relationType}</td>
                  <td className="px-4 py-2 font-medium text-slate-200">
                    {describeNode(nodeLabelById, edge.targetType, edge.targetId)}
                  </td>
                  <td className="px-4 py-2 text-slate-500">{edge.reason || '—'}</td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => detachRelationship.mutate(edge.relationshipId)}
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
