'use client';

import React, { createContext, useContext, useReducer, useEffect, useState, useRef, useCallback } from 'react';
import { AppState, TaskStatus, Message, AnalysisResult } from '@/types';
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
        // --- NEW ACTIONS FOR INSERTING DATA ---
        insertProcessedMessages: (file: File) => Promise<void>;
        insertFilteredMessages: (file: File) => Promise<void>;
        insertAnalysisReport: (file: File) => Promise<void>;
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
        console.log("Refreshing all data...");
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
                        console.log('No processed messages yet.');
                        dispatch({ type: 'SET_PROCESSED_MESSAGES', payload: [] });
                        dispatch({ type: 'SET_SENDERS', payload: [] });
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
        if (!isPolling) {
            return;
        }
        const pollTasks = async () => {
            try {
                const response = await api.getSessionTasks();
                const newTasksArray = Array.isArray(response.tasks)
                    ? response.tasks
                    : Object.values(response.tasks || {});
                const justCompletedTasks = newTasksArray.filter(currentTask => {
                    const prevTask = prevTasksRef.current.find(t => t.task_id === currentTask.task_id);
                    return prevTask &&
                        (prevTask.status === 'running' || prevTask.status === 'pending') &&
                        currentTask.status === 'completed';
                });
                dispatch({ type: 'SET_TASKS', payload: newTasksArray });
                if (justCompletedTasks.length > 0) {
                    console.log(`${justCompletedTasks.length} task(s) completed. Refreshing data.`);
                    await refreshData();
                }
                prevTasksRef.current = newTasksArray;
            } catch (error) {
                console.error('Failed to poll tasks:', error);
                dispatch({ type: 'SET_ERROR', payload: 'Task polling failed.' });
            }
        };
        const intervalId = setInterval(pollTasks, 2000);
        return () => clearInterval(intervalId);
    }, [isPolling, refreshData]);

    const handleFileUploadAndInsert = async (file: File, insertFunction: (data: any) => Promise<any>) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
        try {
            const fileContent = await file.text();
            const jsonData = JSON.parse(fileContent);
            await insertFunction(jsonData);
            await refreshData(); // Refresh all data to reflect the new state
        } catch (error: any) {
            console.error("Failed to insert data:", error);
            dispatch({ type: 'SET_ERROR', payload: `Failed to upload and parse file: ${error.message}` });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const actions = {
        uploadFile: async (file: File) => {
            try {
                dispatch({ type: 'SET_LOADING', payload: true });
                dispatch({ type: 'SET_ERROR', payload: null });
                const task = await api.uploadFile(file);
                dispatch({ type: 'UPDATE_TASK', payload: task });
            } catch (error: unknown) {
                dispatch({ type: 'SET_ERROR', payload: String(error) });
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        },

        filterMessages: async (config: { me: string[]; remove: string[]; other_label: string }) => {
            try {
                dispatch({ type: 'SET_LOADING', payload: true });
                dispatch({ type: 'SET_ERROR', payload: null });
                const result = await api.filterMessages(config);
                if ('task_id' in result) {
                    dispatch({ type: 'UPDATE_TASK', payload: result });
                } else {
                    console.log('Filter executed immediately, refreshing data...');
                    await refreshData();
                }
            } catch (error: unknown) {
                dispatch({ type: 'SET_ERROR', payload: String(error) });
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        },

        startAnalysis: async (modules?: string[]) => {
            try {
                dispatch({ type: 'SET_LOADING', payload: true });
                dispatch({ type: 'SET_ERROR', payload: null });
                const task = await api.startAnalysis(modules);
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

        // --- IMPLEMENTATION OF NEW ACTIONS ---
        insertProcessedMessages: (file: File) => handleFileUploadAndInsert(file, api.insertProcessedMessages),
        insertFilteredMessages: (file: File) => handleFileUploadAndInsert(file, api.insertFilteredMessages),
        insertAnalysisReport: (file: File) => handleFileUploadAndInsert(file, api.insertAnalysisReport),
    };

    useEffect(() => {
        refreshData();
        const fetchInitialTasks = async () => {
            try {
                const response = await api.getSessionTasks();
                const tasksArray = Array.isArray(response.tasks)
                    ? response.tasks
                    : Object.values(response.tasks || {});
                dispatch({ type: 'SET_TASKS', payload: tasksArray });
                prevTasksRef.current = tasksArray;
            } catch (error) {
                console.error('Failed to get initial tasks:', error);
            }
        };
        fetchInitialTasks();
    }, [refreshData]);

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
