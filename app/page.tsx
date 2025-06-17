"use client";

import React, { useState } from 'react';
import { useChat } from '../contexts/ChatContext';
import {
    Users, Trash2, User, MessageSquare, BarChart3, ArrowLeft, Upload, RefreshCw,
    Hash, CheckCircle, XCircle, Download, FileText, Filter, Play, Code
} from 'lucide-react';

import ChatAnalysisDashboard from "@/components/ChatAnalysisDashboard";
import { FileUpload } from "@/components/FileUpload";
import { SenderGroup } from "@/components/SenderGroup";
import { TaskProgress } from "@/components/TaskProgress";

// A helper component to safely display the debug state
const DebugView = () => {
    const { workflowState, currentTask, selectedFile, error, analysisResults } = useChat();

    // Create a summary of the task to avoid crashing the browser by stringifying the huge report
    const taskSummary = currentTask ? {
        ...currentTask,
        result: currentTask.result ? `Report available: ${!!currentTask.result.analysis_report}` : 'No result yet'
    } : null;

    return (
        <div className="bg-gray-800 text-white font-mono text-xs p-4 rounded-lg mt-8 border border-yellow-400/50">
            <h3 className="text-lg font-bold mb-2 text-yellow-400">DEBUG VIEW</h3>
            <p><span className="text-cyan-400">Workflow State:</span> {workflowState}</p>
            <p><span className="text-cyan-400">Selected File:</span> {selectedFile?.name || 'None'}</p>
            <p><span className="text-cyan-400">Error:</span> {error || 'None'}</p>
            <p><span className="text-cyan-400">Analysis Ready:</span> {!!analysisResults ? 'Yes' : 'No'}</p>
            <div className="mt-2">
                <p className="text-cyan-400">Current Task Summary:</p>
                <pre className="p-2 bg-gray-900 rounded-md overflow-x-auto">
                    {JSON.stringify(taskSummary, null, 2)}
                </pre>
            </div>
        </div>
    );
};


