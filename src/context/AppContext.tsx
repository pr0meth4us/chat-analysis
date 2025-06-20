'use client';

import React, { createContext, useContext, useReducer, useEffect, useState, useRef } from 'react';
import { AppState, TaskStatus, Message } from '@/types';
import { api } from '@/utils/api';

// ... (interface and type definitions remain the same)

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
            // When analysis result is set, stop loading
            return { ...state, analysisResult: action.payload, isLoading: false };
        case 'RESET_STATE':
            return initialState;

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
             // No need to check for analysis report here, polling will handle it.
            return { ...state, tasks: newTasks };
        }

        case 'SET_TASKS': {
             // We will let the polling effect handle data refreshing to avoid complexity here.
             // This reducer will now only be responsible for updating the tasks list in the state.
            return { ...state, tasks: action.payload };
        }

        default:
            return state;
    }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const [isPolling, setIsPolling] = useState(false);
    // Use a ref to track previous task states to detect changes
    const prevTasksRef = useRef<TaskStatus[]>([]);

    const refreshData = async () => {
        console.log("Refreshing all data...");
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            // Fetch all data points concurrently for speed
            await Promise.all([
                (async () => {
                    try {
                        const processed = await api.getProcessedMessages();
                        dispatch({ type: 'SET_PROCESSED_MESSAGES', payload: processed });
                        const senders = [...new Set(processed.map(msg => msg.sender))];
                        dispatch({ type: 'SET_SENDERS', payload: senders });
                    } catch (error) {
                        console.log('No processed messages yet.');
                        dispatch({ type: 'SET_PROCESSED_MESSAGES', payload: [] });
                    }
                })(),
                (async () => {
                    try {
                        const filtered = await api.getFilteredMessages();
                        dispatch({ type: 'SET_FILTERED_MESSAGES', payload: filtered });
                    } catch (error) {
                        console.log('No filtered messages yet.');
                        dispatch({ type: 'SET_FILTERED_MESSAGES', payload: [] });
                    }
                })(),
                (async () => {
                    try {
                        const analysis = await api.getAnalysisReport();
                        if (analysis) {
                            dispatch({ type: 'SET_ANALYSIS_RESULT', payload: analysis });
                        }
                    } catch (error) {
                        console.log('No analysis result yet.');
                        dispatch({ type: 'SET_ANALYSIS_RESULT', payload: null });
                    }
                })(),
            ]);
        } catch (error) {
            console.error('Failed to refresh data:', error);
            dispatch({ type: 'SET_ERROR', payload: 'Could not refresh application data.' });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };


    // Effect to control polling based on task status
    useEffect(() => {
        const shouldBePolling = state.tasks.some(
            (task) => task.status === 'pending' || task.status === 'running'
        );
        if (shouldBePolling !== isPolling) {
            setIsPolling(shouldBePolling);
        }
    }, [state.tasks, isPolling]);

    // MODIFIED POLLING LOGIC
    useEffect(() => {
        if (!isPolling) {
            return;
        }

        const pollTasks = async () => {
            try {
                const response = await api.getSessionTasks();
                const newTasksArray = Array.isArray(response.tasks)
                    ? response.tasks
                    : Object.values(response.tasks || {});

                // Find if any task has just completed since the last check
                const justCompletedTask = newTasksArray.find(currentTask => {
                    const prevTask = prevTasksRef.current.find(t => t.task_id === currentTask.task_id);
                    // A task just completed if its previous state was running/pending and now it's completed.
                    return prevTask && (prevTask.status === 'running' || prevTask.status === 'pending') && currentTask.status === 'completed';
                });

                // Update the tasks in the state
                dispatch({ type: 'SET_TASKS', payload: newTasksArray });

                // If a task just finished, refresh all app data to get the latest results
                if (justCompletedTask) {
                    console.log(`Task '${justCompletedTask.name}' completed. Refreshing data.`);
                    await refreshData();
                }

                // Update the ref for the next poll
                prevTasksRef.current = newTasksArray;

            } catch (error) {
                console.error('Failed to poll tasks:', error);
                dispatch({ type: 'SET_ERROR', payload: 'Task polling failed.' });
            }
        };

        const intervalId = setInterval(pollTasks, 2000);
        return () => clearInterval(intervalId);
    }, [isPolling]); // Removed refreshData from dependency array as it's stable


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
                 // Loading is set to false by the polling mechanism or data refresh
            }
        },

        filterMessages: async (config: { me: string[]; remove: string[]; other_label: string }) => {
            try {
                dispatch({ type: 'SET_LOADING', payload: true });
                dispatch({ type: 'SET_ERROR', payload: null });
                const task = await api.filterMessages(config);
                dispatch({ type: 'UPDATE_TASK', payload: task });
            } catch (error: any) {
                dispatch({ type: 'SET_ERROR', payload: error.message });
            } finally {
                 // Loading is set to false by the polling mechanism or data refresh
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
                // Loading is set to false by the polling mechanism or data refresh
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
        // Also fetch initial tasks
        const fetchInitialTasks = async () => {
            try {
                const response = await api.getSessionTasks();
                const tasksArray = Array.isArray(response.tasks)
                    ? response.tasks
                    : Object.values(response.tasks || {});
                dispatch({ type: 'SET_TASKS', payload: tasksArray });
                prevTasksRef.current = tasksArray; // Initialize prevTasksRef
            } catch (error) {
                console.error('Failed to get initial tasks:', error);
            }
        };
        fetchInitialTasks();
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