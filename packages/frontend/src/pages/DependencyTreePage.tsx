import { useState, useMemo, useRef, useEffect } from 'react';
import { useAllApplications } from '../features/applications/use-applications';
import { useAllServers } from '../features/servers/use-servers';
import { useAllUrls } from '../features/urls/use-urls';
import { useAllDatabases } from '../features/databases/use-databases';
import { useCreateRelationship, useFullGraph, useDeleteRelationship } from '../features/resource-graph/use-resource-graph';
import { PageHeader } from '../shared/components/PageHeader';
import { Button } from '../shared/components/Button';
import { Spinner } from '../shared/components/Spinner';

interface ResourceOption {
  id: string;
  label: string;
  type: 'server' | 'application' | 'database' | 'url';
}

interface Position {
  x: number;
  y: number;
}

interface Node {
  id: string;
  label: string;
  type: 'server' | 'application' | 'database' | 'url';
  children?: string[];
}

const COLORS: Record<string, string> = {
  server: '#6366f1',
  application: '#8b5cf6',
  database: '#f43f5e',
  url: '#f59e0b',
};

const RELATION_TYPES = [
  { value: 'exposes', label: 'Expõe' },
  { value: 'hosts', label: 'Hospeda' },
  { value: 'depends_on', label: 'Depende de' },
  { value: 'connects_to', label: 'Conecta a' },
  { value: 'consumes', label: 'Consome' },
];

