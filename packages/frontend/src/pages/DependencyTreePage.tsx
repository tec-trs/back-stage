import { useState } from 'react';
import { useAllApplications } from '../features/applications/use-applications';
import { useAllServers } from '../features/servers/use-servers';
import { useAllUrls } from '../features/urls/use-urls';
import { useAllDatabases } from '../features/databases/use-databases';
import { useCreateRelationship } from '../features/resource-graph/use-resource-graph';
import { PageHeader } from '../shared/components/PageHeader';
import { Button } from '../shared/components/Button';
import { Spinner } from '../shared/components/Spinner';

interface ResourceOption {
  id: string;
  label: string;
  type: 'server' | 'application' | 'database' | 'url';
}

interface Link {
  id: string;
  source: ResourceOption;
  target: ResourceOption;
  relationType: string;
}

const RESOURCE_ICONS: Record<string, string> = {
  server: '🖥️',
  application: '📱',
  database: '📊',
  url: '🔗',
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
  const createRelationship = useCreateRelationship();

  const [selectedSource, setSelectedSource] = useState<ResourceOption | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<ResourceOption | null>(null);
  const [relationType, setRelationType] = useState('exposes');
  const [links, setLinks] = useState<Link[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const allResources: ResourceOption[] = [
    ...(serversQuery.data?.map(s => ({ id: s.id, label: s.displayName || s.hostname, type: 'server' as const })) || []),
    ...(applicationsQuery.data?.map(a => ({ id: a.id, label: a.displayName || a.code, type: 'application' as const })) || []),
    ...(databasesQuery.data?.map(d => ({ id: d.id, label: d.displayName || d.name, type: 'database' as const })) || []),
    ...(urlsQuery.data?.map(u => ({ id: u.id, label: u.label || u.url, type: 'url' as const })) || []),
  ];

  const isLoading = applicationsQuery.isLoading || serversQuery.isLoading || urlsQuery.isLoading || databasesQuery.isLoading;

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

      const newLink: Link = {
        id: `${selectedSource.id}-${selectedTarget.id}`,
        source: selectedSource,
        target: selectedTarget,
        relationType,
      };

      setLinks([...links, newLink]);
      setSelectedSource(null);
      setSelectedTarget(null);
      setMessage({ type: 'success', text: 'Relacionamento criado com sucesso!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Erro ao criar relacionamento' });
    }
  };

  const handleClearAll = () => {
    setLinks([]);
    setSelectedSource(null);
    setSelectedTarget(null);
    setMessage({ type: 'success', text: 'Tudo limpado!' });
    setTimeout(() => setMessage(null), 2000);
  };

  if (isLoading) return <Spinner />;

  return (
    <div style={{ padding: '16px', maxWidth: '1400px', margin: '0 auto' }}>
      <PageHeader
        title="Construtor de Dependências"
        description="Crie relacionamentos entre recursos selecionando e linkando"
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {/* Painel de Origem */}
        <div style={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', padding: '16px' }}>
          <h3 style={{ color: '#e5e7eb', marginBottom: '12px', fontSize: '14px', fontWeight: 600 }}>Origem</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {allResources.map(resource => (
              <button
                key={resource.id}
                onClick={() => setSelectedSource(resource)}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '8px',
                  border: selectedSource?.id === resource.id ? '2px solid #3b82f6' : '1px solid #374151',
                  borderRadius: '4px',
                  backgroundColor: selectedSource?.id === resource.id ? '#1e40af' : '#1f2937',
                  color: '#e5e7eb',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ fontSize: '16px' }}>{RESOURCE_ICONS[resource.type]}</span>
                <span style={{ fontSize: '13px' }}>{resource.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Painel Central - Configuração */}
        <div style={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ color: '#e5e7eb', marginBottom: '12px', fontSize: '14px', fontWeight: 600 }}>Tipo de Relacionamento</h3>
            <select
              value={relationType}
              onChange={e => setRelationType(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '16px',
                backgroundColor: '#1f2937',
                color: '#e5e7eb',
                border: '1px solid #374151',
                borderRadius: '4px',
              }}
            >
              {RELATION_TYPES.map(rt => (
                <option key={rt.value} value={rt.value}>
                  {rt.label}
                </option>
              ))}
            </select>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '8px' }}>Origem selecionada:</p>
              {selectedSource ? (
                <div style={{ padding: '8px', backgroundColor: '#1e40af', borderRadius: '4px', color: '#e5e7eb', fontSize: '13px' }}>
                  {RESOURCE_ICONS[selectedSource.type]} {selectedSource.label}
                </div>
              ) : (
                <div style={{ padding: '8px', backgroundColor: '#374151', borderRadius: '4px', color: '#9ca3af', fontSize: '13px' }}>
                  Nenhuma
                </div>
              )}
            </div>

            <div>
              <p style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '8px' }}>Destino selecionado:</p>
              {selectedTarget ? (
                <div style={{ padding: '8px', backgroundColor: '#065f46', borderRadius: '4px', color: '#e5e7eb', fontSize: '13px' }}>
                  {RESOURCE_ICONS[selectedTarget.type]} {selectedTarget.label}
                </div>
              ) : (
                <div style={{ padding: '8px', backgroundColor: '#374151', borderRadius: '4px', color: '#9ca3af', fontSize: '13px' }}>
                  Nenhum
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
            <Button
              onClick={handleAddLink}
              style={{ width: '100%', padding: '10px' }}
              disabled={!selectedSource || !selectedTarget}
            >
              + Adicionar Link
            </Button>
            <Button
              onClick={handleClearAll}
              variant="secondary"
              style={{ width: '100%', padding: '10px' }}
            >
              Limpar Tudo
            </Button>
          </div>
        </div>

        {/* Painel de Destino */}
        <div style={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', padding: '16px' }}>
          <h3 style={{ color: '#e5e7eb', marginBottom: '12px', fontSize: '14px', fontWeight: 600 }}>Destino</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {allResources.map(resource => (
              <button
                key={resource.id}
                onClick={() => setSelectedTarget(resource)}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '8px',
                  border: selectedTarget?.id === resource.id ? '2px solid #10b981' : '1px solid #374151',
                  borderRadius: '4px',
                  backgroundColor: selectedTarget?.id === resource.id ? '#065f46' : '#1f2937',
                  color: '#e5e7eb',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ fontSize: '16px' }}>{RESOURCE_ICONS[resource.type]}</span>
                <span style={{ fontSize: '13px' }}>{resource.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de Links Criados */}
      {links.length > 0 && (
        <div style={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', padding: '16px' }}>
          <h3 style={{ color: '#e5e7eb', marginBottom: '16px', fontSize: '14px', fontWeight: 600 }}>
            Links Criados ({links.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '12px' }}>
            {links.map(link => (
              <div
                key={link.id}
                style={{
                  padding: '12px',
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '16px' }}>{RESOURCE_ICONS[link.source.type]}</span>
                <span style={{ flex: 1, color: '#e5e7eb', fontSize: '12px' }}>{link.source.label}</span>
                <span style={{ color: '#6b7280', fontSize: '11px' }}>→</span>
                <span style={{ flex: 1, color: '#e5e7eb', fontSize: '12px', textAlign: 'right' }}>{link.target.label}</span>
                <span style={{ fontSize: '16px' }}>{RESOURCE_ICONS[link.target.type]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
