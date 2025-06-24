'use client';

import React, { createContext, useContext, useReducer, useEffect, useState, useRef, useCallback } from 'react';
import { AppState, TaskStatus, Message, FilterConfig } from '@/types';
import { api } from '@/utils/api';

interface AppContextType {
    state: AppState;
    dispatch: React.Dispatch<AppAction>;
    actions: {
        uploadFiles: (files: File[]) => Promise<void>;
        filterMessages: (config: FilterConfig) => Promise<void>;
        startAnalysis: (modules?: string[]) => Promise<void>;
        refreshData: () => Promise<void>;
        clearSession: () => Promise<void>;
        clearProcessed: () => Promise<void>;
        clearFiltered: () => Promise<void>;
        clearAnalysis: () => Promise<void>;
        insertProcessedMessages: (file: File) => Promise<void>;
        insertFilteredMessages: (file: File) => Promise<void>;
        insertAnalysisReport: (file: File) => Promise<void>;
        cancelTask: (taskId: string) => Promise<void>;
    };
}

type AppAction =
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_PROCESSED_MESSAGES'; payload: Message[] }
    | { type: 'SET_FILTERED_DATA'; payload: FilteredData | null }
    | { type: 'SET_SENDERS'; payload: string[] }
    | { type: 'SET_TASKS'; payload: TaskStatus[] }
    | { type: 'UPDATE_TASK'; payload: TaskStatus }
    | { type: 'SET_ANALYSIS_RESULT'; payload: any }
    | { type: 'RESET_STATE' };

const initialState: AppState = {
    processedMessages: [],
    // MODIFIED: Replace 'filteredMessages' with 'filteredData' and set its initial value to null.
    filteredData: null,
    senders: [],
    tasks: [],
    analysisResult: null,
    isLoading: false,
    error: null,
};

