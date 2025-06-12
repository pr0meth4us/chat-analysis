"use client";

import React, { useState } from 'react';
import {
  Users,
  Trash2,
  User,
  MessageSquare,
  BarChart3,
  Loader2,
  ArrowLeft,
  Upload,
  RefreshCw,
  Hash,
  Search, // Added for keyword search
  CheckCircle, // Added for success messages
  XCircle // Added for error messages
} from 'lucide-react';

import ChatAnalysisDashboard from "@/components/ChatAnalysisDashboard";
import {
  uploadChatFiles,
  uploadZipFile,
  filterMessages,
  analyzeMessages,
  clearSession,
  countKeyword
} from "@/utils/api";
import {
  AnalysisResult,
  UploadResponse
} from "@/types";
import { FileUpload } from "@/components/FileUpload";
import { SenderCard } from "@/components/SenderCard";
import { SenderGroup } from "@/components/SenderGroup";
import { AnalysisResults } from "@/components/AnalysisResults";

const ChatAnalyzer: React.FC = () => {
  const [sessionId, setSessionId] = useState<string>('');
  const [availableSenders, setAvailableSenders] = useState<string[]>([]);
  const [meList, setMeList] = useState<string[]>([]);
  const [removeList, setRemoveList] = useState<string[]>([]);
  const [otherLabel, setOtherLabel] = useState<string>('Other');
  const [filteredMessages, setFilteredMessages] = useState<string[]>([]);
  const [keyword, setKeyword] = useState<string>('');
  const [keywordCounts, setKeywordCounts] = useState<Record<string, number>>({});
  const [totalMatches, setTotalMatches] = useState<number>(0);
  const [messageCount, setMessageCount] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isFiltering, setIsFiltering] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isCounting, setIsCounting] = useState<boolean>(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string>('');
  const [showDashboard, setShowDashboard] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<string>('');

  const handleFilesUploaded = async (files: File[]): Promise<void> => {
    if (!files.length) return;
    setIsUploading(true); setError(''); setUploadSuccess('');
    try {
      const isZip = files.length === 1 && files[0].name.toLowerCase().endsWith('.zip');
      const response: UploadResponse = isZip ?
        await uploadZipFile(files[0]) : await uploadChatFiles(files);
      setSessionId(response.session_id);
      setAvailableSenders(response.unique_senders || []);
      setUploadSuccess(response.message);
      // reset downstream
      setMeList([]); setRemoveList([]); setOtherLabel('Other');
      setFilteredMessages([]);
      setKeyword(''); setKeywordCounts({}); setTotalMatches(0); setMessageCount(0);
      setAnalysisResults(null); setShowDashboard(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally { setIsUploading(false); }
  };

  const moveSenderToMe = (sender: string) => {
    setAvailableSenders(prev => prev.filter(s => s !== sender));
    setRemoveList(prev => prev.filter(s => s !== sender));
    setMeList(prev => [...prev, sender]);
  };
  const moveSenderToRemove = (sender: string) => {
    setAvailableSenders(prev => prev.filter(s => s !== sender));
    setMeList(prev => prev.filter(s => s !== sender));
    setRemoveList(prev => [...prev, sender]);
  };
  const moveSenderToAvailable = (sender: string) => {
    setMeList(prev => prev.filter(s => s !== sender));
    setRemoveList(prev => prev.filter(s => s !== sender));
    setAvailableSenders(prev => [...prev, sender]);
  };

  const handleFilter = async () => {
    setIsFiltering(true); setError('');
    try {
      const resp = await filterMessages({ me: meList, remove: removeList, other_label: otherLabel });
      setFilteredMessages(resp.filtered_messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Filter failed');
    } finally { setIsFiltering(false); }
  };

  const handleCountKeyword = async () => {
    if (!keyword) { setError('Please enter a keyword to count.'); return; }
    setIsCounting(true); setError('');
    try {
      const res = await countKeyword(keyword);
      setKeywordCounts(res.counts);
      setTotalMatches(res.total_matches);
      setMessageCount(res.message_count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Keyword counting failed');
    } finally { setIsCounting(false); }
  };

  const handleAnalyze = async () => {
    if (!filteredMessages.length) { setError('No messages to analyze. Please filter messages first.'); return; }
    setIsAnalyzing(true); setError('');
    try {
      const res = await analyzeMessages();
      setAnalysisResults(res.analysis_report as AnalysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally { setIsAnalyzing(false); }
  };

  const handleClear = async () => {
    // Clear session on backend first
    await clearSession();
    // Reset all local states
    setSessionId('');
    setAvailableSenders([]);
    setMeList([]);
    setRemoveList([]);
    setOtherLabel('Other');
    setFilteredMessages([]);
    setKeyword('');
    setKeywordCounts({});
    setTotalMatches(0);
    setMessageCount(0);
    setAnalysisResults(null);
    setUploadSuccess('');
    setError('');
    setShowDashboard(false);
  };

  const handleViewDashboard = () => setShowDashboard(true);
  const handleBack = () => setShowDashboard(false);

  if (showDashboard && analysisResults) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center shadow-sm">
          <button onClick={handleBack} className="inline-flex items-center text-indigo-600 hover:text-indigo-800 transition-colors duration-200 font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Analyzer
          </button>
        </div>
        <ChatAnalysisDashboard data={analysisResults} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center pt-8">
          <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">Chat Analyzer</h1>
          <p className="text-lg text-gray-600 mt-2">Unlock insights from your conversations</p>
          {sessionId && (
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3 text-gray-600">
              <span className="text-sm font-medium">Session ID: <span className="text-blue-700 font-semibold">{sessionId.substring(0, 8)}...</span></span>
              <button onClick={handleClear} className="text-red-600 hover:text-red-800 inline-flex items-center text-sm transition-colors duration-200 group">
                <RefreshCw className="w-3 h-3 mr-1 group-hover:rotate-45 transition-transform" /> Clear Session
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded-lg flex items-center space-x-3 shadow-sm">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}
        {uploadSuccess && (
          <div className="p-4 bg-green-100 text-green-700 rounded-lg flex items-center space-x-3 shadow-sm">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-medium">{uploadSuccess}</p>
          </div>
        )}

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
            <Upload className="w-6 h-6 mr-3 text-blue-600" /> Upload Your Chat Data
          </h2>
          <FileUpload onFilesUploaded={handleFilesUploaded} isUploading={isUploading} />
        </div>

        {availableSenders.length > 0 && (
          <>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <h2 className="text-2xl font-semibold text-gray-800 mb-5 flex items-center">
                <Users className="w-6 h-6 mr-3 text-purple-600" /> Organize Senders ({availableSenders.length})
              </h2>
              <p className="text-gray-600 mb-4 text-sm">Drag senders into "Me" or "Remove" groups to categorize them for analysis.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <SenderGroup title="Me" icon={User} senders={meList} onDrop={moveSenderToMe} onRemove={moveSenderToAvailable} color="blue" />
                <SenderGroup title="Remove" icon={Trash2} senders={removeList} onDrop={moveSenderToRemove} onRemove={moveSenderToAvailable} color="red" />
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-inner">
                  <label htmlFor="other-label" className="font-medium text-gray-700 mb-2 flex items-center">
                    <Hash className="w-5 h-5 mr-2 text-gray-500" />
                    Custom Label for Others
                  </label>
                  <input
                    id="other-label"
                    value={otherLabel}
                    onChange={e => setOtherLabel(e.target.value)}
                    className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-gray-800 placeholder-gray-400"
                    placeholder="e.g., Friend, Group"
                  />
                  <p className="text-xs text-gray-500 mt-2">Senders not in 'Me' or 'Remove' will be grouped under this label.</p>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                <Users className="w-5 h-5 mr-2 text-gray-500" /> Available Senders
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {availableSenders.length > 0 ? (
                  availableSenders.map(s => <SenderCard key={s} sender={s} onDragStart={e => e.dataTransfer.setData('text/plain', s)} />)
                ) : (
                  <p className="text-sm text-gray-500 col-span-full text-center py-4">No unassigned senders.</p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleFilter}
                disabled={isFiltering || !sessionId}
                className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors duration-200 inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFiltering ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <MessageSquare className="w-5 h-5 mr-2" />}
                Filter Messages
              </button>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !filteredMessages.length}
                className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-200 inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <BarChart3 className="w-5 h-5 mr-2" />}
                Run Analysis
              </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <h2 className="text-2xl font-semibold text-gray-800 mb-5 flex items-center">
                <Search className="w-6 h-6 mr-3 text-orange-600" /> Keyword Search
              </h2>
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Enter keyword (e.g., 'hello', 'lol')"
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  className="flex-grow w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-150 ease-in-out text-gray-800 placeholder-gray-400"
                  disabled={!filteredMessages.length}
                />
                <button
                  onClick={handleCountKeyword}
                  disabled={isCounting || !keyword || !filteredMessages.length}
                  className="w-full sm:w-auto px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg shadow-md hover:bg-orange-700 transition-colors duration-200 inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCounting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Hash className="w-5 h-5 mr-2" />}
                  Count Keyword
                </button>
              </div>

              {messageCount > 0 && (
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-inner mt-4">
                  <p className="text-lg font-semibold text-gray-800 mb-3">Keyword "{keyword}" Results:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-3 bg-white rounded-lg shadow-sm border border-gray-100 text-center">
                      <p className="text-sm text-gray-600">Messages Analyzed</p>
                      <p className="text-2xl font-bold text-blue-600">{messageCount}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg shadow-sm border border-gray-100 text-center">
                      <p className="text-sm text-gray-600">Total Matches</p>
                      <p className="text-2xl font-bold text-green-600">{totalMatches}</p>
                    </div>
                    {Object.entries(keywordCounts).map(([sender, cnt]) => (
                      <div key={sender} className="p-3 bg-white rounded-lg shadow-sm border border-gray-100 text-center">
                        <p className="text-sm text-gray-600">"{keyword}" by {sender}</p>
                        <p className="text-2xl font-bold text-purple-600">{cnt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {analysisResults && (
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <h2 className="text-2xl font-semibold text-gray-800 mb-5 flex items-center">
                  <BarChart3 className="w-6 h-6 mr-3 text-pink-600" /> Final Analysis Report
                </h2>
                <AnalysisResults results={analysisResults} />
                <div className="text-center mt-6">
                  <button
                    onClick={handleViewDashboard}
                    className="px-8 py-4 bg-blue-600 text-white font-bold text-lg rounded-xl shadow-lg hover:bg-blue-700 transform hover:-translate-y-1 transition-all duration-300 inline-flex items-center"
                  >
                    <BarChart3 className="w-6 h-6 mr-3" /> View Full Dashboard
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatAnalyzer;