'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { ResultsDashboard } from '@/components/Dashboard/ResultsDashboard';
import { Card } from '@/components/ui/custom/Card';
import { Button } from '@/components/ui/custom/Button';
import { AppHeader } from '@/components/layout/AppHeader';
import Link from 'next/link';

export default function DashboardPage() {
    const { state } = useAppContext();
    const [isNavigating, setIsNavigating] = useState(false);

    const result = state.analysisResult;

    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-grow">
                <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
                    <AppHeader statusText={result ? 'Viewing full analysis report.' : 'No analysis data available.'} />

                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-6"
                    >
                        <Link href="/" passHref>
                            <Button
                                variant="outline"
                                icon={ArrowLeft}
                                loading={isNavigating}
                                onClick={() => setIsNavigating(true)}
                            >
                                {isNavigating ? 'Loading...' : 'Back to Analyzer'}
                            </Button>
                        </Link>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        {result ? (
                            <ResultsDashboard result={result} />
                        ) : (
                            <Card className="glass p-12 text-center">
                                <p className="text-muted-foreground mb-4">
                                    No analysis data found. Please run the analysis from the main page first.
                                </p>
                                <Link href="/" passHref>
                                    <Button loading={isNavigating} onClick={() => setIsNavigating(true)}>
                                        {isNavigating ? 'Loading...' : 'Back to Analyzer'}
                                    </Button>
                                </Link>
                            </Card>
                        )}
                    </motion.div>
                </div>
            </main>
        </div>
    );
}