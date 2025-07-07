'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { DemoResultsDashboard } from '@/components/Dashboard/Demo';
import { Button } from '@/components/ui/custom/Button';
import Link from 'next/link';

export default function DashboardPage() {
    const [isNavigating, setIsNavigating] = useState(false);

    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-grow">
                <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">

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
                        < DemoResultsDashboard />

                    </motion.div>
                </div>
            </main>
        </div>
    );
}