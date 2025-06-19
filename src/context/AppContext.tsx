'use client';

import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { AppState, TaskStatus, Message } from '@/types';
import { api } from '@/utils/api';

interface AppContextType {
    state: AppState;
    dispatch: React.Dispatch<AppAction>;
    actions: {
        uploadFile: (file: File) => Promise<void>;
        filterMessages: (config: { me: string[]; remove: string[]; other_label: string }) => Promise<void>;
        startAnalysis: (modules?: string[]) => Promise<void>;
        refreshData: () => Promise<void>;
        clearSession: () => Promise<void>;
    };
}

type AppAction =
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_PROCESSED_MESSAGES'; payload: Message[] }
    | { type: 'SET_FILTERED_MESSAGES'; payload: Message[] }
    | { type: 'SET_SENDERS'; payload: string[] }
    | { type: 'SET_TASKS'; payload: TaskStatus[] }
    | { type: 'UPDATE_TASK'; payload: TaskStatus }
    | { type: 'SET_ANALYSIS_RESULT'; payload: any }
    | { type: 'RESET_STATE' };

const initialState: AppState = {
    processedMessages: [],
    filteredMessages: [],
    senders: [],
    tasks: [],
    analysisResult: null,
    isLoading: false,
    error: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload, isLoading: false };
        case 'SET_PROCESSED_MESSAGES':
            return { ...state, processedMessages: action.payload };
        case 'SET_FILTERED_MESSAGES':
            return { ...state, filteredMessages: action.payload };
        case 'SET_SENDERS':
            return { ...state, senders: action.payload };
        case 'SET_ANALYSIS_RESULT':
            return { ...state, analysisResult: action.payload };
        case 'RESET_STATE':
            return initialState;

        // --- MODIFIED LOGIC START ---
        case 'UPDATE_TASK': {
            const newTasks = [...state.tasks];
            const taskIndex = state.tasks.findIndex(
                (task) => task.task_id === action.payload.task_id
            );

            if (taskIndex !== -1) {
                newTasks[taskIndex] = action.payload;
            } else {
                newTasks.push(action.payload);
            }

            // After updating a task, check if it contains the analysis report.
            const analysisTask = action.payload;
            if (
                analysisTask.status === 'completed' &&
                analysisTask.result?.analysis_report
            ) {
                console.log('Analysis result found in updated task, setting state.');
                return {
                    ...state,
                    tasks: newTasks,
                    analysisResult: analysisTask.result
                };
            }

            return { ...state, tasks: newTasks };
        }

        case 'SET_TASKS': {
            const newTasks = action.payload;

            // When setting all tasks (e.g., on page load), find the latest analysis report.
            const latestAnalysisTask = newTasks
                .filter(task =>
                    task.status === 'completed' &&
                    task.result?.analysis_report &&
                    task.end_time // Ensure task has an end time to sort by
                )
                .sort((a, b) => new Date(b.end_time!).getTime() - new Date(a.end_time!).getTime())
                [0]; // Get the most recent one

            if (latestAnalysisTask) {
                console.log('Analysis result found in initial task list, setting state.');
                return {
                    ...state,
                    tasks: newTasks,
                    analysisResult: latestAnalysisTask.result
                };
            }

            return { ...state, tasks: newTasks };
        }
        // --- MODIFIED LOGIC END ---

        default:
            return state;
    }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const [isPolling, setIsPolling] = useState(false);

    // Effect to control polling based on task status
    useEffect(() => {
        const shouldBePolling = state.tasks.some(
            (task) => task.status === 'pending' || task.status === 'running'
        );
        if (shouldBePolling !== isPolling) {
            setIsPolling(shouldBePolling);
        }
    }, [state.tasks, isPolling]);

    // Effect to run the polling interval
    useEffect(() => {
        if (!isPolling) {
            return;
        }

        const pollTasks = async () => {
            try {
                const response = await api.getSessionTasks();
                const tasksArray = Array.isArray(response.tasks)
                    ? response.tasks
                    : Object.values(response.tasks || {});
                // Dispatching SET_TASKS will now automatically check for the analysis result
                dispatch({ type: 'SET_TASKS', payload: tasksArray });
            } catch (error) {
                console.error('Failed to poll tasks:', error);
            }
        };

        const intervalId = setInterval(pollTasks, 2000);
        return () => clearInterval(intervalId);
    }, [isPolling]);

    const refreshData = async () => {
        try {
            // Get processed messages
            try {
                const processed = await api.getProcessedMessages();
                dispatch({ type: 'SET_PROCESSED_MESSAGES', payload: processed });
                const senders = [...new Set(processed.map(msg => msg.sender))];
                dispatch({ type: 'SET_SENDERS', payload: senders });
            } catch (error) {
                console.log('No processed messages yet');
            }

            // Get filtered messages
            try {
                const filtered = await api.getFilteredMessages();
                dispatch({ type: 'SET_FILTERED_MESSAGES', payload: filtered });
            } catch (error) {
                console.log('No filtered messages yet');
            }

            // This call now acts as a fallback.
            // The primary logic is now in the reducer for SET_TASKS.
            try {
                const analysis = await api.getAnalysisReport();
                if (analysis) {
                    dispatch({ type: 'SET_ANALYSIS_RESULT', payload: analysis });
                }
            } catch (error) {
                console.log('No analysis result from direct /data/report endpoint.');
            }

            // Get current tasks, which will trigger our new reducer logic to find the report.
            try {
                const response = await api.getSessionTasks();
                const tasksArray = Array.isArray(response.tasks)
                    ? response.tasks
                    : Object.values(response.tasks || {});
                dispatch({ type: 'SET_TASKS', payload: tasksArray });
            } catch (error) {
                console.error('Failed to get tasks during refresh:', error);
            }
        } catch (error) {
            console.error('Failed to refresh data:', error);
        }
    };

    const actions = {
        uploadFile: async (file: File) => {
            try {
                dispatch({ type: 'SET_LOADING', payload: true });
                dispatch({ type: 'SET_ERROR', payload: null });
                const task = await api.uploadFile(file);
                dispatch({ type: 'UPDATE_TASK', payload: task });
            } catch (error: any) {
                dispatch({ type: 'SET_ERROR', payload: error.message });
            } finally {
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        },

        filterMessages: async (config: { me: string[]; remove: string[]; other_label: string }) => {
            try {
                dispatch({ type: 'SET_LOADING', payload: true });
                dispatch({ type: 'SET_ERROR', payload: null });
                await api.filterMessages(config);
                await refreshData();
            } catch (error: any) {
                dispatch({ type: 'SET_ERROR', payload: error.message });
            } finally {
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        },

        startAnalysis: async (modules?: string[]) => {
            try {
                dispatch({ type: 'SET_LOADING', payload: true });
                dispatch({ type: 'SET_ERROR', payload: null });
                const task = await api.startAnalysis(modules);
                dispatch({ type: 'UPDATE_TASK', payload: task });
            } catch (error: any) {
                dispatch({ type: 'SET_ERROR', payload: error.message });
            } finally {
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        },

        refreshData,

        clearSession: async () => {
            try {
                await api.clearSession();
                dispatch({ type: 'RESET_STATE' });
            } catch (error: any) {
                dispatch({ type: 'SET_ERROR', payload: error.message });
            }
        },
    };

    // Initial data load on component mount
    useEffect(() => {
        refreshData();
    }, []);

    return (
        <AppContext.Provider value={{ state, dispatch, actions }}>
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppContextProvider');
    }
    return context;
}