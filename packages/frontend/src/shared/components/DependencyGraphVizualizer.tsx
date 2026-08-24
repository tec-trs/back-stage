import { useEffect, useRef, useMemo, useState } from 'react';
import Raphael from 'raphael';
import { Graphviz } from '@hpcc-js/wasm';
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
  const paperRef = useRef<any>(null);
  const [zoom, setZoom] = useState(1);
  const [groupingThreshold, setGroupingThreshold] = useState(3);

  const dotString = useMemo(() => {
    // Agrupar nós por tipo
    const nodesByType: Record<string, GraphNode[]> = {};
    nodes.forEach((node) => {
      if (!nodesByType[node.resourceType]) {
        nodesByType[node.resourceType] = [];
      }
      nodesByType[node.resourceType].push(node);
    });

    let dotCode = 'digraph {rankdir=LR;graph[bgcolor=transparent,splines=ortho];';
    dotCode += 'node[style=filled,shape=box,fontname=Arial,fontsize=10];';

    // Adicionar nós
    nodes.forEach((node) => {
      const typeGroup = nodesByType[node.resourceType];
      const isGroup = typeGroup.length >= groupingThreshold;
      const isRoot = node.id === rootNodeId;
      const color = NODE_COLORS[node.resourceType] || '#6b7280';

      if (!isGroup) {
        const label = `${node.label}`;
        const borderColor = isRoot ? '#2563eb' : color;
        const style = isRoot ? 'filled,bold' : 'filled';
        dotCode += `"${node.id}"[label="${label}",fillcolor="${color}",color="${borderColor}",fontcolor=white,style="${style}"];`;
      }
    });

    // Adicionar arestas
    edges
      .filter((edge) => {
        const srcGroup = nodesByType[nodes.find((n) => n.id === edge.sourceId)?.resourceType || ''];
        const tgtGroup = nodesByType[nodes.find((n) => n.id === edge.targetId)?.resourceType || ''];
        return srcGroup.length < groupingThreshold && tgtGroup.length < groupingThreshold;
      })
      .forEach((edge) => {
        dotCode += `"${edge.sourceId}"->"${edge.targetId}"[color="#64748b",penwidth=1.5];`;
      });

    dotCode += '}';
    return dotCode;
  }, [nodes, edges, rootNodeId, groupingThreshold]);

  useEffect(() => {
    const renderGraph = async () => {
      if (!containerRef.current) return;

      try {
        const graphviz = await Graphviz.load();
        const svg = graphviz.renderDotString(dotString);

        containerRef.current.innerHTML = svg;

        // Aplicar zoom
        if (paperRef.current) {
          paperRef.current.clear();
        }

        paperRef.current = Raphael(containerRef.current, containerRef.current.offsetWidth, 600);

        // Re-render com Raphael
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svg, 'image/svg+xml');
        const svgElement = svgDoc.documentElement;

        const width = parseInt(svgElement.getAttribute('width') || '800', 10);
        const height = parseInt(svgElement.getAttribute('height') || '600', 10);

        paperRef.current.setSize(width * zoom, height * zoom);
        paperRef.current.scale(zoom, zoom, 0, 0);
      } catch (err) {
        console.error('Erro ao renderizar grafo:', err);
      }
    };

    renderGraph();
  }, [dotString, zoom]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex gap-4 items-center p-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-400">Limite de agrupamento:</label>
          <input
            type="number"
            min="2"
            max="20"
            value={groupingThreshold}
            onChange={(e) => setGroupingThreshold(Math.max(2, parseInt(e.target.value, 10)))}
            className="w-16 px-2 py-1 rounded bg-slate-800 text-slate-100 text-sm border border-slate-700"
          />
        </div>

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
            className="px-3 py-1 bg-slate-700 text-slate-200 rounded text-sm hover:bg-slate-600"
          >
            −
          </button>
          <span className="text-sm text-slate-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
            className="px-3 py-1 bg-slate-700 text-slate-200 rounded text-sm hover:bg-slate-600"
          >
            +
          </button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-auto bg-slate-950" />
    </div>
  );
}
