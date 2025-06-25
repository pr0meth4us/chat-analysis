'use client';

import React, { useState, useMemo, MouseEvent } from 'react';

const COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
];

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
            className="relative font-sans"
            style={{ width, height }}
        >
            <svg
                width={width}
                height={height}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHovered(null)}
            >
                <defs></defs>
                <g>
                    {nodes.map((node, i) => (
                        <g
                            key={node.name}
                            onMouseEnter={() => setHovered(node)}
                            className="cursor-pointer"
                            style={{
                                opacity: hovered ? (hovered.name === node.name ? 1 : 0.8) : 1
                            }}
                        >
                            <rect
                                x={node.x}
                                y={node.y}
                                width={node.width}
                                height={node.height}
                                fill={COLORS[i % COLORS.length]}
                                stroke="#ffffff"
                                strokeWidth={1}
                            />
                            {node.width > 60 && node.height > 30 && (
                                <foreignObject
                                    x={node.x + 4}
                                    y={node.y + 4}
                                    width={node.width - 8}
                                    height={node.height - 8}
                                    style={{ pointerEvents: 'none' }}
                                >
                                    <div className="flex flex-col justify-center h-full text-center text-white">
                                        <div
                                            className="font-medium leading-tight mb-1"
                                            style={{ fontSize: Math.min(node.width / 6, node.height / 4, 18) }}
                                        >
                                            {node.name}
                                        </div>
                                        <div
                                            className="font-normal opacity-90"
                                            style={{ fontSize: Math.min(node.width / 8, node.height / 6, 14) }}
                                        >
                                            {node.value.toLocaleString()}
                                        </div>
                                    </div>
                                </foreignObject>
                            )}
                            {node.width <= 60 && node.height > 15 && (
                                <text
                                    x={node.x + node.width / 2}
                                    y={node.y + node.height / 2}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill="white"
                                    fontSize={Math.min(node.width / 3, node.height / 2, 14)}
                                    fontWeight="500"
                                >
                                    {node.name.charAt(0).toUpperCase()}
                                </text>
                            )}
                        </g>
                    ))}
                </g>
            </svg>

            {hovered && totalValue > 0 && (
                <div
                    className="absolute pointer-events-none z-10"
                    style={{
                        top: mousePos.y + 15,
                        left: mousePos.x + 15,
                    }}
                >
                    <div className="bg-black text-white px-3 py-2 text-sm border border-gray-300">
                        <div className="font-medium">{hovered.name}</div>
                        <div className="text-gray-300">
                            {hovered.value.toLocaleString()} messages
                        </div>
                        <div className="text-gray-400 text-xs">
                            {((hovered.value / totalValue) * 100).toFixed(1)}%
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};