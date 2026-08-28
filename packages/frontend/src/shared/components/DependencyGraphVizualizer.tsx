import { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import type { GraphNode, GraphEdge } from '../../features/resource-graph/use-resource-graph';

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
  rootNodeId?: string;
}

const NODE_COLORS: Record<string, string> = {
  server: '#3b82f6',
  application: '#8b5cf6',
  database: '#ec4899',
  url: '#f59e0b',
  vip: '#06b6d4',
};

export function DependencyGraphVizualizer({ nodes, edges, rootNodeId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;

    // Preparar dados para Cytoscape
    const cyNodes = nodes.map((node) => ({
      data: {
        id: node.id,
        label: node.label,
        resourceType: node.resourceType,
        isRoot: node.id === rootNodeId,
      },
    }));

    const cyEdges = edges.map((edge, idx) => ({
      data: {
        id: `edge-${idx}`,
        source: edge.sourceId,
        target: edge.targetId,
      },
    }));

    // Criar instância Cytoscape
    const cy = cytoscape({
      container: containerRef.current,
      elements: [...cyNodes, ...cyEdges],
      style: [
        {
          selector: 'node',
          style: {
            'background-color': (ele: any) => NODE_COLORS[ele.data('resourceType')] || '#6b7280',
            'label': 'data(label)',
            'text-halign': 'center',
            'text-valign': 'center',
            'font-size': '12px',
            'color': '#ffffff',
            'font-weight': (ele: any) => (ele.data('isRoot') ? 'bold' : 'normal'),
            'width': '180px',
            'height': '60px',
            'border-width': (ele: any) => (ele.data('isRoot') ? '3px' : '2px'),
            'border-color': (ele: any) => (ele.data('isRoot') ? '#2563eb' : 'rgba(0,0,0,0.2)'),
            'padding': '10px',
            'text-wrap': 'wrap',
          },
        },
        {
          selector: 'edge',
          style: {
            'target-arrow-shape': 'triangle',
            'target-arrow-color': '#64748b',
            'target-arrow-fill': 'filled',
            'line-color': '#64748b',
            'width': '2px',
            'curve-style': 'bezier',
          },
        },
      ],
      layout: {
        name: 'breadthfirst',
        directed: true,
        roots: rootNodeId ? `#${rootNodeId}` : undefined,
        animate: true,
        animationDuration: 600,
        spacingFactor: 1.8,
        nodeDimensionsIncludeLabels: true,
      } as any,
      wheelSensitivity: 0.1,
    });

    cyRef.current = cy;

    // Fit to view com padding
    setTimeout(() => {
      cy.fit(undefined, 20);
    }, 600);

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [nodes, edges, rootNodeId]);

  const handleZoom = (direction: 'in' | 'out') => {
    if (!cyRef.current) return;
    const factor = direction === 'in' ? 1.2 : 0.8;
    const currentZoom = cyRef.current.zoom();
    const newZoom = Math.max(0.5, Math.min(3, currentZoom * factor));
    cyRef.current.zoom(newZoom);
    setZoom(newZoom);
  };

  const handleFit = () => {
    if (!cyRef.current) return;
    cyRef.current.fit(undefined, 20);
    setZoom(cyRef.current.zoom());
  };

  return (
    <div className="w-full h-full flex flex-col bg-canvas">
      <div className="flex gap-4 items-center p-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-400">Nós: {nodes.length}</label>
          <label className="text-sm text-slate-400 ml-4">Relações: {edges.length}</label>
        </div>

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => handleZoom('out')}
            className="px-3 py-1 bg-slate-700 text-slate-200 rounded text-sm hover:bg-slate-600"
          >
            −
          </button>
          <span className="text-sm text-slate-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => handleZoom('in')}
            className="px-3 py-1 bg-slate-700 text-slate-200 rounded text-sm hover:bg-slate-600"
          >
            +
          </button>
          <button
            onClick={handleFit}
            className="px-3 py-1 bg-slate-600 text-slate-200 rounded text-sm hover:bg-slate-500"
          >
            ↔
          </button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 bg-canvas" style={{ minHeight: 0 }} />
    </div>
  );
}