// Your reducer is already correct, as it uses 'SET_FILTERED_DATA'.
function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload, isLoading: false };
        case 'SET_PROCESSED_MESSAGES':
            return { ...state, processedMessages: action.payload };
        // This case now correctly updates the 'filteredData' property defined in initialState.
        case 'SET_FILTERED_DATA':
            return { ...state, filteredData: action.payload };
        case 'SET_SENDERS':
            return { ...state, senders: action.payload };
        case 'SET_ANALYSIS_RESULT':
            return { ...state, analysisResult: action.payload, isLoading: false };
        case 'RESET_STATE':
            // This now correctly resets the new state property as well
            return { ...initialState };
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
            return { ...state, tasks: newTasks };
        }
        case 'SET_TASKS': {
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
    const prevTasksRef = useRef<TaskStatus[]>([]);

    const refreshData = useCallback(async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            await Promise.all([
                (async () => {
                    try {
                        const processed = await api.getProcessedMessages();
                        dispatch({ type: 'SET_PROCESSED_MESSAGES', payload: processed });
                        const senders = Array.from(new Set(processed.map(msg => msg.sender)));
                        dispatch({ type: 'SET_SENDERS', payload: senders });
                    } catch (error) {
                        dispatch({ type: 'SET_PROCESSED_MESSAGES', payload: [] });
                        dispatch({ type: 'SET_SENDERS', payload: [] });
                    }
                })(),
                (async () => {
                    try {
                        const filteredData = await api.getFilteredMessages();
                        dispatch({ type: 'SET_FILTERED_DATA', payload: filteredData });
                    } catch (error) {
                        dispatch({ type: 'SET_FILTERED_DATA', payload: null });
                    }
                })(),
                (async () => {
                    try {
                        const analysis = await api.getAnalysisReport();
                        dispatch({ type: 'SET_ANALYSIS_RESULT', payload: analysis });
                    } catch (error) {
                        dispatch({ type: 'SET_ANALYSIS_RESULT', payload: null });
                    }
                })(),
            ]);
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: 'Could not refresh application data.' });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, []);

    const refreshTasks = useCallback(async () => {
        try {
            const response = await api.getSessionTasks();
            const tasksArray = Array.isArray(response.tasks)
                ? response.tasks
                : Object.values(response.tasks || {});
            dispatch({ type: 'SET_TASKS', payload: tasksArray });
        } catch (error) {
            console.error('Failed to get tasks:', error);
        }
    }, []);

    useEffect(() => {
        const shouldBePolling = state.tasks.some(
            (task) => task.status === 'pending' || task.status === 'running'
        );
        if (shouldBePolling !== isPolling) {
            setIsPolling(shouldBePolling);
        }
    }, [state.tasks, isPolling]);

    useEffect(() => {
        if (!isPolling) return;
        const pollTasks = async () => {
            try {
                const response = await api.getSessionTasks();
                const newTasksArray = Array.isArray(response.tasks)
                    ? response.tasks
                    : Object.values(response.tasks || {});

                const justCompletedTasks = newTasksArray.filter(currentTask => {
                    const prevTask = prevTasksRef.current.find(t => t.task_id === currentTask.task_id);
                    const statusTransition = prevTask &&
                        (prevTask.status === 'running' || prevTask.status === 'pending') &&
                        currentTask.status === 'completed';
                    const newAndCompleted = !prevTask && currentTask.status === 'completed';
                    return statusTransition || newAndCompleted;
                });

                dispatch({ type: 'SET_TASKS', payload: newTasksArray });

                if (justCompletedTasks.length > 0) {
                    await refreshData();
                }

                prevTasksRef.current = newTasksArray;

            } catch (error) {
                dispatch({ type: 'SET_ERROR', payload: 'Task polling failed.' });
            }
        };
        const intervalId = setInterval(pollTasks, 2000);
        return () => clearInterval(intervalId);
    }, [isPolling, refreshData]);

    const handleClearAction = async (clearFunction: () => Promise<any>, stageName: string) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            // Call the backend API to delete the file
            await clearFunction();

            // --- FIXED LOGIC ---
            // Instead of a full, risky refresh, just update the specific part of the state.
            if (stageName === 'analysis') {
                dispatch({ type: 'SET_ANALYSIS_RESULT', payload: null });
            } else if (stageName === 'filtered') {
                dispatch({ type: 'SET_FILTERED_DATA', payload: null });
                // You might also want to clear the analysis result here too, since it depends on filtered data
                dispatch({ type: 'SET_ANALYSIS_RESULT', payload: null });
            } else if (stageName === 'processed') {
                dispatch({ type: 'SET_PROCESSED_MESSAGES', payload: [] });
                dispatch({ type: 'SET_FILTERED_DATA', payload: null });
                dispatch({ type: 'SET_ANALYSIS_RESULT', payload: null });
            }
            // --- END FIXED LOGIC ---

        } catch (error: any) {
            dispatch({ type: 'SET_ERROR', payload: `Could not clear ${stageName} data.` });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const handleFileUploadAndInsert = async (file: File, insertFunction: (data: any) => Promise<any>) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const fileContent = await file.text();
            const jsonData = JSON.parse(fileContent);
            await insertFunction(jsonData);
            await refreshData();
        } catch (error: any) {
            dispatch({ type: 'SET_ERROR', payload: `Failed to upload and parse file: ${error.message}` });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const actions = {
        uploadFiles: async (files: File[]) => {
            if (!files || files.length === 0) {
                return;
            }
            dispatch({ type: 'SET_LOADING', payload: true });
            try {
                const task = await api.uploadFiles(files);
                await refreshTasks();
                dispatch({ type: 'UPDATE_TASK', payload: task });
            } catch (error: unknown) {
                dispatch({ type: 'SET_ERROR', payload: String(error) });
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        },
        // CORRECTED: Uses a robust FilterConfig type that matches the backend API.
        filterMessages: async (config: FilterConfig) => {
            dispatch({ type: 'SET_LOADING', payload: true });
            try {
                // api.filterMessages should be updated to send this config object directly.
                const result = await api.filterMessages(config);

                // The filter endpoint is synchronous, so we check for a task_id
                // just in case, but expect to fall into the else block.
                if ('task_id' in result) {
                    dispatch({ type: 'UPDATE_TASK', payload: result });
                } else {
                    await refreshData();
                }
            } catch (error: unknown) {
                dispatch({ type: 'SET_ERROR', payload: String(error) });
            } finally {
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        },
        startAnalysis: async (modules?: string[]) => {
            dispatch({ type: 'SET_LOADING', payload: true });
            try {
                const task = await api.startAnalysis(modules);
                await refreshTasks();
                dispatch({ type: 'UPDATE_TASK', payload: task });
            } catch (error: unknown) {
                dispatch({ type: 'SET_ERROR', payload: String(error) });
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        },
        refreshData,
        clearSession: async () => {
            try {
                await api.clearSession();
                dispatch({ type: 'RESET_STATE' });
            } catch (error: unknown) {
                dispatch({ type: 'SET_ERROR', payload: String(error) });
            }
        },
        clearProcessed: () => handleClearAction(api.clearProcessedData, 'processed'),
        clearFiltered: () => handleClearAction(api.clearFilteredData, 'filtered'),
        clearAnalysis: () => handleClearAction(api.clearAnalysisReport, 'analysis'),
        insertProcessedMessages: (file: File) => handleFileUploadAndInsert(file, api.insertProcessedMessages),
        insertFilteredMessages: (file: File) => handleFileUploadAndInsert(file, api.insertFilteredMessages),
        insertAnalysisReport: (file: File) => handleFileUploadAndInsert(file, api.insertAnalysisReport),
        cancelTask: async (taskId: string) => {
            try {
                await api.cancelTask(taskId);
                await refreshTasks();
            } catch (error: any) {
                console.error(`Failed to cancel task ${taskId}:`, error);
                dispatch({ type: 'SET_ERROR', payload: `Could not cancel task: ${error.message}` });
            }
        },
    };

    useEffect(() => {
        refreshData();
        refreshTasks();
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