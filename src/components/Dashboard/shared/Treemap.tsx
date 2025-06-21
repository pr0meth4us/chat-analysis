'use client';

import React, { useState, useMemo, MouseEvent } from 'react';

// Color scheme for the treemap rectangles
const COLORS = ['#4A90E2', '#50E3C2', '#F5A623', '#D0021B', '#BD10E0', '#7ED321'];

type DataItem = {
  name: string;
  value: number;
};

type Node = DataItem & {
  x: number;
  y: number;
  width: number;
  height: number;
};

// Squarify layout algorithm
const squarify = (data: DataItem[], width: number, height: number) => {
  const nodes: Node[] = [];
  const sorted = [...data].sort((a, b) => b.value - a.value);

  function layout(items: DataItem[], x: number, y: number, w: number, h: number) {
    if (items.length === 0) return;
    const total = items.reduce((sum, i) => sum + i.value, 0);
    if (total === 0) return;

    const [first, ...rest] = items;
    const scale = (w * h) / total;

    if (w < h) {
      const hItem = (first.value * scale) / w;
      nodes.push({ ...first, x, y, width: w, height: hItem });
      layout(rest, x, y + hItem, w, h - hItem);
    } else {
      const wItem = (first.value * scale) / h;
      nodes.push({ ...first, x, y, width: wItem, height: h });
      layout(rest, x + wItem, y, w - wItem, h);
    }
  }

  layout(sorted, 0, 0, width, height);
  const totalValue = data.reduce((sum, i) => sum + i.value, 0);
  return { nodes, totalValue };
};

export const Treemap: React.FC<{ data: DataItem[]; width: number; height: number }> = ({
  data,
  width,
  height,
}) => {
  const [hovered, setHovered] = useState<Node | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const { nodes, totalValue } = useMemo(() => {
    if (!data || width <= 0 || height <= 0) {
      return { nodes: [] as Node[], totalValue: 0 };
    }
    return squarify(data, width, height);
  }, [data, width, height]);

  const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        fontFamily:
          '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <svg
        width={width}
        height={height}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
      >
        <g>
          {nodes.map((node, i) => (
            <g
              key={node.name}
              onMouseEnter={() => setHovered(node)}
              style={{ transition: 'opacity 0.2s ease-in-out' }}
              opacity={hovered ? (hovered.name === node.name ? 1 : 0.6) : 1}
            >
              <rect
                x={node.x}
                y={node.y}
                width={node.width}
                height={node.height}
                fill={COLORS[i % COLORS.length]}
                stroke="#1a202c"
                strokeWidth={2}
              />
              {node.width > 70 && node.height > 40 && (
                <foreignObject
                  x={node.x}
                  y={node.y}
                  width={node.width}
                  height={node.height}
                  style={{ pointerEvents: 'none', textAlign: 'center', color: 'white' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      height: '100%',
                      padding: '4px',
                    }}
                  >
                    <div style={{  fontSize: '14px' }}>{node.name}</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>
                      {node.value.toLocaleString()}
                    </div>
                  </div>
                </foreignObject>
              )}
            </g>
          ))}
        </g>
      </svg>

      {hovered && totalValue > 0 && (
        <div
          style={{
            position: 'absolute',
            top: mousePos.y + 15,
            left: mousePos.x + 15,
            padding: '8px 12px',
            background: 'rgba(26, 32, 44, 0.9)',
            border: '1px solid #4A5568',
            borderRadius: '6px',
            color: 'white',
            pointerEvents: 'none',
            transition: 'opacity 0.2s',
            fontSize: '14px',
          }}
        >
          <div style={{ fontWeight: 'bold' }}>{hovered.name}</div>
          <div>{((hovered.value / totalValue) * 100).toFixed(2)}% of messages</div>
        </div>
      )}
    </div>
  );
};
