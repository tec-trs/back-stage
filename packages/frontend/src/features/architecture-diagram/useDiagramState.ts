import { useState, useCallback } from 'react';
import type { Edge, Node } from '@xyflow/react';
import { addEdge, Connection } from '@xyflow/react';
import type { ResourceType } from './types';

export function useDiagramState() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [diagramName, setDiagramName] = useState('Novo Diagrama');

  const addNode = useCallback((type: ResourceType, label: string, description?: string) => {
    const id = `${type}-${Date.now()}`;
    const newNode = {
      id,
      type: type as string,
      position: { x: Math.random() * 300, y: Math.random() * 300 },
      data: {
        label,
        resourceType: type,
        description,
      },
    };
    setNodes((nds) => [...nds, newNode]);
    return id;
  }, []);

  const updateNode = useCallback((id: string, label: string, description?: string) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === id
          ? {
              ...n,
              data: { ...n.data, label, description },
            }
          : n
      )
    );
  }, []);

  const deleteNode = useCallback((id: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
  }, []);

  const handleConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    []
  );

  const deleteEdge = useCallback((edgeId: string) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
  }, []);

  const clear = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setDiagramName('Novo Diagrama');
  }, []);

  const setNodesAndEdges = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    setNodes(newNodes);
    setEdges(newEdges);
  }, []);

  return {
    nodes,
    edges,
    diagramName,
    setDiagramName,
    addNode,
    updateNode,
    deleteNode,
    handleConnect,
    deleteEdge,
    clear,
    setNodes,
    setEdges,
    setNodesAndEdges,
  };
}
