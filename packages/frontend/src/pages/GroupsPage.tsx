import { useState } from 'react';
import { useFullGraph } from '../features/resource-graph/use-resource-graph';
import { useDeleteRelationship } from '../features/resource-graph/use-resource-graph';
import { PageHeader } from '../shared/components/PageHeader';
import { Spinner } from '../shared/components/Spinner';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { Button } from '../shared/components/Button';
import { AddRelationshipDialog } from '../features/resource-graph/AddRelationshipDialog';

export function GroupsPage() {
  const { data, isLoading, isError, error } = useFullGraph({ page: 1, pageSize: 500 });
  const deleteRelationship = useDeleteRelationship();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  if (isLoading) return <Spinner />;

  if (isError) {
    return (
      <div>
        <PageHeader
          title="Grupos de Servidores"
          description="Gerencie grupos de servidores (VIPs) e suas relações com URLs"
        />
        <ErrorMessage message={error instanceof Error ? error.message : 'Erro ao carregar'} />
      </div>
    );
  }

  // Filtrar URLs
  const urls = data?.nodes.filter(n => n.resourceType === 'url') || [];

  // Encontrar relacionamentos URL → VIP (grupos agora são VIPs)
  const urlGroupRelationships = data?.edges.filter(
    e => e.sourceType === 'url' && e.targetType === 'vip' && e.relationType === 'depends_on'
  ) || [];

  // Agrupar relacionamentos por VIP
  const relationshipsByGroup = new Map<string, string[]>();
  for (const rel of urlGroupRelationships) {
    if (!relationshipsByGroup.has(rel.targetId)) {
      relationshipsByGroup.set(rel.targetId, []);
    }
    relationshipsByGroup.get(rel.targetId)!.push(rel.sourceId);
  }

  // Filtrar VIPs (grupos)
  const groups = data?.nodes.filter(n => n.resourceType === 'vip') || [];

  const handleDeleteRelationship = async (relationshipId: string) => {
    if (confirm('Tem certeza que deseja remover este relacionamento?')) {
      try {
        await deleteRelationship.mutateAsync(relationshipId);
      } catch (err) {
        console.error('Erro ao deletar:', err);
      }
    }
  };

  return (
    <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto' }}>
      <PageHeader
        title="Grupos de Servidores"
        description="Gerencie grupos de servidores (VIPs) e suas relações com URLs"
      />

      <AddRelationshipDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        defaultSourceType="url"
      />

      <Button
        onClick={() => setShowAddDialog(true)}
        style={{ marginBottom: '16px' }}
      >
        + Vincular URL a Grupo
      </Button>

      <div style={{ display: 'grid', gap: '16px' }}>
        {groups.length === 0 ? (
          <ErrorMessage message="Nenhum grupo encontrado" />
        ) : (
          groups.map(group => {
            const linkedUrls = relationshipsByGroup.get(group.id) || [];

            return (
              <div
                key={group.id}
                style={{
                  padding: '16px',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  backgroundColor: '#111827',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', color: '#e5e7eb' }}>
                      📦 {group.label}
                    </h3>
                    <p style={{ margin: '0', fontSize: '14px', color: '#9ca3af' }}>
                      Status: <span style={{ color: '#10b981' }}>{group.status || 'N/A'}</span>
                      {group.criticality && ` • Criticidade: ${group.criticality}`}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setSelectedGroup(selectedGroup === group.id ? null : group.id)}
                  >
                    {selectedGroup === group.id ? 'Recolher' : 'Expandir'}
                  </Button>
                </div>

                {selectedGroup === group.id && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #374151' }}>
                    <div style={{ marginBottom: '12px' }}>
                      <h4 style={{ margin: '0 0 8px 0', color: '#d1d5db', fontSize: '14px' }}>
                        URLs Vinculadas ({linkedUrls.length})
                      </h4>
                      {linkedUrls.length === 0 ? (
                        <p style={{ margin: '0', fontSize: '14px', color: '#9ca3af' }}>
                          Nenhuma URL vinculada a este grupo
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {urlGroupRelationships
                            .filter(rel => rel.targetId === group.id)
                            .map(rel => (
                              <div
                                key={rel.id}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '8px',
                                  backgroundColor: '#1f2937',
                                  borderRadius: '4px',
                                }}
                              >
                                <span style={{ color: '#d1d5db', fontSize: '14px' }}>
                                  🔗 {urls.find(u => u.id === rel.sourceId)?.label || rel.sourceId}
                                </span>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleDeleteRelationship(rel.id)}
                                  style={{ fontSize: '12px', padding: '2px 8px' }}
                                >
                                  ✕
                                </Button>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setShowAddDialog(true)}
                      style={{ fontSize: '12px' }}
                    >
                      + Vincular nova URL
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
