import React, { ReactNode } from 'react';
import { Card } from './Card';

export const StatCard = ({ title, value, subValue, icon, className }: { title: string; value: ReactNode; subValue?: ReactNode; icon?: string; className?: string }) => (
    <Card className={`${className} flex flex-col`}>
        <div className="flex items-start gap-4">
            {icon && <div className="text-3xl text-blue-400 mt-1 h-8 w-8 flex-shrink-0 flex items-center justify-center">{icon}</div>}
            <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-400 truncate">{title}</p>
                <div className="text-xl md:text-2xl font-bold text-white break-words whitespace-normal">{value}</div>
                {subValue && <div className="text-xs text-gray-500 truncate mt-1">{subValue}</div>}
            </div>
        </div>
    </Card>
);
