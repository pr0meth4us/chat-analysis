import React from 'react';
import { Card } from '../layout/Card';

interface NgramTableProps {
    title: string;
    data?: { phrase: string, count: number }[];
}

export const NgramTable: React.FC<NgramTableProps> = ({ title, data }) => {
    if (!data || data.length === 0) return null;
    return (
        <Card>
            <h3 className="text-lg font-semibold mb-2 text-gray-200">{title}</h3>
            <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-sm text-left">
                    <tbody>
                    {data.map((item) => (
                        <tr key={item.phrase} className="border-b border-gray-700/50">
                            <td className="py-2 pr-4 text-gray-300">{item.phrase}</td>
                            <td className="py-2 text-right font-mono text-blue-400">{item.count}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
