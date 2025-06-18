'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AppState, TaskStatus, ProcessedMessage, AnalysisReport, FilterOptions } from '@/types';

interface AppContextType {
    state: AppState;
    dispatch: React.Dispatch<AppAction>;
}

type AppAction =
    | { type: 'SET_UPLOADED_FILE'; payload: File }
    | { type: 'SET_PROCESS_TASK'; payload: TaskStatus }
    | { type: 'SET_PROCESSED_MESSAGES'; payload: ProcessedMessage[] }
    | { type: 'SET_FILTERED_MESSAGES'; payload: ProcessedMessage[] }
    | { type: 'SET_FILTER_OPTIONS'; payload: FilterOptions }
    | { type: 'SET_ANALYSIS_TASK'; payload: TaskStatus }
    | { type: 'SET_ANALYSIS_REPORT'; payload: AnalysisReport }
    | { type: 'SET_CURRENT_STEP'; payload: 'upload' | 'filter' | 'analyze' | 'results' }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'RESET_STATE' };

const initialState: AppState = {
    uploadedFile: null,
    processTask: null,
    processedMessages: [],
    filteredMessages: [],
    filterOptions: { me: [], remove: [], other_label: 'other' },
    analysisTask: null,
    analysisReport: null,
    currentStep: 'upload',
    isLoading: false,
    error: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case 'SET_UPLOADED_FILE':
            return { ...state, uploadedFile: action.payload };
        case 'SET_PROCESS_TASK':
            return { ...state, processTask: action.payload };
        case 'SET_PROCESSED_MESSAGES':
            return { ...state, processedMessages: action.payload };
        case 'SET_FILTERED_MESSAGES':
            return { ...state, filteredMessages: action.payload };
        case 'SET_FILTER_OPTIONS':
            return { ...state, filterOptions: action.payload };
        case 'SET_ANALYSIS_TASK':
            return { ...state, analysisTask: action.payload };
        case 'SET_ANALYSIS_REPORT':
            return { ...state, analysisReport: action.payload };
        case 'SET_CURRENT_STEP':
            return { ...state, currentStep: action.payload };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'RESET_STATE':
            return initialState;
        default:
            return state;
    }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(appReducer, initialState);

    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
}