export function DependencyTreePage() {
  const applicationsQuery = useAllApplications();
  const serversQuery = useAllServers();
  const urlsQuery = useAllUrls();
  const databasesQuery = useAllDatabases();
  const graphQuery = useFullGraph({ page: 1, pageSize: 500 });
  const createRelationship = useCreateRelationship();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedSource, setSelectedSource] = useState<ResourceOption | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<ResourceOption | null>(null);
  const [relationType, setRelationType] = useState('exposes');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [positions, setPositions] = useState<Map<string, Position>>(new Map());
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const allResources: ResourceOption[] = useMemo(() => [
    ...(serversQuery.data?.map(s => ({ id: s.id, label: s.displayName || s.hostname, type: 'server' as const })) || []),
    ...(applicationsQuery.data?.map(a => ({ id: a.id, label: a.displayName || a.code, type: 'application' as const })) || []),
    ...(databasesQuery.data?.map(d => ({ id: d.id, label: d.displayName || d.name, type: 'database' as const })) || []),
    ...(urlsQuery.data?.map(u => ({ id: u.id, label: u.label || u.url, type: 'url' as const })) || []),
  ], [serversQuery.data, applicationsQuery.data, databasesQuery.data, urlsQuery.data]);

  const isLoading = applicationsQuery.isLoading || serversQuery.isLoading || urlsQuery.isLoading || databasesQuery.isLoading;

  // Organizar dados hierarquicamente
  const hierarchyData = useMemo(() => {
    if (!graphQuery.data) return { nodes: [], edges: [] };

    const nodeMap = new Map(graphQuery.data.nodes.map(n => [n.id, n]));
    const serversWithApps = new Map<string, string[]>();

    // Agrupar aplicações por servidor (relação hosts)
    for (const edge of graphQuery.data.edges) {
      if (edge.relationType === 'hosts' && edge.sourceType === 'server') {
        if (!serversWithApps.has(edge.sourceId)) {
          serversWithApps.set(edge.sourceId, []);
        }
        serversWithApps.get(edge.sourceId)!.push(edge.targetId);
      }
    }

    return { nodes: graphQuery.data.nodes, edges: graphQuery.data.edges, serversWithApps };
  }, [graphQuery.data]);

  // Calcular posições em grid
  const layoutPositions = useMemo(() => {
    const map = new Map<string, Position>();
    if (!hierarchyData.nodes || hierarchyData.nodes.length === 0) return map;

    // Separar por tipo
    const servers = hierarchyData.nodes.filter(n => n.resourceType === 'server');
    const urls = hierarchyData.nodes.filter(n => n.resourceType === 'url');
    const databases = hierarchyData.nodes.filter(n => n.resourceType === 'database');
    const apps = hierarchyData.nodes.filter(n => n.resourceType === 'application');

    let y = 60;
    const spacing = 200;
    const colWidth = 200;

    // URLs no topo
    urls.forEach((node, i) => {
      const x = i * colWidth + 100;
      if (positions.has(node.id)) {
        map.set(node.id, positions.get(node.id)!);
      } else {
        map.set(node.id, { x, y });
      }
    });

    // Servidores abaixo
    y += spacing * 1.5;
    servers.forEach((node, i) => {
      const x = i * colWidth + 100;
      if (positions.has(node.id)) {
        map.set(node.id, positions.get(node.id)!);
      } else {
        map.set(node.id, { x, y });
      }
    });

    // Bancos de dados em outra seção
    y += spacing * 2;
    databases.forEach((node, i) => {
      const x = i * colWidth + 100;
      if (positions.has(node.id)) {
        map.set(node.id, positions.get(node.id)!);
      } else {
        map.set(node.id, { x, y });
      }
    });

    return map;
  }, [hierarchyData.nodes, positions]);

  // Handlers de mouse
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
    const mouseY = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);

    for (const [nodeId, pos] of layoutPositions) {
      const dx = Math.abs(mouseX - pos.x);
      const dy = Math.abs(mouseY - pos.y);

      if (dx < 90 && dy < 40) {
        setDraggingNode(nodeId);
        setDragOffset({ x: mouseX - pos.x, y: mouseY - pos.y });
        return;
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingNode || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
    const mouseY = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);

    const newPositions = new Map(positions);
    newPositions.set(draggingNode, {
      x: mouseX - dragOffset.x,
      y: mouseY - dragOffset.y,
    });

    setPositions(newPositions);
  };

  const handleCanvasMouseUp = () => {
    setDraggingNode(null);
  };

  // Desenhar canvas
  useEffect(() => {
    if (!canvasRef.current || !hierarchyData.nodes) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < canvas.width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }

    // Desenhar edges (linhas)
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    for (const edge of hierarchyData.edges) {
      const sourcePos = layoutPositions.get(edge.sourceId);
      const targetPos = layoutPositions.get(edge.targetId);
      if (sourcePos && targetPos) {
        ctx.beginPath();
        ctx.moveTo(sourcePos.x, sourcePos.y + 30);
        ctx.lineTo(targetPos.x, targetPos.y - 30);
        ctx.stroke();

        // Label
        const midX = (sourcePos.x + targetPos.x) / 2;
        const midY = (sourcePos.y + targetPos.y) / 2;
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        const label = edge.relationType.replace('_', ' ');
        ctx.fillText(label, midX, midY - 5);
      }
    }

    // Desenhar nodes
    const nodeMap = new Map(hierarchyData.nodes.map(n => [n.id, n]));
    for (const [nodeId, pos] of layoutPositions) {
      const node = nodeMap.get(nodeId);
      if (!node) continue;

      const color = COLORS[node.resourceType];
      const isDragging = nodeId === draggingNode;
      const width = 180;
      const height = 70;

      // Sombra
      if (isDragging) {
        ctx.shadowColor = color + '99';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 8;
      }

      // Borda tracejada
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(pos.x - width / 2, pos.y - height / 2, width, height);
      ctx.setLineDash([]);
      ctx.shadowColor = 'rgba(0, 0, 0, 0)';

      // Ícone e texto
      ctx.fillStyle = color;
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`● ${node.resourceType.toUpperCase()}`, pos.x - width / 2 + 10, pos.y - height / 2 + 15);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px Arial';
      ctx.textAlign = 'left';
      const lines = node.label.split(' ');
      lines.slice(0, 2).forEach((line, i) => {
        ctx.fillText(line.substring(0, 20), pos.x - width / 2 + 10, pos.y + 5 + (i * 15));
      });

      // Aplicações hospedadas (se servidor)
      if (node.resourceType === 'server' && hierarchyData.serversWithApps?.has(nodeId)) {
        const apps = hierarchyData.serversWithApps.get(nodeId) || [];
        apps.slice(0, 2).forEach((appId, i) => {
          const app = nodeMap.get(appId);
          if (app) {
            ctx.fillStyle = 'rgba(139, 92, 246, 0.8)';
            ctx.fillRect(pos.x - width / 2 + 5, pos.y + 15 + (i * 18), width - 10, 16);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(app.label.substring(0, 18), pos.x, pos.y + 26 + (i * 18));
          }
        });
      }
    }
  }, [hierarchyData, layoutPositions, draggingNode]);

  const handleAddLink = async () => {
    if (!selectedSource || !selectedTarget) {
      setMessage({ type: 'error', text: 'Selecione origem e destino' });
      return;
    }

    if (selectedSource.id === selectedTarget.id) {
      setMessage({ type: 'error', text: 'Não pode linkar um recurso a si mesmo' });
      return;
    }

    try {
      await createRelationship.mutateAsync({
        sourceType: selectedSource.type,
        sourceId: selectedSource.id,
        targetType: selectedTarget.type,
        targetId: selectedTarget.id,
        relationType,
      });

      setSelectedSource(null);
      setSelectedTarget(null);
      setMessage({ type: 'success', text: '✅ Relacionamento criado!' });
      await graphQuery.refetch();
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Erro ao criar' });
    }
  };

  if (isLoading || graphQuery.isLoading) return <Spinner />;

  return (
    <div style={{ padding: '16px' }}>
      <PageHeader
        title="Mapa de Dependências"
        description="Visualize e organize sua infraestrutura"
      />

      {message && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            borderRadius: '4px',
            backgroundColor: message.type === 'success' ? '#064e3b' : '#7f1d1d',
            border: `1px solid ${message.type === 'success' ? '#10b981' : '#dc2626'}`,
            color: message.type === 'success' ? '#10b981' : '#fca5a5',
          }}
        >
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '16px' }}>
        {/* Painel de Controle */}
        <div style={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', padding: '16px', height: 'fit-content' }}>
          <h3 style={{ color: '#e5e7eb', marginBottom: '12px', fontSize: '14px', fontWeight: 600 }}>Novo Link</h3>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: '4px' }}>De:</label>
            <select
              value={selectedSource?.id || ''}
              onChange={e => {
                const res = allResources.find(r => r.id === e.target.value);
                setSelectedSource(res || null);
              }}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#1f2937',
                color: '#e5e7eb',
                border: '1px solid #374151',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              <option value="">Selecione...</option>
              {allResources.map(r => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Tipo:</label>
            <select
              value={relationType}
              onChange={e => setRelationType(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#1f2937',
                color: '#e5e7eb',
                border: '1px solid #374151',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              {RELATION_TYPES.map(rt => (
                <option key={rt.value} value={rt.value}>
                  {rt.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Para:</label>
            <select
              value={selectedTarget?.id || ''}
              onChange={e => {
                const res = allResources.find(r => r.id === e.target.value);
                setSelectedTarget(res || null);
              }}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#1f2937',
                color: '#e5e7eb',
                border: '1px solid #374151',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              <option value="">Selecione...</option>
              {allResources.map(r => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={handleAddLink}
            style={{ width: '100%', padding: '10px' }}
            disabled={!selectedSource || !selectedTarget}
          >
            ➕ Adicionar
          </Button>
        </div>

        {/* Canvas */}
        <div style={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', overflow: 'hidden' }}>
          {hierarchyData.edges && hierarchyData.edges.length > 0 ? (
            <canvas
              ref={canvasRef}
              width={1200}
              height={700}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              style={{
                display: 'block',
                width: '100%',
                height: '700px',
                cursor: draggingNode ? 'grabbing' : 'grab',
              }}
            />
          ) : (
            <div style={{ height: '700px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
              📭 Nenhuma dependência. Adicione links para começar!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
