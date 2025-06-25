// src/components/ui/custom/JsonCodeBlock.tsx
'use client';

import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface JsonCodeBlockProps {
    data: object;
}

export const JsonCodeBlock: React.FC<JsonCodeBlockProps> = ({ data }) => {
    return (
        <div className="text-sm rounded-lg overflow-hidden bg-[#1E1E1E]">
            <SyntaxHighlighter
                language="json"
                style={vscDarkPlus}
                customStyle={{
                    margin: 0,
                    padding: '1rem',
                    backgroundColor: 'transparent',
                }}
                codeTagProps={{
                    style: {
                        fontFamily: '"Fira Code", "Dank Mono", monospace',
                    },
                }}
            >
                {JSON.stringify(data, null, 2)}
            </SyntaxHighlighter>
        </div>
    );
};