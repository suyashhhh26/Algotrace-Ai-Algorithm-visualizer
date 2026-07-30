import { motion } from 'framer-motion';
import type { GraphNode, GraphEdge } from '@/algorithms/types';

interface GraphVisualizerProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function GraphVisualizer({ nodes, edges }: GraphVisualizerProps) {
  if (!nodes || nodes.length === 0) return null;

  const getNodeColor = (state: GraphNode['state']) => {
    switch (state) {
      case 'current': return { fill: '#FB923C', shadow: 'rgba(251,146,60,0.4)' };
      case 'visiting': return { fill: '#FACC15', shadow: 'rgba(250,204,21,0.3)' };
      case 'visited': return { fill: '#3B82F6', shadow: 'rgba(59,130,246,0.3)' };
      case 'path': return { fill: '#22C55E', shadow: 'rgba(34,197,94,0.4)' };
      default: return { fill: 'rgba(255,255,255,0.15)', shadow: 'none' };
    }
  };

  const getEdgeColor = (state: GraphEdge['state']) => {
    switch (state) {
      case 'visiting': return '#FACC15';
      case 'visited': return '#3B82F6';
      case 'path': return '#22C55E';
      default: return 'rgba(255,255,255,0.15)';
    }
  };

  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  return (
    <div className="w-full h-full relative">
      <svg className="w-full h-full" viewBox="0 0 600 400">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255,255,255,0.3)" />
          </marker>
          {/* Glow filters */}
          <filter id="glow-blue">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-orange">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-green">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Edges */}
        {edges.map((edge, i) => {
          const from = nodeMap.get(edge.from);
          const to = nodeMap.get(edge.to);
          if (!from || !to) return null;

          const color = getEdgeColor(edge.state);
          const isHighlighted = edge.state !== 'default';

          return (
            <g key={`${edge.from}-${edge.to}-${i}`}>
              <motion.line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={color}
                strokeWidth={isHighlighted ? 3 : 1.5}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5 }}
                markerEnd={edge.directed ? 'url(#arrowhead)' : undefined}
              />
              {edge.weight !== undefined && (
                <text
                  x={(from.x + to.x) / 2}
                  y={(from.y + to.y) / 2 - 8}
                  textAnchor="middle"
                  className="text-[10px] fill-text-tertiary font-mono"
                >
                  {edge.weight}
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const { fill, shadow } = getNodeColor(node.state);
          const glowFilter = node.state === 'current' ? 'url(#glow-orange)' :
                              node.state === 'path' ? 'url(#glow-green)' :
                              node.state === 'visited' ? 'url(#glow-blue)' : undefined;

          return (
            <motion.g key={node.id}>
              {/* Glow ring */}
              {node.state !== 'unvisited' && (
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r={24}
                  fill="none"
                  stroke={fill}
                  strokeWidth={2}
                  opacity={0.3}
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: node.state === 'current' ? Infinity : 0 }}
                  filter={glowFilter}
                />
              )}
              {/* Node circle */}
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={18}
                fill={fill}
                stroke={shadow !== 'none' ? fill : 'rgba(255,255,255,0.1)'}
                strokeWidth={2}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.3 }}
                filter={glowFilter}
                style={{ filter: shadow !== 'none' ? `drop-shadow(0 0 8px ${shadow})` : undefined }}
              />
              {/* Label */}
              <text
                x={node.x}
                y={node.y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs font-bold fill-white select-none"
              >
                {node.label}
              </text>
              {/* Distance label */}
              {node.distance !== undefined && node.distance !== Infinity && (
                <text
                  x={node.x}
                  y={node.y + 32}
                  textAnchor="middle"
                  className="text-[9px] fill-text-tertiary font-mono"
                >
                  d={node.distance}
                </text>
              )}
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}
