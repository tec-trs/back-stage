import { useState, useMemo, useRef, useEffect } from 'react';
import { useAllApplications } from '../features/applications/use-applications';
import { useAllServers } from '../features/servers/use-servers';
import { useAllUrls } from '../features/urls/use-urls';
import { useAllDatabases } from '../features/databases/use-databases';
import { useCreateRelationship, useFullGraph, useSaveNodePositions, useGetNodePositions, useClearNodePositions } from '../features/resource-graph/use-resource-graph';
import { PageHeader } from '../shared/components/PageHeader';
import { Button } from '../shared/components/Button';
import { Spinner } from '../shared/components/Spinner';

interface ResourceOption {
  id: string;
  label: string;
  type: 'server' | 'application' | 'database' | 'url';
}

interface PendingLink {
  id: string;
  source: ResourceOption;
  target: ResourceOption;
  relationType: string;
}

interface Position {
  x: number;
  y: number;
}

const COLORS: Record<string, string> = {
  server: '#0ea5e9',
  application: '#06b6d4',
  database: '#ec4899',
  url: '#84cc16',
};

const ICONS: Record<string, string> = {
  server: '🖥️',
  application: '📱',
  database: '🗄️',
  url: '🌐',
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
  const savePositions = useSaveNodePositions();
  const getPositions = useGetNodePositions();
  const clearPositions = useClearNodePositions();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedSource, setSelectedSource] = useState<ResourceOption | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<ResourceOption | null>(null);
  const [relationType, setRelationType] = useState('exposes');
  const [pendingLinks, setPendingLinks] = useState<PendingLink[]>([]);
  const [showGraph, setShowGraph] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [nodePositions, setNodePositions] = useState<Map<string, Position>>(new Map());

  const allResources: ResourceOption[] = useMemo(() => [
    ...(serversQuery.data?.map(s => ({ id: s.id, label: s.displayName || s.hostname, type: 'server' as const })) || []),
    ...(applicationsQuery.data?.map(a => ({ id: a.id, label: a.displayName || a.code, type: 'application' as const })) || []),
    ...(databasesQuery.data?.map(d => ({ id: d.id, label: d.displayName || d.name, type: 'database' as const })) || []),
    ...(urlsQuery.data?.map(u => ({ id: u.id, label: u.label || u.url, type: 'url' as const })) || []),
  ], [serversQuery.data, applicationsQuery.data, databasesQuery.data, urlsQuery.data]);

  const isLoading = applicationsQuery.isLoading || serversQuery.isLoading || urlsQuery.isLoading || databasesQuery.isLoading;

  const handleAddLink = () => {
    if (!selectedSource || !selectedTarget) {
      setMessage({ type: 'error', text: 'Selecione origem e destino' });
      return;
    }

    if (selectedSource.id === selectedTarget.id) {
      setMessage({ type: 'error', text: 'Não pode linkar um recurso a si mesmo' });
      return;
    }

    const newLink: PendingLink = {
      id: `${Date.now()}-${Math.random()}`,
      source: selectedSource,
      target: selectedTarget,
      relationType,
    };

    setPendingLinks([...pendingLinks, newLink]);
    setSelectedSource(null);
    setSelectedTarget(null);
    setMessage({ type: 'success', text: '✅ Link adicionado!' });
    setTimeout(() => setMessage(null), 2000);
  };

  const handleRemoveLink = (id: string) => {
    setPendingLinks(pendingLinks.filter(link => link.id !== id));
  };

  const handleGenerateGraph = async () => {
    try {
      for (const link of pendingLinks) {
        await createRelationship.mutateAsync({
          sourceType: link.source.type,
          sourceId: link.source.id,
          targetType: link.target.type,
          targetId: link.target.id,
          relationType: link.relationType,
        });
      }

      setPendingLinks([]);
      setShowGraph(true);
      await graphQuery.refetch();
      setMessage({ type: 'success', text: '✅ Gráfico gerado!' });
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao gerar gráfico' });
    }
  };

  const handleClear = () => {
    setPendingLinks([]);
    setShowGraph(false);
    clearPositions.mutate();
    setMessage({ type: 'success', text: '✅ Limpo!' });
    setTimeout(() => setMessage(null), 1500);
  };

  // Carregar posições salvas quando o gráfico aparece
  useEffect(() => {
    if (showGraph && getPositions.data) {
      const posMap = new Map<string, Position>();
      getPositions.data.forEach(pos => {
        posMap.set(pos.nodeId, { x: pos.x, y: pos.y });
      });
      setNodePositions(posMap);
    }
  }, [showGraph, getPositions.data]);

  // Salvar posições após arrasto
  useEffect(() => {
    if (!showGraph || nodePositions.size === 0) return;

    const timer = setTimeout(() => {
      const positions = Array.from(nodePositions.entries()).map(([nodeId, pos]) => ({
        nodeId,
        x: pos.x,
        y: pos.y,
      }));
      savePositions.mutate(positions);
    }, 500); // Aguarda 500ms após parar de arrastar

    return () => clearTimeout(timer);
  }, [nodePositions, showGraph, savePositions]);

  useEffect(() => {
    if (!showGraph || !canvasRef.current || !graphQuery.data) return;

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
    for (let i = 0; i < canvas.height; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Calcular posições
    const nodeMap = new Map(graphQuery.data.nodes.map(n => [n.id, n]));
    const uniqueNodes = new Set<string>();

    for (const edge of graphQuery.data.edges) {
      uniqueNodes.add(edge.sourceId);
      uniqueNodes.add(edge.targetId);
    }

    const nodesArray = Array.from(uniqueNodes);
    const cols = Math.ceil(Math.sqrt(nodesArray.length));
    const spacing = 240;

    const newNodePositions = new Map<string, Position>();
    nodesArray.forEach((nodeId, i) => {
      if (nodePositions.has(nodeId)) {
        newNodePositions.set(nodeId, nodePositions.get(nodeId)!);
      } else {
        const row = Math.floor(i / cols);
        const col = i % cols;
        newNodePositions.set(nodeId, {
          x: col * spacing + 140,
          y: row * spacing + 100,
        });
      }
    });

    setNodePositions(newNodePositions);

    // Desenhar edges com gradiente
    for (const edge of graphQuery.data.edges) {
      const source = newNodePositions.get(edge.sourceId);
      const target = newNodePositions.get(edge.targetId);
      if (source && target) {
        const gradient = ctx.createLinearGradient(source.x, source.y, target.x, target.y);
        gradient.addColorStop(0, '#475569');
        gradient.addColorStop(1, '#1e293b');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(source.x, source.y + 40);
        ctx.lineTo(target.x, target.y - 40);
        ctx.stroke();

        // Label de tipo de relação
        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(midX - 35, midY - 10, 70, 18);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.strokeRect(midX - 35, midY - 10, 70, 18);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(edge.relationType.replace('_', ' '), midX, midY + 4);
      }
    }

    // Desenhar nodes com melhor visual
    for (const [nodeId, pos] of newNodePositions) {
      const node = nodeMap.get(nodeId);
      if (!node) continue;

      const color = COLORS[node.resourceType];
      const isDragging = nodeId === draggingNode;
      const width = 180;
      const height = 90;

      // Shadow ao arrastar
      if (isDragging) {
        ctx.shadowColor = color + '66';
        ctx.shadowBlur = 25;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 8;
      }

      // Background
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(pos.x - width / 2, pos.y - height / 2, width, height);

      // Border com cor
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(pos.x - width / 2, pos.y - height / 2, width, height);

      ctx.shadowColor = 'rgba(0, 0, 0, 0)';

      // Ícone
      ctx.font = '28px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(ICONS[node.resourceType], pos.x - width / 2 + 30, pos.y - 5);

      // Tipo de recurso
      ctx.fillStyle = color;
      ctx.font = 'bold 9px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(node.resourceType.toUpperCase(), pos.x - width / 2 + 65, pos.y - height / 2 + 18);

      // Nome do recurso
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px Arial';
      const maxLen = 16;
      const displayName = node.label.length > maxLen ? node.label.substring(0, maxLen) + '...' : node.label;
      ctx.fillText(displayName, pos.x - width / 2 + 65, pos.y + 10);

      // ID curto
      ctx.fillStyle = '#9ca3af';
      ctx.font = '9px Arial';
      ctx.fillText(nodeId.substring(0, 8), pos.x - width / 2 + 65, pos.y + 28);
    }
  }, [showGraph, graphQuery.data, draggingNode, nodePositions]);

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
    const mouseY = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);

    // Encontrar node sob o cursor
    for (const [nodeId, pos] of nodePositions) {
      const width = 180;
      const height = 90;
      if (
        mouseX >= pos.x - width / 2 &&
        mouseX <= pos.x + width / 2 &&
        mouseY >= pos.y - height / 2 &&
        mouseY <= pos.y + height / 2
      ) {
        setDraggingNode(nodeId);
        setDragOffset({ x: mouseX - pos.x, y: mouseY - pos.y });
        break;
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingNode || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
    const mouseY = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);

    const newPos = { x: mouseX - dragOffset.x, y: mouseY - dragOffset.y };
    const newPositions = new Map(nodePositions);
    newPositions.set(draggingNode, newPos);
    setNodePositions(newPositions);
  };

  const handleCanvasMouseUp = () => {
    setDraggingNode(null);
  };

  if (isLoading) return <Spinner />;

  return (
    <div style={{ padding: '16px' }}>
      <PageHeader
        title="Construtor de Dependências"
        description="Crie seus relacionamentos e visualize como um gráfico"
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

      {!showGraph ? (
        // Modo de criação de links
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Formulário */}
          <div style={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', padding: '20px' }}>
            <h2 style={{ color: '#e5e7eb', marginBottom: '20px', fontSize: '16px' }}>Crie os Relacionamentos</h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Origem:</label>
              <select
                value={selectedSource?.id || ''}
                onChange={e => {
                  const res = allResources.find(r => r.id === e.target.value);
                  setSelectedSource(res || null);
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#1f2937',
                  color: '#e5e7eb',
                  border: '1px solid #374151',
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
              >
                <option value="">Selecione a origem...</option>
                {allResources.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Tipo:</label>
              <select
                value={relationType}
                onChange={e => setRelationType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#1f2937',
                  color: '#e5e7eb',
                  border: '1px solid #374151',
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
              >
                {RELATION_TYPES.map(rt => (
                  <option key={rt.value} value={rt.value}>
                    {rt.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Destino:</label>
              <select
                value={selectedTarget?.id || ''}
                onChange={e => {
                  const res = allResources.find(r => r.id === e.target.value);
                  setSelectedTarget(res || null);
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#1f2937',
                  color: '#e5e7eb',
                  border: '1px solid #374151',
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
              >
                <option value="">Selecione o destino...</option>
                {allResources.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={handleAddLink}
              style={{ width: '100%', padding: '12px', marginBottom: '12px' }}
              disabled={!selectedSource || !selectedTarget}
            >
              ➕ Adicionar Link
            </Button>

            <Button
              onClick={handleGenerateGraph}
              disabled={pendingLinks.length === 0}
              style={{ width: '100%', padding: '12px' }}
            >
              🎨 Gerar Gráfico ({pendingLinks.length})
            </Button>
          </div>

          {/* Preview dos links */}
          <div style={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', padding: '20px' }}>
            <h2 style={{ color: '#e5e7eb', marginBottom: '16px', fontSize: '16px' }}>Links Pendentes ({pendingLinks.length})</h2>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {pendingLinks.length === 0 ? (
                <p style={{ color: '#6b7280', fontSize: '13px' }}>Nenhum link ainda. Adicione alguns acima!</p>
              ) : (
                pendingLinks.map(link => (
                  <div
                    key={link.id}
                    style={{
                      padding: '10px',
                      backgroundColor: '#1f2937',
                      border: `1px solid ${COLORS[link.source.type]}`,
                      borderRadius: '4px',
                      marginBottom: '8px',
                      fontSize: '12px',
                      color: '#e5e7eb',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ flex: 1 }}>
                      <strong>{link.source.label}</strong>
                      <span style={{ color: '#9ca3af', margin: '0 6px' }}>({link.relationType})</span>
                      <strong>{link.target.label}</strong>
                    </span>
                    <Button
                      onClick={() => handleRemoveLink(link.id)}
                      variant="secondary"
                      size="sm"
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                    >
                      ✕
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        // Modo de visualização do gráfico
        <div>
          <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
            <Button onClick={() => setShowGraph(false)}>← Voltar para Editor</Button>
            <Button onClick={handleClear} variant="secondary">
              🗑️ Limpar Tudo
            </Button>
          </div>
          <div style={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', overflow: 'hidden' }}>
            {graphQuery.data && graphQuery.data.edges.length > 0 ? (
              <canvas
                ref={canvasRef}
                width={1200}
                height={700}
                style={{
                  display: 'block',
                  width: '100%',
                  height: '700px',
                  cursor: draggingNode ? 'grabbing' : 'grab',
                }}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
              />
            ) : (
              <div style={{ height: '700px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                📭 Gerando gráfico...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
