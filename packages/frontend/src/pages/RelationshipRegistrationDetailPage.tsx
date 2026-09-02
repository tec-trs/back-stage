import { useMemo, useState } from 'react';
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
import { ResourceNodeWithIcon } from '../features/architecture-diagram/ResourceNodeWithIcon';
import { getResourceNodeSize } from '../features/architecture-diagram/nodeSizing';
import { layoutWithDagre } from '../features/architecture-diagram/dagreLayout';
import type { ResourceType } from '../features/architecture-diagram/types';
import {
  useDeleteRelationshipRegistration,
  useRelationshipRegistration,
  useAddRelationshipToRegistration,
  useRemoveRelationshipFromRegistration,
  type RegisteredRelationship,
} from '../features/relationship-registrations/use-relationship-registrations';
import { RelationshipRegistrationDialog } from '../features/relationship-registrations/RelationshipRegistrationDialog';

const nodeTypes = {
  server: ResourceNodeWithIcon as any,
  application: ResourceNodeWithIcon as any,
  database: ResourceNodeWithIcon as any,
  url: ResourceNodeWithIcon as any,
  vip: ResourceNodeWithIcon as any,
  'db-group': ResourceNodeWithIcon as any,
};

const RELATION_LABEL: Record<string, string> = {
  hosts: 'hospeda',
  depends_on: 'depende de',
  connects_to: 'conecta a',
  exposes: 'expõe',
  consumes: 'consome',
  part_of: 'parte de',
};

function EditRegistrationDialog({
  isOpen,
  onClose,
  registration,
}: {
  isOpen: boolean;
  onClose: () => void;
  registration: any;
}) {
  return (
    <RelationshipRegistrationDialog
      isOpen={isOpen}
      onClose={onClose}
      registration={registration}
    />
  );
}

