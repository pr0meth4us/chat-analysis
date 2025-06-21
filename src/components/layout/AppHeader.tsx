// src/components/layout/AppHeader.tsx
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, History, Info } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/custom/Button';
import Link from 'next/link';
import { DataRestoreModal } from '../Upload/DataRestoreModal';

interface AppHeaderProps {
    statusText: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ statusText }) => {
    const { actions } = useAppContext();
    const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);

    const handleClearSession = () => {
        if (window.confirm('Are you sure you want to clear all data for this session? This action cannot be undone.')) {
            actions.clearSession();
        }
    };

    return (
        <>
            <DataRestoreModal isOpen={isRestoreModalOpen} onClose={() => setIsRestoreModalOpen(false)} />

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4"
            >
                <div>
                    <h1 className="text-4xl font-bold gradient-text mb-2">Message Analyzer</h1>
                    <p className="text-muted-foreground text-lg">Analyze and explore your message data with powerful insights</p>
                    <p className="text-sm text-primary font-medium mt-1">{statusText}</p>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                    <Link href="/guide">
                        <Button variant="outline" size="sm" icon={Info}>
                            Guide
                        </Button>
                    </Link>
                    <Button variant="outline" size="sm" icon={History} onClick={() => setIsRestoreModalOpen(true)}>
                        Restore
                    </Button>
                    <Button className="bg-red-400" size="sm" icon={Trash2} onClick={handleClearSession}>
                        Clear Session
                    </Button>
                </div>
            </motion.div>
        </>
    );
};