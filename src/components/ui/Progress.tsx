'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ProgressProps {
    value: number; // Expects a value from 0 to 100
    className?: string;
    showLabel?: boolean;
    color?: 'primary' | 'success' | 'warning' | 'danger';
}

/**
 * A customizable progress bar component with smooth animations.
 */
export function Progress({
    value,
    className = '',
    showLabel = true,
    color = 'primary'
}: ProgressProps) {
    // Ensure the percentage is clamped between 0 and 100
    const percentage = Math.min(Math.max(value, 0), 100);

    const colors = {
        primary: 'bg-primary',
        success: 'bg-green-500',
        warning: 'bg-yellow-500',
        danger: 'bg-red-500',
    };

    return (
        <div className={`w-full ${className}`}>
            {showLabel && (
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-muted-foreground">Progress</span>
                    <span className="text-sm font-bold">{Math.round(percentage)}%</span>
                </div>
            )}
            <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
                <motion.div
                    className={`h-full ${colors[color]} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, ease: 'circOut' }}
                />
            </div>
        </div>
    );
}
