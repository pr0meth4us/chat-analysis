"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Trash2, User, MessageSquare, BarChart3, ArrowLeft, Upload, RefreshCw,
  Hash, CheckCircle, XCircle, Download, FileText, Filter
} from 'lucide-react';

import ChatAnalysisDashboard from "@/components/ChatAnalysisDashboard";
import {
  processFile, filterMessages, analyzeMessages, clearSession, getTaskStatus,
  downloadProcessedMessages, downloadFilteredMessages, downloadAnalysisReport
} from "@/utils/api";
import { AnalysisResult, Task } from "@/types";
import { FileUpload } from "@/components/FileUpload";
import { SenderGroup } from "@/components/SenderGroup";
import { AnalysisResults } from "@/components/AnalysisResults";
import { TaskProgress } from "@/components/TaskProgress";

const ChatAnalyzer: React.FC = () => {
  // Core State
  const [sessionId, setSessionId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Task Management State
  const [currentTask, setCurrentTask] = useState<Task | null>(null);

  // Data & UI State
  const [availableSenders, setAvailableSenders] = useState<string[]>([]);
  const [meList, setMeList] = useState<string[]>([]);
  const [removeList, setRemoveList] = useState<string[]>([]);
  const [otherLabel, setOtherLabel] = useState<string>('Other');

  const [isDataProcessed, setIsDataProcessed] = useState<boolean>(false);
  const [isDataFiltered, setIsDataFiltered] = useState<boolean>(false);

  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);
  const [showDashboard, setShowDashboard] = useState<boolean>(false);

  // Polling effect for background tasks
  useEffect(() => {
    if (currentTask && (currentTask.status === 'running' || currentTask.status === 'pending')) {
      const intervalId = setInterval(async () => {
        try {
          const updatedTask = await getTaskStatus(currentTask.task_id);
          setCurrentTask(updatedTask);

          if (updatedTask.status === 'completed') {
            // If the processing task finished, update the sender list
            if (updatedTask.result?.unique_senders) {
              setAvailableSenders(updatedTask.result.unique_senders);
              setIsDataProcessed(true);
            }
            // If the analysis task finished, update the results
            if (updatedTask.result?.analysis_report) {
              setAnalysisResults(updatedTask.result.analysis_report);
            }
            setSuccessMessage(updatedTask.result?.message || 'Task completed successfully!');
          } else if (updatedTask.status === 'failed') {
            setError(updatedTask.error || 'Task failed for an unknown reason.');
          }
        } catch (err) {
          setError('Could not poll task status.');
        }
      }, 2000); // Poll every 2 seconds

      return () => clearInterval(intervalId);
    }
  }, [currentTask]);

  const handleProcessFile = async (file: File): Promise<void> => {
    if (!file) return;
    resetState();
    try {
      const initialTask = await processFile(file);
      setCurrentTask(initialTask);
      setSessionId(initialTask.session_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const handleFilter = async () => {
    setError(''); setSuccessMessage('');
    try {
      const resp = await filterMessages({ me: meList, remove: removeList, other_label: otherLabel });
      setSuccessMessage(resp.message);
      setIsDataFiltered(true);
      setAnalysisResults(null); // Clear old analysis results
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Filter failed');
    }
  };

  const handleAnalyze = async () => {
    setError(''); setSuccessMessage('');
    try {
      const initialTask = await analyzeMessages({ modules_to_run: null }); // Pass null to run all modules
      setCurrentTask(initialTask);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed to start.');
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
    } catch(err) {
      setError(err instanceof Error ? err.message : 'Download failed.');
    }
  };

  const resetState = useCallback(() => {
    setSessionId('');
    setError('');
    setSuccessMessage('');
    setCurrentTask(null);
    setAvailableSenders([]);
    setMeList([]);
    setRemoveList([]);
    setOtherLabel('Other');
    setIsDataProcessed(false);
    setIsDataFiltered(false);
    setAnalysisResults(null);
    setShowDashboard(false);
  }, []);

  const handleClear = async () => {
    await clearSession();
    resetState();
  };

  // Drag and Drop handlers
  const moveSender = (sender: string, targetList: 'me' | 'remove' | 'available') => {
    setAvailableSenders(p => p.filter(s => s !== sender));
    setMeList(p => p.filter(s => s !== sender));
    setRemoveList(p => p.filter(s => s !== sender));
    if (targetList === 'me') setMeList(p => [...p, sender]);
    else if (targetList === 'remove') setRemoveList(p => [...p, sender]);
    else setAvailableSenders(p => [...p, sender]);
  };

  if (showDashboard && analysisResults) {
    return (
        <div className="min-h-screen bg-gray-50">
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center shadow-sm sticky top-0 z-10">
            <button onClick={() => setShowDashboard(false)} className="inline-flex items-center text-indigo-600 hover:text-indigo-800 transition-colors duration-200 font-medium">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Analyzer
            </button>
          </div>
          <ChatAnalysisDashboard data={analysisResults} />
        </div>
    );
  }

  const isTaskRunning = currentTask?.status === 'running' || currentTask?.status === 'pending';

  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center pt-8">
            <h1 className="text-4xl font-extrabold text-gray-900">Chat Analyzer</h1>
            <p className="text-lg text-gray-600 mt-2">Unlock insights from your conversations</p>
            {sessionId && (
                <div className="mt-4 flex items-center justify-center gap-3 text-gray-600">
                  <span className="text-sm font-medium">Session ID: <span className="text-blue-700 font-semibold">{sessionId.substring(0, 8)}...</span></span>
                  <button onClick={handleClear} className="text-red-600 hover:text-red-800 inline-flex items-center text-sm transition-colors group">
                    <RefreshCw className="w-3 h-3 mr-1 group-hover:rotate-45 transition-transform" /> Clear Session
                  </button>
                </div>
            )}
          </div>

          {error && <div className="p-4 bg-red-100 text-red-700 rounded-lg flex items-center space-x-3 shadow-sm"><XCircle className="w-5 h-5" /><p>{error}</p></div>}
          {successMessage && <div className="p-4 bg-green-100 text-green-700 rounded-lg flex items-center space-x-3 shadow-sm"><CheckCircle className="w-5 h-5" /><p>{successMessage}</p></div>}
          {isTaskRunning && <TaskProgress task={currentTask} />}

          <div className="bg-white p-6 rounded-xl shadow-lg border">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center"><Upload className="w-6 h-6 mr-3 text-blue-600" />1. Process Your Chat File</h2>
            <FileUpload onFileSelected={handleProcessFile} isUploading={isTaskRunning} />
          </div>

          {isDataProcessed && (
              <>
                <div className="bg-white p-6 rounded-xl shadow-lg border">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-5 flex items-center"><Users className="w-6 h-6 mr-3 text-purple-600" />2. Organize Senders</h2>
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <SenderGroup title="Me" icon={User} senders={meList} onDrop={(s) => moveSender(s, 'me')} onRemove={(s) => moveSender(s, 'available')} color="blue" />
                    <SenderGroup title="Remove" icon={Trash2} senders={removeList} onDrop={(s) => moveSender(s, 'remove')} onRemove={(s) => moveSender(s, 'available')} color="red" />
                    <div className="p-4 bg-gray-50 border rounded-lg shadow-inner"><label htmlFor="other-label" className="font-medium text-gray-700 mb-2 flex items-center"><Hash className="w-5 h-5 mr-2" />Custom Label</label><input id="other-label" value={otherLabel} onChange={e => setOtherLabel(e.target.value)} className="w-full mt-1 px-4 py-2 border rounded-lg" placeholder="e.g., Friend" /></div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Available Senders ({availableSenders.length})</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {availableSenders.map(s => <div key={s} draggable onDragStart={e => e.dataTransfer.setData('text/plain', s)} className="px-3 py-2 bg-gray-100 rounded cursor-grab active:cursor-grabbing">{s}</div>)}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center"><Filter className="w-6 h-6 mr-3 text-green-600" />3. Filter & Analyze</h2>
                  <div className="flex flex-wrap gap-4 items-center">
                    <button onClick={handleFilter} disabled={isTaskRunning} className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 inline-flex items-center disabled:opacity-50">
                      <MessageSquare className="w-5 h-5 mr-2" />Filter Messages
                    </button>
                    <button onClick={handleAnalyze} disabled={isTaskRunning || !isDataFiltered} className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
                      <BarChart3 className="w-5 h-5 mr-2" />Run Analysis
                    </button>
                  </div>
                </div>
              </>
          )}

          {isDataProcessed && (
              <div className="bg-white p-6 rounded-xl shadow-lg border">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center"><Download className="w-6 h-6 mr-3 text-gray-600" />4. Download Data</h2>
                <div className="flex flex-wrap gap-4">
                  <button onClick={() => handleDownload('processed')} className="px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 inline-flex items-center"><FileText className="w-4 h-4 mr-2" />Processed Data</button>
                  <button onClick={() => handleDownload('filtered')} disabled={!isDataFiltered} className="px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 inline-flex items-center disabled:opacity-50"><Filter className="w-4 h-4 mr-2" />Filtered Data</button>
                  <button onClick={() => handleDownload('report')} disabled={!analysisResults} className="px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 inline-flex items-center disabled:opacity-50"><BarChart3 className="w-4 h-4 mr-2" />Analysis Report</button>
                </div>
              </div>
          )}

          {analysisResults && (
              <div className="bg-white p-6 rounded-xl shadow-lg border">
                <h2 className="text-2xl font-semibold text-gray-800 mb-5">Final Report</h2>
                <AnalysisResults results={analysisResults} />
                <div className="text-center mt-6">
                  <button onClick={() => setShowDashboard(true)} className="px-8 py-4 bg-blue-600 text-white font-bold text-lg rounded-xl shadow-lg hover:bg-blue-700 transition-all">
                    <BarChart3 className="w-6 h-6 mr-3" /> View Full Dashboard
                  </button>
                </div>
              </div>
          )}
        </div>
      </div>
  );
};

export default ChatAnalyzer;