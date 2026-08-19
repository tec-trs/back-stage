import { useState, useMemo } from 'react';
import { useFullGraph } from '../features/resource-graph/use-resource-graph';
import { useSimulateImpact } from '../features/resource-graph/use-resource-graph';
import { PageHeader } from '../shared/components/PageHeader';
import { Spinner } from '../shared/components/Spinner';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { Button } from '../shared/components/Button';

interface TreeNode {
  id: string;
  label: string;
  resourceType: string;
  children: TreeNode[];
  dependsOn?: string[];
}

const RESOURCE_ICONS: Record<string, string> = {
  server: '🖥️',
  application: '📱',
  database: '📊',
  url: '🔗',
  group: '📦',
};

export function DependencyTreePage() {
  const { data, isLoading, isError, error } = useFullGraph({ page: 1, pageSize: 500 });
  const simulateImpact = useSimulateImpact();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [impactedResources, setImpactedResources] = useState<Set<string>>(new Set());
  const [simulationSourceId, setSimulationSourceId] = useState<string | null>(null);

  const tree = useMemo(() => {
    if (!data) return null;

    console.log('📊 Full graph data:', { nodes: data.nodes.length, edges: data.edges.length });
    console.log('🔗 Edges:', data.edges.map(e => `${e.sourceId}(${e.sourceType}) --[${e.relationType}]--> ${e.targetId}(${e.targetType})`));

    const nodeMap = new Map(data.nodes.map(n => [n.id, n]));
    const edgesBySource = new Map<string, { targetId: string; type: string }[]>();
    const edgesByTarget = new Map<string, { sourceId: string; type: string }[]>();
    const hostedApps = new Map<string, string[]>(); // server -> apps

    for (const edge of data.edges) {
      if (!edgesBySource.has(edge.sourceId)) edgesBySource.set(edge.sourceId, []);
      if (!edgesByTarget.has(edge.targetId)) edgesByTarget.set(edge.targetId, []);
      edgesBySource.get(edge.sourceId)!.push({ targetId: edge.targetId, type: edge.relationType });
      edgesByTarget.get(edge.targetId)!.push({ sourceId: edge.sourceId, type: edge.relationType });

      // Track hosted applications
      if (edge.relationType === 'hosts') {
        if (!hostedApps.has(edge.sourceId)) hostedApps.set(edge.sourceId, []);
        hostedApps.get(edge.sourceId)!.push(edge.targetId);
      }
    }

    console.log('📍 Hosted apps:', Object.fromEntries(hostedApps));
    console.log('🎯 Edges by target (who points TO each node):', Object.fromEntries(
      [...edgesByTarget.entries()].map(([target, edges]) => [
        `${target} (${nodeMap.get(target)?.label})`,
        edges.map(e => `${e.sourceId} via ${e.type}`)
      ])
    ));

    const buildTree = (nodeId: string, visited = new Set<string>()): TreeNode | null => {
      if (visited.has(nodeId)) return null;
      visited.add(nodeId);

      const node = nodeMap.get(nodeId);
      if (!node) return null;

      // Para URLs e outros nós, mostra quem depende deles (dependentes)
      // Para outros nós, mostra o que eles dependem (dependências)
      const children: TreeNode[] = [];
      let deps: string[] = [];

      if (node.resourceType === 'url') {
        // URLs mostram seus dependentes (quem depends_on, connects_to, consumes desta URL)
        const incoming = edgesByTarget.get(nodeId) || [];
        let dependents = incoming
          .filter(e => ['depends_on', 'connects_to', 'consumes'].includes(e.type))
          .map(e => e.sourceId);

        // Se a URL depende de apps, encontrar os servidores que hospedam essas apps
        const appDependencies = dependents.filter(id => nodeMap.get(id)?.resourceType === 'application');
        const serverHostingApps = new Set<string>();

        for (const appId of appDependencies) {
          // Encontrar todos os servidores que hospedam essa app
          const hosting = edgesBySource.get(appId) || [];
          const serversHosting = hosting
            .filter(e => e.type === 'hosts')
            .map(e => e.targetId)
            .filter(id => nodeMap.get(id)?.resourceType === 'server');

          serversHosting.forEach(id => serverHostingApps.add(id));
        }

        // Usar servidores se encontrou, senão usar os dependentes originais
        if (serverHostingApps.size > 0) {
          dependents = Array.from(serverHostingApps);

          // Agrupar servidores por display_group
          const serversByGroup = new Map<string, string[]>();
          for (const serverId of dependents) {
            const server = nodeMap.get(serverId);
            if (server) {
              const group = server.displayGroup || 'Sem grupo';
              if (!serversByGroup.has(group)) {
                serversByGroup.set(group, []);
              }
              serversByGroup.get(group)!.push(serverId);
            }
          }

          // Criar nós de grupo virtuais
          for (const [groupName, serverIds] of serversByGroup) {
            const groupNode: TreeNode = {
              id: `group:${groupName}`,
              label: groupName,
              resourceType: 'group',
              children: serverIds
                .map(serverId => buildTree(serverId, new Set(visited)))
                .filter((n): n is TreeNode => n !== null),
            };
            children.push(groupNode);
          }
        } else {
          const dependentTrees = dependents
            .map(depId => buildTree(depId, new Set(visited)))
            .filter((n): n is TreeNode => n !== null);
          children.push(...dependentTrees);
        }

        deps = dependents;
      } else {
        // Outros nós mostram o que eles dependem
        const outgoing = edgesBySource.get(nodeId) || [];
        deps = outgoing
          .filter(e => !['hosts'].includes(e.type))
          .map(e => e.targetId);

        const depTrees = deps
          .map(depId => buildTree(depId, new Set(visited)))
          .filter((n): n is TreeNode => n !== null);
        children.push(...depTrees);
      }

      // Add hosted apps as children for servers
      const apps = hostedApps.get(nodeId) || [];
      for (const appId of apps) {
        const app = nodeMap.get(appId);
        if (app && !visited.has(appId)) {
          // Build tree for hosted app (so it can have its own dependencies)
          const appTree = buildTree(appId, new Set(visited));
          if (appTree) {
            children.push(appTree);
          }
        }
      }

      return {
        id: nodeId,
        label: node.label,
        resourceType: node.resourceType,
        children,
        dependsOn: deps,
      };
    };

    // Build trees from root resources: URLs first (entry points), then orphans
    const urlRoots = data.nodes.filter(n => n.resourceType === 'url');
    const orphans = data.nodes.filter(n => n.resourceType !== 'url' && !edgesByTarget.has(n.id));
    const roots = [...urlRoots, ...orphans];

    console.log('🌳 URL Roots:', urlRoots.map(r => `${r.id} - ${r.label}`));
    console.log('🌳 Orphan Roots:', orphans.map(r => `${r.id} - ${r.label}`));
    console.log('🌳 All Roots:', roots.map(r => `${r.id} - ${r.label}`));

    const resultTrees = roots
      .map(root => buildTree(root.id))
      .filter((n): n is TreeNode => n !== null);

    console.log('🎄 Result trees:', resultTrees.map(t => ({ id: t.id, label: t.label, childCount: t.children.length })));

    return resultTrees;
  }, [data]);

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleSimulate = async (nodeId: string, resourceType: string) => {
    setSimulationSourceId(nodeId);
    setImpactedResources(new Set());

    try {
      const result = await simulateImpact.mutateAsync({
        resourceType: resourceType as any,
        resourceId: nodeId,
      });

      const affected = new Set(result.impactedResources.map(r => r.resourceId));
      affected.add(nodeId);
      setImpactedResources(affected);
    } catch (err) {
      console.error('Simulation error:', err);
    }
  };

  const renderTreeNode = (node: TreeNode, depth: number = 0): JSX.Element => {
    const isExpanded = expandedNodes.has(node.id);
    const isAffected = impactedResources.has(node.id);
    const icon = RESOURCE_ICONS[node.resourceType] || '📦';

    return (
      <div key={node.id} style={{ marginLeft: `${depth * 20}px` }}>
        <div
          style={{
            padding: '8px',
            marginBottom: '4px',
            borderRadius: '4px',
            backgroundColor: isAffected ? '#7f1d1d' : 'transparent',
            border: isAffected ? '1px solid #dc2626' : '1px solid #374151',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <button
            onClick={() => toggleNode(node.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#9ca3af',
              padding: 0,
              width: '20px',
            }}
          >
            {node.children.length > 0 ? (isExpanded ? '▼' : '▶') : '·'}
          </button>
          <span style={{ fontSize: '16px' }}>{icon}</span>
          <span style={{ flex: 1, color: isAffected ? '#fca5a5' : '#e5e7eb' }}>
            {node.label}
          </span>
          {simulationSourceId !== node.id && (
            <Button
              size="sm"
              variant={isAffected ? 'secondary' : 'secondary'}
              onClick={() => handleSimulate(node.id, node.resourceType)}
              style={{ fontSize: '12px', padding: '4px 8px' }}
            >
              Simular
            </Button>
          )}
          {isAffected && (
            <span style={{ fontSize: '12px', color: '#fca5a5', fontWeight: 'bold' }}>
              AFETADO ⚠️
            </span>
          )}
        </div>
        {isExpanded && node.children.length > 0 && (
          <div>
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isError) {
    return (
      <div>
        <PageHeader
          title="Árvore de Dependências"
          description="Visualize a hierarquia de dependências entre recursos"
        />
        <ErrorMessage message={error instanceof Error ? error.message : 'Erro ao carregar'} />
      </div>
    );
  }

  if (isLoading) return <Spinner />;

  if (!tree || tree.length === 0) {
    return (
      <div>
        <PageHeader
          title="Árvore de Dependências"
          description="Visualize a hierarquia de dependências entre recursos"
        />
        <ErrorMessage message="Nenhum recurso encontrado" />
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto' }}>
      <PageHeader
        title="Árvore de Dependências"
        description="Visualize a hierarquia de dependências e simule o impacto de paradas"
      />

      {simulationSourceId && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px',
            borderRadius: '4px',
            backgroundColor: '#1f2937',
            border: '1px solid #dc2626',
            color: '#fca5a5',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              Simulação ativa: {impactedResources.size} recurso(s) seria(m) afetado(s)
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setSimulationSourceId(null);
                setImpactedResources(new Set());
              }}
            >
              Limpar simulação
            </Button>
          </div>
        </div>
      )}

      <div
        style={{
          backgroundColor: '#111827',
          border: '1px solid #374151',
          borderRadius: '8px',
          padding: '16px',
        }}
      >
        {tree.map(node => renderTreeNode(node))}
      </div>
    </div>
  );
}
