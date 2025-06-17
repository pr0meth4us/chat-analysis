"use client";

import React, { createContext, useState, useContext, useCallback, useEffect, ReactNode } from 'react';
import { AnalysisResult, Task } from "@/types";
import {
    processFile, filterMessages, analyzeMessages, clearSession, getTaskStatus,
    downloadProcessedMessages, downloadFilteredMessages, downloadAnalysisReport
} from "@/utils/api";

// 1. Define the shape of our state and the context
type WorkflowState = 'idle' | 'file_selected' | 'processing' | 'processed' | 'filtered' | 'analyzing' | 'analyzed';

interface ChatContextType {
    workflowState: WorkflowState;
    currentTask: Task | null;
    selectedFile: File | null;
    error: string;
    analysisResults: AnalysisResult | null;

    // Actions
    handleFileSelect: (file: File | null) => void;
    handleProcessFile: () => Promise<void>;
    handleFilter: () => Promise<void>;
    handleAnalyze: () => Promise<void>;
    handleDownload: (type: 'processed' | 'filtered' | 'report') => Promise<void>;
    handleClear: () => Promise<void>;

    // State for the Filter UI
    meList: string[];
    removeList: string[];
    otherLabel: string;
    setMeList: React.Dispatch<React.SetStateAction<string[]>>;
    setRemoveList: React.Dispatch<React.SetStateAction<string[]>>;
    setOtherLabel: React.Dispatch<React.SetStateAction<string>>;

    // State for the Dashboard UI
    showDashboard: boolean;
    setShowDashboard: React.Dispatch<React.SetStateAction<boolean>>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// 2. Create the Provider Component
export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [workflowState, setWorkflowState] = useState<WorkflowState>('idle');
    const [currentTask, setCurrentTask] = useState<Task | null>(null);
    const [sessionId, setSessionId] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [availableSenders, setAvailableSenders] = useState<string[]>([]);
    const [meList, setMeList] = useState<string[]>([]);
    const [removeList, setRemoveList] = useState<string[]>([]);
    const [otherLabel, setOtherLabel] = useState<string>('Other');

    const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);
    const [showDashboard, setShowDashboard] = useState<boolean>(false);

    // Polling effect for background tasks
    useEffect(() => {
        if (currentTask && (currentTask.status === 'running' || currentTask.status === 'pending')) {
            console.log(`[POLLING] Checking status for task ${currentTask.task_id}...`);
            const intervalId = setInterval(async () => {
                try {
                    const updatedTask = await getTaskStatus(currentTask.task_id);
                    setCurrentTask(updatedTask);
                    console.log('[POLLING] Task updated:', updatedTask);

                    if (updatedTask.status === 'completed') {
                        if (workflowState === 'processing' && updatedTask.result?.unique_senders) {
                            setAvailableSenders(updatedTask.result.unique_senders);
                            setWorkflowState('processed');
                        } else if (workflowState === 'analyzing' && updatedTask.result?.analysis_report) {
                            setAnalysisResults(updatedTask.result.analysis_report);
                            setWorkflowState('analyzed');
                        }
                    } else if (updatedTask.status === 'failed') {
                        setError(updatedTask.error || 'Task failed.');
                        setWorkflowState('idle');
                    }
                } catch (err) {
                    setError('Could not poll task status.');
                    setWorkflowState('idle');
                }
            }, 2500);
            return () => clearInterval(intervalId);
        }
    }, [currentTask, workflowState]);

    const handleFileSelect = (file: File | null) => {
        console.log("[ACTION] File selected:", file?.name);
        setSelectedFile(file);
        if(file) {
            setWorkflowState('file_selected');
        } else {
            setWorkflowState('idle');
        }
    };

    const handleProcessFile = async () => {
        if (!selectedFile) return;
        console.log("[ACTION] handleProcessFile triggered");
        setError('');
        setCurrentTask(null);
        setWorkflowState('processing');
        try {
            const initialTask = await processFile(selectedFile);
            setCurrentTask(initialTask);
            if (initialTask.session_id) setSessionId(initialTask.session_id);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
            setWorkflowState('file_selected');
        }
    };

    const handleFilter = async () => {
        console.log("[ACTION] handleFilter triggered");
        setError('');
        try {
            await filterMessages({ me: meList, remove: removeList, other_label: otherLabel });
            setWorkflowState('filtered');
            setAnalysisResults(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Filter failed');
        }
    };

    const handleAnalyze = async () => {
        console.log("[ACTION] handleAnalyze triggered");
        setError('');
        setWorkflowState('analyzing');
        try {
            const initialTask = await analyzeMessages({ modules_to_run: null });
            setCurrentTask(initialTask);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Analysis failed to start.');
            setWorkflowState('filtered');
        }
    };

    const handleDownload = async (type: 'processed' | 'filtered' | 'report') => {
        console.log(`[ACTION] handleDownload triggered for type: ${type}`);
        setError('');
        try {
            switch (type) {
                case 'processed': await downloadProcessedMessages(); break;
                case 'filtered': await downloadFilteredMessages(); break;
                case 'report': await downloadAnalysisReport(); break;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Download failed.');
        }
    };

    const handleClear = async () => {
        console.log("[ACTION] handleClear triggered");
        await clearSession();
        setWorkflowState('idle'); setCurrentTask(null); setSessionId('');
        setError(''); setSelectedFile(null); setAvailableSenders([]);
        setMeList([]); setRemoveList([]); setOtherLabel('Other');
        setAnalysisResults(null); setShowDashboard(false);
    };

    const contextValue = {
        workflowState, currentTask, selectedFile, error, analysisResults, sessionId,
        handleFileSelect, handleProcessFile, handleFilter, handleAnalyze, handleDownload, handleClear,
        meList, removeList, otherLabel, setMeList, setRemoveList, setOtherLabel,
        availableSenders, setAvailableSenders, showDashboard, setShowDashboard
    };

    return <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>;
};

export const useChat = (): ChatContextType => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};