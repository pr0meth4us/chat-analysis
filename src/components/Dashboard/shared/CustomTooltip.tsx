import React from 'react';
import { TooltipProps } from 'recharts';

export const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-gray-800 p-3 border border-gray-600 rounded-lg shadow-xl">
                <p className="font-bold text-white">{label}</p>
                {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{`${p.name}: ${p.value}`}</p>)}
            </div>
        );
    }
    return null;
};