const ChatAnalyzer: React.FC = () => {
    // Get all state and functions from the context. No more local state management!
    const {
        workflowState, currentTask, selectedFile, error, analysisResults, handleFileSelect,
        handleProcessFile, handleFilter, handleAnalyze, handleDownload, handleClear, meList, removeList,
        otherLabel, setMeList, setRemoveList, setOtherLabel, availableSenders, setAvailableSenders,
        showDashboard, setShowDashboard
    } = useChat();

    const [showDebug, setShowDebug] = useState(false);

    const moveSender = (sender: string, targetList: 'me' | 'remove' | 'available') => {
        setAvailableSenders(p => p.filter(s => s !== sender).sort());
        setMeList(p => p.filter(s => s !== sender).sort());
        setRemoveList(p => p.filter(s => s !== sender).sort());

        if (targetList === 'me') setMeList(p => [...p, sender].sort());
        else if (targetList === 'remove') setRemoveList(p => [...p, sender].sort());
        else setAvailableSenders(p => [...p, sender].sort());
    };

    if (showDashboard && analysisResults) {
        return (
            <div className="min-h-screen bg-white">
                <div className="bg-white border-b px-6 py-4 flex items-center shadow-sm sticky top-0 z-10">
                    <button onClick={() => setShowDashboard(false)} className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Setup
                    </button>
                </div>
                <ChatAnalysisDashboard data={analysisResults} />
            </div>
        );
    }

    const isTaskRunning = currentTask?.status === 'running' || currentTask?.status === 'pending';

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 p-4 md:p-6">
            <div className="max-w-4xl mx-auto space-y-8 pb-16">
                <header className="text-center pt-8">
                    <h1 className="text-5xl font-extrabold text-gray-900">Chat Analyzer</h1>
                    <p className="text-xl text-gray-500 mt-2">Unlock insights from your conversations</p>
                    {workflowState !== 'idle' && (
                        <div className="mt-4">
                            <button onClick={handleClear} className="text-red-500 hover:text-red-700 text-sm group inline-flex items-center">
                                <RefreshCw className="w-3 h-3 mr-1 group-hover:rotate-45 transition-transform" />Start Over
                            </button>
                        </div>
                    )}
                </header>

                {error && <div className="p-4 bg-red-100 text-red-800 font-bold rounded-lg flex items-center gap-3 shadow-md border border-red-200"><XCircle className="w-6 h-6" /><p>{error}</p></div>}
                {currentTask?.status === 'completed' && <div className="p-4 bg-green-100 text-green-800 font-bold rounded-lg flex items-center gap-3 shadow-md border border-green-200"><CheckCircle className="w-6 h-6" /><p>{currentTask.result?.message || 'Task Completed!'}</p></div>}
                {isTaskRunning && <TaskProgress task={currentTask} />}

                <section className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center"><Upload className="w-6 h-6 mr-3 text-indigo-600" />1. Select & Process File</h2>
                    <FileUpload onFileSelected={handleFileSelect} disabled={isTaskRunning} />
                    {selectedFile && (
                        <div className="mt-4 text-center">
                            <button onClick={handleProcessFile} disabled={workflowState !== 'file_selected' || isTaskRunning} className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-transform">
                                <Play className="w-5 h-5 mr-2" />Process "{selectedFile.name}"
                            </button>
                        </div>
                    )}
                </section>

                {(workflowState === 'processed' || workflowState === 'filtered' || workflowState === 'analyzing' || workflowState === 'analyzed') && (
                    <>
                        <section className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-800 mb-5 flex items-center"><Users className="w-6 h-6 mr-3 text-purple-600" />2. Organize Senders</h2>
                            <div className="grid md:grid-cols-3 gap-4 mb-6">
                                <SenderGroup title="Me" icon={User} senders={meList} onDrop={(s) => moveSender(s, 'me')} onRemove={(s) => moveSender(s, 'available')} color="blue" />
                                <SenderGroup title="Remove" icon={Trash2} senders={removeList} onDrop={(s) => moveSender(s, 'remove')} onRemove={(s) => moveSender(s, 'available')} color="red" />
                                <div className="p-4 bg-gray-50 border rounded-lg shadow-inner">
                                    <label htmlFor="other-label" className="font-semibold text-gray-700 mb-2 flex items-center"><Hash className="w-5 h-5 mr-2 text-gray-500" />Label for Others</label>
                                    <input id="other-label" value={otherLabel} onChange={e => setOtherLabel(e.target.value)} className="w-full mt-1 px-4 py-2 border rounded-lg" />
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-3">Available Senders ({availableSenders.length})</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                {availableSenders.map(s => <div key={s} draggable onDragStart={e => e.dataTransfer.setData('text/plain', s)} className="px-3 py-2 bg-gray-100 border border-gray-200 rounded cursor-grab active:cursor-grabbing text-sm font-medium text-gray-700 truncate">{s}</div>)}
                            </div>
                        </section>

                        <section className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center"><Filter className="w-6 h-6 mr-3 text-green-600" />3. Filter & Analyze</h2>
                            <div className="flex flex-wrap gap-4 items-center">
                                <button onClick={handleFilter} disabled={isTaskRunning} className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 inline-flex items-center disabled:opacity-50">
                                    <MessageSquare className="w-5 h-5 mr-2" />Apply Filters
                                </button>
                                <button onClick={handleAnalyze} disabled={isTaskRunning || workflowState !== 'filtered'} className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
                                    <BarChart3 className="w-5 h-5 mr-2" />Run Full Analysis
                                </button>
                            </div>
                        </section>

                        <section className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center"><Download className="w-6 h-6 mr-3 text-gray-600" />4. Download Data</h2>
                            <div className="flex flex-wrap gap-4">
                                <button onClick={() => handleDownload('processed')} disabled={isTaskRunning} className="px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 inline-flex items-center disabled:opacity-50"><FileText className="w-4 h-4 mr-2" />Processed</button>
                                <button onClick={() => handleDownload('filtered')} disabled={workflowState !== 'filtered' && workflowState !== 'analyzed'} className="px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 inline-flex items-center disabled:opacity-50"><Filter className="w-4 h-4 mr-2" />Filtered</button>
                                <button onClick={() => handleDownload('report')} disabled={workflowState !== 'analyzed'} className="px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 inline-flex items-center disabled:opacity-50"><BarChart3 className="w-4 h-4 mr-2" />Report</button>
                            </div>
                        </section>
                    </>
                )}

                {workflowState === 'analyzed' && analysisResults && (
                    <section className="bg-white p-6 rounded-xl shadow-xl border mt-8">
                        <div className="text-center">
                            <button onClick={() => setShowDashboard(true)} className="px-8 py-4 bg-blue-600 text-white font-bold text-lg rounded-xl shadow-lg hover:bg-blue-700 transition-all transform hover:scale-105">
                                <BarChart3 className="w-6 h-6 mr-3" /> View Full Dashboard
                            </button>
                        </div>
                    </section>
                )}

                <div className="pt-4 text-center">
                    <button onClick={() => setShowDebug(p => !p)} className="text-xs text-gray-400 hover:text-gray-600 inline-flex items-center"><Code className="w-4 h-4 mr-1"/>Toggle Debug View</button>
                </div>
                {showDebug && <DebugView />}
            </div>
        </div>
    );
};

export default ChatAnalyzer;