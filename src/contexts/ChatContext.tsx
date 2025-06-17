"use client";

import React, { createContext, useState, useContext, useCallback, useEffect, ReactNode } from 'react';
import { AnalysisResult, Task } from "@/types";
import {
  processFiles,
  filterMessages,
  analyzeMessages,
  clearSession,
  getTaskStatus,
  downloadProcessedMessages,
  downloadFilteredMessages,
  downloadAnalysisReport
} from "@/utils/api";

type WorkflowState = 'idle' | 'files_selected' | 'processing' | 'processed' | 'filtered' | 'analyzing' | 'analyzed';

interface ChatContextType {
  workflowState: WorkflowState;
  aggregatedTask: Task | null;
  selectedFiles: File[];
  error: string;
  analysisResults: AnalysisResult | null;
  availableModules: string[];

  // Actions
  handleFilesSelected: (files: File[]) => void;
  handleProcessFiles: () => Promise<void>;
  handleFilter: () => Promise<void>;
  handleAnalyze: (modulesToRun: string[] | null) => Promise<void>;
  handleDownload: (type: 'processed' | 'filtered' | 'report') => Promise<void>;
  handleClear: () => Promise<void>;

  // UI State & Setters
  meList: string[]; setMeList: React.Dispatch<React.SetStateAction<string[]>>;
  removeList: string[]; setRemoveList: React.Dispatch<React.SetStateAction<string[]>>;
  otherLabel: string; setOtherLabel: React.Dispatch<React.SetStateAction<string>>;
  availableSenders: string[]; setAvailableSenders: React.Dispatch<React.SetStateAction<string[]>>;
  showDashboard: boolean; setShowDashboard: React.Dispatch<React.SetStateAction<boolean>>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const ALL_MODULES = [
    'dataset_overview', 'temporal_patterns', 'unbroken_streaks', 'ghost_periods',
    'reaction_analysis', 'response_metrics', 'conversation_patterns', 'word_analysis',
    'emoji_analysis', 'sentiment_analysis', 'topic_modeling', 'user_behavior',
    'argument_analysis', 'relationship_metrics'
];

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [workflowState, setWorkflowState] = useState<WorkflowState>('idle');
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [aggregatedTask, setAggregatedTask] = useState<Task | null>(null);
  const [error, setError] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [availableSenders, setAvailableSenders] = useState<string[]>([]);
  const [meList, setMeList] = useState<string[]>([]);
  const [removeList, setRemoveList] = useState<string[]>([]);
  const [otherLabel, setOtherLabel] = useState<string>('Other');
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);
  const [showDashboard, setShowDashboard] = useState<boolean>(false);

  useEffect(() => {
    const tasksToPoll = activeTasks.filter(t => t.status === 'running' || t.status === 'pending');
    if (tasksToPoll.length === 0) return;

    const intervalId = setInterval(async () => {
      const promises = tasksToPoll.map(task => getTaskStatus(task.task_id));
      try {
        const updatedTasks = await Promise.all(promises);
        setActiveTasks(currentTasks =>
          currentTasks.map(oldTask => updatedTasks.find(ut => ut.task_id === oldTask.task_id) || oldTask)
        );
      } catch (err) { setError("Could not update task status from server."); }
    }, 2500);

    return () => clearInterval(intervalId);
  }, [activeTasks]);

  useEffect(() => {
    if (activeTasks.length === 0) {
      setAggregatedTask(null);
      return;
    }

    const allCompleted = activeTasks.every(t => t.status === 'completed');
    const anyFailed = activeTasks.find(t => t.status === 'failed' || t.status === 'timeout');

    if (anyFailed) {
      setAggregatedTask(anyFailed);
      setError(anyFailed.error || "A task failed.");
      setWorkflowState('files_selected');
      return;
    }

    if (allCompleted) {
      if (workflowState === 'processing') {
        const allSenders = new Set<string>();
        activeTasks.forEach(task => {
            task.result?.unique_senders?.forEach(sender => allSenders.add(sender));
        });
        setAvailableSenders(Array.from(allSenders).sort());
        setWorkflowState('processed');
        setSelectedFiles([]);
        setAggregatedTask(activeTasks[0]);
      }
      else if (workflowState === 'analyzing') {
        const analysisTask = activeTasks.find(t => t.result?.analysis_report);
        if (analysisTask) {
          setAnalysisResults(analysisTask.result!.analysis_report);
          setWorkflowState('analyzed');
        }
        setAggregatedTask(analysisTask || null);
      }
      return;
    }

    const runningTasks = activeTasks.filter(t => t.status === 'running' || t.status === 'pending');
    if (runningTasks.length > 0) {
      const totalProgress = activeTasks.reduce((sum, task) => sum + task.progress, 0);
      const avgProgress = totalProgress / activeTasks.length;
      const firstRunningTask = runningTasks[0];
      const stageMessage = activeTasks.length > 1 ? `Processing ${activeTasks.length} files...` : firstRunningTask.stage;
      setAggregatedTask({ ...firstRunningTask, progress: avgProgress, stage: stageMessage });
    }
  }, [activeTasks, workflowState]);

  const resetState = useCallback(() => {
    setWorkflowState('idle'); setActiveTasks([]); setAggregatedTask(null);
    setError(''); setSelectedFiles([]); setAvailableSenders([]);
    setMeList([]); setRemoveList([]); setOtherLabel('Other');
    setAnalysisResults(null); setShowDashboard(false);
  }, []);

  const handleFilesSelected = (files: File[]) => {
    setError('');
    setSelectedFiles(files);
    setWorkflowState(files.length > 0 ? 'files_selected' : 'idle');
  };

  const handleProcessFiles = async () => {
    if (selectedFiles.length === 0) return;
    setError(''); setActiveTasks([]);
    setWorkflowState('processing');
    try {
      const initialTasks = await processFiles(selectedFiles);
      setActiveTasks(initialTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setWorkflowState('files_selected');
    }
  };

  const handleFilter = async () => {
    setError('');
    try {
      await filterMessages({ me: meList, remove: removeList, other_label: otherLabel });
      setWorkflowState('filtered');
      setAnalysisResults(null);
    } catch (err) { setError(err instanceof Error ? err.message : 'Filter failed'); }
  };

  const handleAnalyze = async (modulesToRun: string[] | null) => {
    setError('');
    setWorkflowState('analyzing');
    try {
      const analysisTask = await analyzeMessages({ modules_to_run: modulesToRun });
      setActiveTasks([analysisTask]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed to start.');
      setWorkflowState('filtered');
    }
  };

  const handleDownload = async (type: 'processed' | 'filtered' | 'report') => {
    setError('');
    try {
      switch (type) {
        case 'processed': await downloadProcessedMessages(); break;
        case 'filtered': await downloadFilteredMessages(); break;
        case 'report': await downloadAnalysisReport(); break;
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Download failed.'); }
  };

  const handleClear = async () => {
    await clearSession();
    resetState();
  };

  const contextValue = {
    workflowState, aggregatedTask, selectedFiles, error, analysisResults, sessionId: '',
    handleFilesSelected, handleProcessFiles, handleFilter, handleAnalyze, handleDownload, handleClear,
    meList, removeList, otherLabel, setMeList, setRemoveList, setOtherLabel,
    availableSenders, setAvailableSenders, showDashboard, setShowDashboard,
    availableModules: ALL_MODULES,
  };

  return <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>;
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) throw new Error('useChat must be used within a ChatProvider');
  return context;
};