'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, XCircle, Loader2, X } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { Card } from '@/components/ui/custom/Card';
import { Progress } from '@/components/ui/custom/Progress';
import { Badge } from '@/components/ui/custom/Badge';
import { Button } from '@/components/ui/custom/Button';
import { TaskStatus } from '@/types';


const getTaskIcon = (status: string) => {
    switch (status) {
        case 'pending':
            return <Clock className="h-4 w-4 text-yellow-500" />;
        case 'running':
            return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
        case 'completed':
            return <CheckCircle className="h-4 w-4 text-green-500" />;
        case 'failed':
        case 'cancelled':
            return <XCircle className="h-4 w-4 text-red-500" />;
        default:
            return <Clock className="h-4 w-4 text-gray-400" />;
    }
};

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'pending': return 'warning';
        case 'running': return 'default';
        case 'completed': return 'success';
        case 'failed': return 'destructive';
        case 'cancelled': return 'secondary';
        default: return 'secondary';
    }
};

const getTaskDisplayName = (task: TaskStatus): string => {
    if (task.status === 'running' && task.stage) {
        return task.stage.replace(/_/g, ' ');
    }
    if (task.name) {
        const cleanedName = task.name.replace(/ worker/i, '').trim();
        return cleanedName.charAt(0).toUpperCase() + cleanedName.slice(1);
    }
    if (task.stage) {
        return task.stage;
    }
    if (task.task_id) {
        return `Task: ${task.task_id.slice(0, 8)}...`;
    }
    return 'Initializing Task...';
};


const getTaskProgress = (task: TaskStatus): number | null => {
    if (typeof task.progress === 'number' && task.progress > 0) {
        if (task.progress <= 1) {
            return task.progress * 100;
        }
        return Math.min(task.progress, 100);
    }

    // Fallback for parsing progress from a message string.
    if (task.message) {
        const progressMatch = task.message.match(/(\d+)\s*\/\s*(\d+)/);
        if (progressMatch) {
            const current = parseInt(progressMatch[1]);
            const total = parseInt(progressMatch[2]);
            if (total > 0) {
                return Math.min((current / total) * 100, 100);
            }
        }
    }

    return null;
};

export default function TaskProgress() {
    const { state, actions } = useAppContext();
    const validTasks = state.tasks.filter(task => task && task.task_id);

    if (validTasks.length === 0) {
        return null;
    }

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
                            <span>Session Tasks</span>
                            <Badge variant="secondary">{validTasks.length}</Badge>
                        </h3>

                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                            {validTasks.map((task) => {
                                const progressValue = getTaskProgress(task);
                                const isCancellable = task.status === 'pending' || task.status === 'running';

                                return (
                                    <motion.div
                                        key={task.task_id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex items-center space-x-3 p-3 rounded-lg bg-background/50 border"
                                    >
                                        {getTaskIcon(task.status)}

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-2 gap-2">
                                                <p className="text-sm font-medium truncate" title={getTaskDisplayName(task)}>
                                                    {getTaskDisplayName(task)}
                                                </p>
                                                <div className="flex items-center space-x-2 flex-shrink-0">
                                                    <Badge variant={getStatusVariant(task.status)}>
                                                        {task.status}
                                                    </Badge>
                                                    {isCancellable && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => actions.cancelTask(task.task_id)}
                                                            title="Cancel task"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            {task.message && (
                                                <p className="text-xs text-muted-foreground mb-2">
                                                    {task.message}
                                                </p>
                                            )}

                                            {typeof progressValue === 'number' && (
                                                <div className="mb-2">
                                                    <Progress
                                                        value={progressValue}
                                                        className="h-2"
                                                        showLabel={false}
                                                    />
                                                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                                        <span>{Math.round(progressValue)}%</span>
                                                    </div>
                                                </div>
                                            )}

                                            {task.status === 'running' && typeof progressValue !== 'number' && (
                                                <div className="flex justify-end text-xs text-muted-foreground mt-1">
                                                    <span className="animate-pulse">Processing...</span>
                                                </div>
                                            )}


                                            {task.error && (
                                                <p className="text-xs text-red-500 mt-1 font-medium">
                                                    Error: {task.error}
                                                </p>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </Card>
            </motion.div>
        </AnimatePresence>
    );
}
