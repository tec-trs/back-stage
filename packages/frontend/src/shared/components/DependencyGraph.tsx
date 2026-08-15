import * as d3 from 'd3';
import { useEffect, useMemo, useRef } from 'react';

import type { GraphEdge, GraphNode } from '../../features/dependency-graph/use-dependency-graph';

interface SimulationNode extends GraphNode, d3.SimulationNodeDatum {}

interface SimulationEdge extends d3.SimulationLinkDatum<SimulationNode> {
  id: string;
  relationType: string;
}

export interface DependencyGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId?: string | null;
  onNodeSelect?: (node: GraphNode) => void;
  onNodeNavigate?: (node: GraphNode) => void;
  ariaLabel?: string;
}

const LIFECYCLE_STROKE: Record<string, string> = {
  production: '#34d399',
  experimental: '#fbbf24',
  deprecated: '#f87171',
  active: '#34d399',
  maintenance: '#fbbf24',
  provisioning: '#38bdf8',
  deactivated: '#f87171',
  developing: '#a78bfa',
};

const KIND_FILL: Record<string, string> = {
  component: '#38bdf8',
  api: '#a78bfa',
  resource: '#fb923c',
  system: '#f472b6',
  domain: '#94a3b8',
  server: '#22d3ee',
  application: '#a3e635',
};

const WIDTH = 900;
const HEIGHT = 520;
const SELECTED_STROKE_WIDTH = 5;
const DEFAULT_STROKE_WIDTH = 3;
const NODE_RADIUS = 18;
const SQUARE_SIZE = 36;

export function DependencyGraph({
  nodes,
  edges,
  selectedNodeId,
  onNodeSelect,
  onNodeNavigate,
  ariaLabel = 'Grafo de dependencias entre entidades do catalogo',
}: DependencyGraphProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const nodeGroupRef = useRef<d3.Selection<
    SVGGElement,
    SimulationNode,
    SVGGElement,
    unknown
  > | null>(null);

  const simulationData = useMemo(() => {
    const simulationNodes: SimulationNode[] = nodes.map((node) => ({ ...node }));
    const simulationEdges: SimulationEdge[] = edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      relationType: edge.relationType,
    }));
    return { simulationNodes, simulationEdges };
  }, [nodes, edges]);

  useEffect(() => {
    if (!svgRef.current) {
      return undefined;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const zoomGroup = svg.append('g').attr('class', 'zoom-group');

    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3])
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        zoomGroup.attr('transform', event.transform.toString());
      });

    svg.call(zoomBehavior);

    const { simulationNodes, simulationEdges } = simulationData;

    const simulation = d3
      .forceSimulation<SimulationNode>(simulationNodes)
      .force(
        'link',
        d3
          .forceLink<SimulationNode, SimulationEdge>(simulationEdges)
          .id((node) => node.id)
          .distance(120),
      )
      .force('charge', d3.forceManyBody().strength(-260))
      .force('center', d3.forceCenter(WIDTH / 2, HEIGHT / 2))
      .force('collide', d3.forceCollide(40));

    zoomGroup
      .append('defs')
      .append('marker')
      .attr('id', 'dependency-arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 28)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#334155');

    const link = zoomGroup
      .append('g')
      .attr('stroke', '#334155')
      .attr('stroke-width', 1.5)
      .selectAll('line')
      .data(simulationEdges)
      .join('line')
      .attr('marker-end', 'url(#dependency-arrow)');

    const dragBehavior = d3
      .drag<SVGGElement, SimulationNode>()
      .on('start', (event, node) => {
        if (!event.active) {
          simulation.alphaTarget(0.3).restart();
        }
        node.fx = node.x;
        node.fy = node.y;
      })
      .on('drag', (event, node) => {
        node.fx = event.x;
        node.fy = event.y;
      })
      .on('end', (event, node) => {
        if (!event.active) {
          simulation.alphaTarget(0);
        }
        node.fx = null;
        node.fy = null;
      });

    const nodeGroup = zoomGroup
      .append('g')
      .selectAll<SVGGElement, SimulationNode>('g')
      .data(simulationNodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(dragBehavior)
      .on('click', (_event, node) => onNodeSelect?.(node))
      .on('dblclick', (_event, node) => onNodeNavigate?.(node));

    // Server nodes: square (rect)
    nodeGroup
      .filter((node) => node.kind === 'server')
      .append('rect')
      .attr('class', 'node-shape')
      .attr('width', SQUARE_SIZE)
      .attr('height', SQUARE_SIZE)
      .attr('x', -SQUARE_SIZE / 2)
      .attr('y', -SQUARE_SIZE / 2)
      .attr('rx', 4)
      .attr('fill', (node) => KIND_FILL[node.kind] ?? '#64748b')
      .attr('stroke', (node) => LIFECYCLE_STROKE[node.lifecycle] ?? '#475569')
      .attr('stroke-width', (node) =>
        node.id === selectedNodeId ? SELECTED_STROKE_WIDTH : DEFAULT_STROKE_WIDTH,
      );

    // Application and other nodes: circle
    nodeGroup
      .filter((node) => node.kind !== 'server')
      .append('circle')
      .attr('class', 'node-shape')
      .attr('r', NODE_RADIUS)
      .attr('fill', (node) => KIND_FILL[node.kind] ?? '#64748b')
      .attr('stroke', (node) => LIFECYCLE_STROKE[node.lifecycle] ?? '#475569')
      .attr('stroke-width', (node) =>
        node.id === selectedNodeId ? SELECTED_STROKE_WIDTH : DEFAULT_STROKE_WIDTH,
      );

    nodeGroupRef.current = nodeGroup;

    // Labels above nodes
    nodeGroup
      .append('text')
      .text((node) => node.title ?? node.name)
      .attr('x', 0)
      .attr('y', -NODE_RADIUS - 8)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e2e8f0')
      .attr('font-size', 12);

    nodeGroup.append('title').text((node) => `${node.name} (${node.kind}/${node.lifecycle})`);

    simulation.on('tick', () => {
      link
        .attr('x1', (edge) => (edge.source as SimulationNode).x ?? 0)
        .attr('y1', (edge) => (edge.source as SimulationNode).y ?? 0)
        .attr('x2', (edge) => (edge.target as SimulationNode).x ?? 0)
        .attr('y2', (edge) => (edge.target as SimulationNode).y ?? 0);

      nodeGroup.attr('transform', (node) => `translate(${node.x ?? 0}, ${node.y ?? 0})`);
    });

    return () => {
      simulation.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulationData]);

  useEffect(() => {
    nodeGroupRef.current
      ?.select<SVGElement>('.node-shape')
      .attr('stroke-width', (node) =>
        node.id === selectedNodeId ? SELECTED_STROKE_WIDTH : DEFAULT_STROKE_WIDTH,
      );
  }, [selectedNodeId]);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={ariaLabel}
      className="h-[520px] w-full rounded-lg border border-slate-800 bg-slate-950"
    />
  );
}
