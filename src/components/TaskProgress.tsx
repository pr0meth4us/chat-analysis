'use client';

import { useAppContext } from '@/context/AppContext';
import { getTaskStatus, getProcessedMessages, getAnalysisReport } from '@/utils/api';
import { usePolling } from '@/hooks/usePolling';
import { TaskStatus } from '@/types';
import { CheckCircle, XCircle, Loader, Clock } from 'lucide-react';

interface TaskProgressProps {
    task: TaskStatus;
    taskType: 'process' | 'analysis'; // <-- FIX: Added explicit prop
}

export default function TaskProgress({ task, taskType }: TaskProgressProps) {
    const { dispatch } = useAppContext();

    const pollTaskStatus = async () => {
        // Stop polling if the task is no longer active
        if (task.status !== 'pending' && task.status !== 'running') {
            return;
        }

        try {
            const updatedTask = await getTaskStatus(task.task_id);

            // FIX: Use the 'taskType' prop to correctly handle different tasks
            if (taskType === 'process') {
                dispatch({ type: 'SET_PROCESS_TASK', payload: updatedTask });

                if (updatedTask.status === 'completed') {
                    const messages = await getProcessedMessages();
                    dispatch({ type: 'SET_PROCESSED_MESSAGES', payload: messages });
                    // Give a small delay for the user to see the "Completed" status
                    setTimeout(() => {
                        dispatch({ type: 'SET_CURRENT_STEP', payload: 'filter' });
                    }, 1000);
                }
            } else { // taskType === 'analysis'
                dispatch({ type: 'SET_ANALYSIS_TASK', payload: updatedTask });

                if (updatedTask.status === 'completed') {
                    const report = await getAnalysisReport();
                    dispatch({ type: 'SET_ANALYSIS_REPORT', payload: report });
                    // Give a small delay for the user to see the "Completed" status
                    setTimeout(() => {
                        dispatch({ type: 'SET_CURRENT_STEP', payload: 'results' });
                    }, 1000);
                }
            }

            // If the task fails, set an error message in the global state
            if (updatedTask.status === 'failed' || updatedTask.status === 'timeout') {
                dispatch({ type: 'SET_ERROR', payload: updatedTask.error || `Task ${updatedTask.status}`});
            }

        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update task' });
        }
    };

    usePolling(
        pollTaskStatus,
        2000,
        task.status === 'pending' || task.status === 'running'
    );

    const getStatusIcon = () => {
        switch (task.status) {
            case 'pending':
                return <Clock className="w-5 h-5 text-yellow-500" />;
            case 'running':
                return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
            case 'completed':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'failed':
            case 'timeout':
                return <XCircle className="w-5 h-5 text-red-500" />;
            default:
                return <Clock className="w-5 h-5 text-gray-500" />;
        }
    };

    const getStatusText = () => {
        switch (task.status) {
            case 'pending':
                return 'Waiting to start...';
            case 'running':
                return task.stage || 'Processing...';
            case 'completed':
                return 'Completed successfully';
            case 'failed':
                return task.error || 'Task failed';
            case 'timeout':
                return 'Task timed out';
            default:
                return 'Unknown status';
        }
    };

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Task Progress</h3>
                {getStatusIcon()}
            </div>

            <div className="space-y-4">
                <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>{getStatusText()}</span>
                        <span>{Math.round(task.progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${task.progress}%` }}
                        />
                    </div>
                </div>

                {task.message && (
                    <p className="text-sm text-gray-600">{task.message}</p>
                )}

                {task.status === 'failed' && task.error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-800 text-sm font-medium">Error Details:</p>
                        <p className="text-red-600 text-sm">{task.error}</p>
                    </div>
                )}
            </div>
        </div>
    );
}