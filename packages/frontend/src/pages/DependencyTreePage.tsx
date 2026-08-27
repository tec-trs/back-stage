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

const RESOURCE_ICONS: Record<string, string> = {
  server: '🖥️',
  application: '📱',
  database: '📊',
  url: '🔗',
};

const COLORS: Record<string, string> = {
  server: '#06b6d4',      // cyan
  application: '#8b5cf6', // purple
  database: '#ec4899',    // pink
  url: '#10b981',         // green
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
  const deleteRelationship = useDeleteRelationship();

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

  // Calcular posições do layout (grid)
  const layoutPositions = useMemo(() => {
    const map = new Map<string, Position>();
    const resourcesInGraph = new Set<string>();

    if (graphQuery.data) {
      for (const edge of graphQuery.data.edges) {
        resourcesInGraph.add(edge.sourceId);
        resourcesInGraph.add(edge.targetId);
      }
    }

    const resourcesArray = Array.from(resourcesInGraph);
    const cols = Math.ceil(Math.sqrt(resourcesArray.length)) || 1;
    const spacing = 200;

    resourcesArray.forEach((id, index) => {
      // Se já tem posição arrastada, usar
      if (positions.has(id)) {
        map.set(id, positions.get(id)!);
      } else {
        // Senão, usar grid
        const row = Math.floor(index / cols);
        const col = index % cols;
        map.set(id, {
          x: col * spacing + 100,
          y: row * spacing + 100,
        });
      }
    });

    return map;
  }, [graphQuery.data, positions]);

  // Handlers de mouse para drag and drop
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const boxSize = 110;

    // Detectar qual nó foi clicado
    for (const [nodeId, pos] of layoutPositions) {
      const dx = mouseX - pos.x;
      const dy = mouseY - pos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < boxSize / 2) {
        setDraggingNode(nodeId);
        setDragOffset({ x: dx, y: dy });
        return;
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingNode || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

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

  // Desenhar grafo no canvas
  useEffect(() => {
    if (!canvasRef.current || !graphQuery.data) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Grid de fundo (opcional)
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let i = 0; i < height; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }

    // Desenhar edges (linhas)
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    for (const edge of graphQuery.data.edges) {
      const sourcePos = layoutPositions.get(edge.sourceId);
      const targetPos = layoutPositions.get(edge.targetId);
      if (sourcePos && targetPos) {
        ctx.beginPath();
        ctx.moveTo(sourcePos.x, sourcePos.y);
        ctx.lineTo(targetPos.x, targetPos.y);
        ctx.stroke();

        // Desenhar seta
        const angle = Math.atan2(targetPos.y - sourcePos.y, targetPos.x - sourcePos.x);
        const arrowSize = 12;
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.moveTo(targetPos.x, targetPos.y);
        ctx.lineTo(targetPos.x - arrowSize * Math.cos(angle - Math.PI / 6), targetPos.y - arrowSize * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(targetPos.x - arrowSize * Math.cos(angle + Math.PI / 6), targetPos.y - arrowSize * Math.sin(angle + Math.PI / 6));
        ctx.fill();
      }
    }

    // Desenhar nós (caixas)
    const nodeMap = new Map(graphQuery.data.nodes.map(n => [n.id, n]));
    for (const [nodeId, pos] of layoutPositions) {
      const node = nodeMap.get(nodeId);
      if (!node) continue;

      const color = COLORS[node.resourceType] || '#6b7280';
      const boxWidth = 110;
      const boxHeight = 80;
      const isDragging = nodeId === draggingNode;

      // Desenhar sombra (se arrastar)
      if (isDragging) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
      }

      // Desenhar retângulo arredondado
      ctx.fillStyle = color;
      ctx.globalAlpha = isDragging ? 0.95 : 0.85;
      roundRect(ctx, pos.x - boxWidth / 2, pos.y - boxHeight / 2, boxWidth, boxHeight, 8);
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.shadowColor = 'rgba(0, 0, 0, 0)';

      // Borda
      ctx.strokeStyle = isDragging ? '#ffffff' : '#e2e8f0';
      ctx.lineWidth = isDragging ? 3 : 2;
      roundRect(ctx, pos.x - boxWidth / 2, pos.y - boxHeight / 2, boxWidth, boxHeight, 8);
      ctx.stroke();

      // Desenhar ícone e texto
      ctx.fillStyle = '#ffffff';
      const icon = RESOURCE_ICONS[node.resourceType] || '📦';
      const lines = node.label.split(' ');

      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icon, pos.x, pos.y - 20);

      ctx.font = 'bold 11px Arial';
      ctx.fillStyle = '#ffffff';
      lines.slice(0, 2).forEach((line, i) => {
        ctx.fillText(line.substring(0, 12), pos.x, pos.y + 15 + (i * 13));
      });
    }
  }, [graphQuery.data, layoutPositions, draggingNode]);

  // Helper para desenhar retângulo arredondado
  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

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
        title="Construtor de Dependências"
        description="Construa sua árvore de dependências visualmente"
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
            style={{ width: '100%', padding: '10px', marginBottom: '8px' }}
            disabled={!selectedSource || !selectedTarget}
          >
            ➕ Adicionar
          </Button>

          {graphQuery.data && graphQuery.data.edges.length > 0 && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #374151' }}>
              <h4 style={{ color: '#e5e7eb', fontSize: '12px', marginBottom: '8px' }}>Links ({graphQuery.data.edges.length})</h4>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {graphQuery.data.edges.map(edge => (
                  <div
                    key={edge.id}
                    style={{
                      padding: '8px',
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '4px',
                      marginBottom: '4px',
                      fontSize: '11px',
                      color: '#9ca3af',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>{edge.relationType}</span>
                    <button
                      onClick={() => deleteRelationship.mutate(edge.id, { onSuccess: () => graphQuery.refetch() })}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Canvas de Visualização */}
        <div style={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', overflow: 'hidden' }}>
          {graphQuery.data && graphQuery.data.edges.length > 0 ? (
            <canvas
              ref={canvasRef}
              width={1000}
              height={600}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              style={{
                display: 'block',
                width: '100%',
                height: '600px',
                cursor: draggingNode ? 'grabbing' : 'grab',
              }}
            />
          ) : (
            <div style={{ height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
              📭 Nenhuma dependência mapeada. Comece adicionando links!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
