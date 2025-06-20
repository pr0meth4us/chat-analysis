'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Progress } from '@/components/ui/progress';
import { Badge, badgeVariants } from '@/components/ui/Badge';
import { TaskStatus } from '@/types';

/**
 * Renders an icon based on the task's status.
 * @param status The status string of the task.
 * @returns A JSX element representing the icon.
 */
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

/**
 * Determines the color variant for the status badge.
 * @param status The status string of the task.
 * @returns A variant string for the Badge component.
 */
const getStatusVariant = (status: string): VariantProps<typeof badgeVariants>['variant'] => {
    switch (status) {
        case 'pending': return 'warning';
        case 'running': return 'default';
        case 'completed': return 'success';
        case 'failed': return 'destructive';
        default: return 'secondary';
    }
};

/**
 * A defensive function to get a display name for a task.
 * It prioritizes the task name, then stage, and falls back to a truncated ID.
 * @param task The task object.
 * @returns A string to display as the task title.
 */
const getTaskDisplayName = (task: TaskStatus): string => {
    if (task.name) return task.name.charAt(0).toUpperCase() + task.name.slice(1);
    if (task.stage) return task.stage;
    // Safely access task_id only if it exists to prevent errors
    if (task.task_id) return `Task: ${task.task_id.slice(0, 8)}...`;
    return 'Initializing Task...';
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
                            {validTasks.map((task, index) => (
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

                                        {task.status === 'running' && (
                                            <Progress
                                                // Convert progress (0.0-1.0) to a percentage (0-100)
                                                value={(task.progress || 0) * 100}
                                                className="h-2"
                                                showLabel={false}
                                            />
                                        )}

                                        {task.error && (
                                            <p className="text-xs text-red-500 mt-1 font-medium">
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
