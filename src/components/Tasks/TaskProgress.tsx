'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';

export default function TaskProgress() {
    const { state } = useAppContext();
    const tasks = state.tasks;

    if (tasks.length === 0) {
        return null;
    }

    const getTaskIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <Clock className="h-4 w-4 text-yellow-500" />;
            case 'running':
                return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
            case 'completed':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'failed':
                return <XCircle className="h-4 w-4 text-red-500" />;
            default:
                return <Clock className="h-4 w-4" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'warning';
            case 'running':
                return 'default';
            case 'completed':
                return 'success';
            case 'failed':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6"
            >
                <Card className="glass p-4">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg flex items-center space-x-2">
                            <span>Active Tasks</span>
                            <Badge variant="secondary">{state.tasks.length}</Badge>
                        </h3>

                        <div className="space-y-3">
                            {state.tasks.map((task) => (
                                <motion.div
                                    key={task.task_id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30"
                                >
                                    {getTaskIcon(task.status)}

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm font-medium truncate">
                                                Task: {task.task_id.slice(0, 8)}...
                                            </p>
                                            <Badge variant={getStatusColor(task.status) as any}>
                                                {task.status}
                                            </Badge>
                                        </div>

                                        {task.message && (
                                            <p className="text-xs text-muted-foreground mb-2">
                                                {task.message}
                                            </p>
                                        )}

                                        {task.status === 'running' && (
                                            <Progress
                                                value={task.progress}
                                                className="h-2"
                                                showLabel={false}
                                            />
                                        )}

                                        {task.error && (
                                            <p className="text-xs text-red-400 mt-1">
                                                Error: {task.error}
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </Card>
            </motion.div>
        </AnimatePresence>
    );
}