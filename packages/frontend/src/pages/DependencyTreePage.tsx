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
  server: '#3b82f6',
  application: '#8b5cf6',
  database: '#ec4899',
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
  const deleteRelationship = useDeleteRelationship();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedSource, setSelectedSource] = useState<ResourceOption | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<ResourceOption | null>(null);
  const [relationType, setRelationType] = useState('exposes');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [positions, setPositions] = useState<Map<string, Position>>(new Map());

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
    const spacing = 150;

    resourcesArray.forEach((id, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      map.set(id, {
        x: col * spacing + 50,
        y: row * spacing + 50,
      });
    });

    return map;
  }, [graphQuery.data]);

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

    // Desenhar edges (linhas)
    ctx.strokeStyle = '#475569';
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
        const arrowSize = 10;
        ctx.fillStyle = '#475569';
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
      const boxWidth = 100;
      const boxHeight = 60;

      // Desenhar retângulo
      ctx.fillStyle = color;
      ctx.fillRect(pos.x - boxWidth / 2, pos.y - boxHeight / 2, boxWidth, boxHeight);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(pos.x - boxWidth / 2, pos.y - boxHeight / 2, boxWidth, boxHeight);

      // Desenhar ícone e texto
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const icon = RESOURCE_ICONS[node.resourceType] || '📦';
      const lines = node.label.split(' ');

      ctx.font = '12px Arial';
      ctx.fillText(icon, pos.x, pos.y - 15);

      ctx.font = 'bold 11px Arial';
      lines.slice(0, 2).forEach((line, i) => {
        ctx.fillText(line.substring(0, 10), pos.x, pos.y + 5 + (i * 12));
      });
    }
  }, [graphQuery.data, layoutPositions]);

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
              style={{ display: 'block', width: '100%', height: '600px' }}
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
