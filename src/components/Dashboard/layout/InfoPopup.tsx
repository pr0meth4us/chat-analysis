import React from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/utils';

interface InfoPopupProps {
    text: string;
    className?: string;
}

export const InfoPopup = ({ text, className }: InfoPopupProps) => (
    <div className={cn("group relative flex items-center", className)}>
        <Info className="h-4 w-4 text-gray-500 cursor-pointer" />
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-gray-900 border border-gray-700 text-gray-300 text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            {text}
        </div>
    </div>
);