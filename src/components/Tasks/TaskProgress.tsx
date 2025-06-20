'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { Card } from '@/components/ui/custom/Card';
import { Progress } from '@/components/ui/custom/Progress';
import { Badge, badgeVariants } from '@/components/ui/custom/Badge';
import { TaskStatus } from '@/types';
import {VariantProps} from "class-variance-authority";


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
            return <Clock className="h-4 w-4 text-gray-400" />;
    }
};

const getStatusVariant = (status: string): VariantProps<typeof badgeVariants>['variant'] => {
    switch (status) {
        case 'pending': return 'warning';
        case 'running': return 'default';
        case 'completed': return 'success';
        case 'failed': return 'destructive';
        default: return 'secondary';
    }
};

const getTaskDisplayName = (task: TaskStatus): string => {
    if (task.name) return task.name.charAt(0).toUpperCase() + task.name.slice(1);
    if (task.stage) return task.stage;
    // Safely access task_id only if it exists to prevent errors
    if (task.task_id) return `Task: ${task.task_id.slice(0, 8)}...`;
    return 'Initializing Task...';
};

/**
 * Calculate progress percentage from the task data
 * @param task The task object
 * @returns Progress percentage (0-100)
 */
const getTaskProgress = (task: TaskStatus): number => {
    // If task has explicit progress field, use that
    if (typeof task.progress === 'number') {
        // If progress is between 0-1, convert to percentage
        if (task.progress <= 1) {
            return task.progress * 100;
        }
        // If already a percentage, use as-is
        return Math.min(task.progress, 100);
    }

    // Try to parse progress from the message field
    if (task.message) {
        // Look for patterns like "32 / 32 files parsed" or "5/10 complete"
        const progressMatch = task.message.match(/(\d+)\s*\/\s*(\d+)/);
        if (progressMatch) {
            const current = parseInt(progressMatch[1]);
            const total = parseInt(progressMatch[2]);
            if (total > 0) {
                return Math.min((current / total) * 100, 100);
            }
        }
    }

    // Default progress based on status
    switch (task.status) {
        case 'pending':
            return 0;
        case 'running':
            return 25; // Show some progress for running tasks without specific progress
        case 'completed':
            return 100;
        case 'failed':
            return 0;
        default:
            return 0;
    }
};

/**
 * TaskProgress component displays a list of all current session tasks with their status.
 */
export default function TaskProgress() {
    const { state } = useAppContext();

    // Filter out any null or undefined tasks to prevent errors
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
                            {validTasks.map((task, index) => {
                                const progressValue = getTaskProgress(task);

                                return (
                                    <motion.div
                                        key={task.task_id} // task_id is now guaranteed to exist
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex items-center space-x-3 p-3 rounded-lg bg-background/50 border"
                                    >
                                        {getTaskIcon(task.status)}

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-sm font-medium truncate">
                                                    {getTaskDisplayName(task)}
                                                </p>
                                                <Badge variant={getStatusVariant(task.status)}>
                                                    {task.status}
                                                </Badge>
                                            </div>

                                            {task.message && (
                                                <p className="text-xs text-muted-foreground mb-2">
                                                    {task.message}
                                                </p>
                                            )}

                                            {task.status !== 'completed' && (
                                                (task.status === 'running' ||
                                                    task.status === 'pending' ||
                                                    typeof task.progress === 'number') && (
                                                    <div className="mb-2">
                                                        <Progress
                                                            value={progressValue}
                                                            className="h-2"
                                                            showLabel={false}
                                                        />
                                                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                                            <span>{Math.round(progressValue)}%</span>
                                                            {task.status === 'running' && (
                                                                <span className="animate-pulse">Processing...</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
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