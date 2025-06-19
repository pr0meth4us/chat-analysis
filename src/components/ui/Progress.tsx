import React from 'react';
import { motion } from 'framer-motion';

interface ProgressProps {
    value: number;
    max?: number;
    className?: string;
    showLabel?: boolean;
    color?: 'primary' | 'success' | 'warning' | 'danger';
}

export function Progress({
                             value,
                             max = 100,
                             className = '',
                             showLabel = true,
                             color = 'primary'
                         }: ProgressProps) {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const colors = {
        primary: 'bg-primary',
        success: 'bg-green-500',
        warning: 'bg-yellow-500',
        danger: 'bg-red-500',
    };

    return (
        <div className={`w-full ${className}`}>
            {showLabel && (
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Progress</span>
                    <span className="text-sm font-medium">{Math.round(percentage)}%</span>
                </div>
            )}
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <motion.div
                    className={`h-full ${colors[color]} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                />
            </div>
        </div>
    );
}