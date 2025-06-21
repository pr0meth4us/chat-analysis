import React from 'react';

interface CodeBlockProps {
    children: React.ReactNode;
    className?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ children, className }) => {
    return (
        <pre className={`bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-sm text-slate-300 overflow-x-auto ${className}`}>
            <code>
                {children}
            </code>
        </pre>
    );
};