function RegistrationGraph({ nodes, edges }: { nodes: RFNode[]; edges: RFEdge[] }) {
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

export function RelationshipRegistrationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: registration, isLoading, isError, error } = useRelationshipRegistration(id ?? null);
  const { data: databaseGroups } = useDatabaseGroups();
  const removeRelationship = useRemoveRelationshipFromRegistration(id ?? '');
  const addRelationship = useAddRelationshipToRegistration(id ?? '');
  const deleteRegistration = useDeleteRelationshipRegistration();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddRelationshipOpen, setIsAddRelationshipOpen] = useState(false);
  const [isGraphOpen, setIsGraphOpen] = useState(false);

  const { rfNodes, rfEdges } = useMemo(() => {
    if (!registration) return { rfNodes: [] as RFNode[], rfEdges: [] as RFEdge[] };

    const nodeMap = new Map<string, any>();
    const edges: { source: string; target: string; label: string }[] = [];

    for (const rel of registration.relationships) {
      const sourceKey = `${rel.sourceType}:${rel.sourceId}`;
      const targetKey = `${rel.targetType}:${rel.targetId}`;

      if (!nodeMap.has(sourceKey)) {
        nodeMap.set(sourceKey, {
          id: sourceKey,
          type: rel.sourceType,
          label: rel.sourceLabel,
          resourceType: rel.sourceType,
        });
      }

      if (!nodeMap.has(targetKey)) {
        nodeMap.set(targetKey, {
          id: targetKey,
          type: rel.targetType,
          label: rel.targetLabel,
          resourceType: rel.targetType,
        });
      }

      edges.push({
        source: sourceKey,
        target: targetKey,
        label: rel.relationType,
      });
    }

    const dagreNodes = Array.from(nodeMap.values()).map((n) => {
      const { width, height } = getResourceNodeSize(n.resourceType as ResourceType);
      return { id: n.id, width, height };
    });

    const dagreEdges = edges.map((e) => ({ source: e.source, target: e.target }));
    const positions = layoutWithDagre(dagreNodes, dagreEdges);

    const rfNodes = Array.from(nodeMap.values()).map((n) => ({
      id: n.id,
      type: n.resourceType,
      position: positions.get(n.id) ?? { x: 0, y: 0 },
      data: {
        label: n.label,
        resourceType: n.resourceType as ResourceType,
        resourceId: n.id.split(':')[1],
      },
    }));

    const rfEdges = edges.map((e) => ({
      id: `${e.source}->${e.target}`,
      source: e.source,
      target: e.target,
    }));

    return { rfNodes, rfEdges };
  }, [registration, databaseGroups]);

  function handleRelationshipCreated(edge: GraphEdge): void {
    removeRelationship.reset();
    addRelationship.mutate(
      {
        sourceType: edge.sourceType,
        sourceId: edge.sourceId,
        targetType: edge.targetType,
        targetId: edge.targetId,
        relationType: edge.relationType,
        reason: edge.reason ?? undefined,
      },
      { onSuccess: () => setIsAddRelationshipOpen(false) },
    );
  }

  function handleDeleteRegistration(): void {
    if (!id) return;
    if (!confirm(`Tem certeza que deseja eliminar o cadastro "${registration?.name}"? Os relacionamentos em si não são afetados.`)) {
      return;
    }
    deleteRegistration.mutate(id, { onSuccess: () => navigate('/relationship-registrations') });
  }

  if (isLoading) {
    return (
      <div>
        <Link to="/relationship-registrations" className="text-sm text-slate-400 hover:underline">
          &larr; Voltar aos cadastros
        </Link>
        <Spinner />
      </div>
    );
  }

  if (isError || !registration) {
    return (
      <div>
        <Link to="/relationship-registrations" className="text-sm text-slate-400 hover:underline">
          &larr; Voltar aos cadastros
        </Link>
        <ErrorMessage
          message={error instanceof Error ? error.message : 'Cadastro não encontrado'}
        />
      </div>
    );
  }

  return (
    <div>
      <Link to="/relationship-registrations" className="text-sm text-slate-400 hover:underline">
        &larr; Voltar aos cadastros
      </Link>

      <PageHeader
        title={registration.name}
        description={registration.description || 'Sem descrição'}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<PencilIcon />}
              onClick={() => setIsEditOpen(true)}
            >
              Editar
            </Button>
            <Button
              variant="ghost-danger"
              size="sm"
              icon={<TrashIcon />}
              onClick={handleDeleteRegistration}
            >
              Eliminar
            </Button>
            <Button
              size="sm"
              onClick={() => setIsGraphOpen(true)}
              disabled={registration.relationships.length === 0}
            >
              Ver graficamente
            </Button>
          </div>
        }
      />

      <EditRegistrationDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        registration={registration}
      />

      <AddRelationshipDialog
        isOpen={isAddRelationshipOpen}
        onClose={() => setIsAddRelationshipOpen(false)}
        onCreated={handleRelationshipCreated}
      />

      <Modal
        title={`${registration.name} — visão gráfica`}
        isOpen={isGraphOpen}
        onClose={() => setIsGraphOpen(false)}
        size="lg"
      >
        <RegistrationGraph nodes={rfNodes} edges={rfEdges} />
      </Modal>

      {removeRelationship.isError && (
        <div className="mb-4">
          <ErrorMessage
            message={
              removeRelationship.error instanceof Error
                ? removeRelationship.error.message
                : 'Erro ao remover relacionamento'
            }
          />
        </div>
      )}

      {addRelationship.isError && (
        <div className="mb-4">
          <ErrorMessage
            message={
              addRelationship.error instanceof Error
                ? addRelationship.error.message
                : 'Erro ao adicionar relacionamento'
            }
          />
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300">
          Relacionamentos ({registration.relationships.length})
        </h2>
        <Button
          size="sm"
          icon={<PlusIcon />}
          onClick={() => setIsAddRelationshipOpen(true)}
        >
          Adicionar Relacionamento
        </Button>
      </div>

      {registration.relationships.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 rounded border border-dashed border-line p-10 text-center">
          <p className="font-medium text-slate-200">Este cadastro ainda não tem relacionamentos</p>
          <p className="text-sm text-slate-500">
            Use &quot;Adicionar Relacionamento&quot; para começar a documentar dependências e fluxos.
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
              {registration.relationships.map((rel: RegisteredRelationship) => (
                <tr key={rel.id} className="border-t border-line">
                  <td className="px-4 py-2 font-medium text-slate-200">{rel.sourceLabel}</td>
                  <td className="px-4 py-2 text-slate-400">
                    {RELATION_LABEL[rel.relationType] ?? rel.relationType}
                  </td>
                  <td className="px-4 py-2 font-medium text-slate-200">{rel.targetLabel}</td>
                  <td className="px-4 py-2 text-slate-500">{rel.reason || '—'}</td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => removeRelationship.mutate(rel.id)}
                      className="text-slate-500 hover:text-red-400"
                      title="Remover deste cadastro"
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
