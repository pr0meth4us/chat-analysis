'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import { ResultsDashboard } from '@/components/Dashboard/ResultsDashboard';
import { Card } from '@/components/ui/custom/Card';
import { Button } from '@/components/ui/custom/Button';
import Link from 'next/link';

export default function DashboardPage() {
    const { state } = useAppContext();

    const result = state.analysisResult;

    return (
        <div className="min-h-screen p-4 sm:p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-4xl font-bold gradient-text mb-2">
                        Full Analysis Dashboard
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        A comprehensive overview of all analysis modules.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    {/* This is the correct logic */}
                    {result ? (
                        <ResultsDashboard result={result} />
                    ) : (
                        <Card className="glass p-12 text-center">
                            <p className="text-muted-foreground mb-4">
                                No analysis data found. Please run the analysis from the main page first.
                            </p>
                            <Link href="/">
                                <Button>Back to Main Page</Button>
                            </Link>
                        </Card>
                    )}
                </motion.div>
            </div>
        </div>
    );
}