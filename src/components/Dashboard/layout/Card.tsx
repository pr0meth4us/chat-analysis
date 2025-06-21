import React, { ReactNode } from 'react';

export const Card = ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={`bg-gray-800/50 border border-gray-700/60 rounded-xl p-4 sm:p-6 shadow-lg ${className}`}>
        {children}
    </div>
);
