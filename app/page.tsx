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
  RefreshCw
} from 'lucide-react';

import ChatAnalysisDashboard from "@/components/ChatAnalysisDashboard";
import {
  uploadChatFiles,
  uploadZipFile,
  filterMessages,
  analyzeMessages,
  getStoredMessages,
  clearSession
} from "@/utils/api";
import {
  AnalysisResult,
  UploadResponse,
  Message
} from "@/types";
import {FileUpload} from "@/components/FileUpload";
import {SenderCard} from "@/components/SenderCard";
import {SenderGroup} from "@/components/SenderGroup";
import {AnalysisResults} from "@/components/AnalysisResults";

const ChatAnalyzer: React.FC = () => {
  const [sessionId, setSessionId] = useState<string>('');
  const [storedMessages, setStoredMessages] = useState<Message[]>([]);
  const [availableSenders, setAvailableSenders] = useState<string[]>([]);
  const [meList, setMeList] = useState<string[]>([]);
  const [removeList, setRemoveList] = useState<string[]>([]);
  const [otherLabel, setOtherLabel] = useState<string>('Other');
  const [filteredMessages, setFilteredMessages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isFiltering, setIsFiltering] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string>('');
  const [showDashboard, setShowDashboard] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<string>('');

  const handleFilesUploaded = async (files: File[]): Promise<void> => {
    if (files.length === 0) return;

    setIsUploading(true);
    setError('');
    setUploadSuccess('');

    try {
      // Check if it's a ZIP file
      const isZip = files.length === 1 && files[0].name.toLowerCase().endsWith('.zip');

      let response: UploadResponse;
      if (isZip) {
        response = await uploadZipFile(files[0]);
      } else {
        response = await uploadChatFiles(files);
      }

      setSessionId(response.session_id);
      setAvailableSenders(response.unique_senders || []);
      setUploadSuccess(response.message);

      // Get the stored messages
      const storedData = await getStoredMessages();
      setStoredMessages(storedData.messages);

      // Reset analysis state
      setAnalysisResults(null);
      setFilteredMessages([]);
      setShowDashboard(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, sender: string): void => {
    e.dataTransfer.setData('text/plain', sender);
  };

  const moveSenderToMe = (sender: string): void => {
    setAvailableSenders(prev => prev.filter(s => s !== sender));
    setRemoveList(prev => prev.filter(s => s !== sender));
    // @ts-ignore
    setMeList(prev => [...new Set([...prev, sender])]);
  };

  const moveSenderToRemove = (sender: string): void => {
    setAvailableSenders(prev => prev.filter(s => s !== sender));
    setMeList(prev => prev.filter(s => s !== sender));
    // @ts-ignore
    setRemoveList(prev => [...new Set([...prev, sender])]);
  };

  const moveSenderToAvailable = (sender: string): void => {
    setMeList(prev => prev.filter(s => s !== sender));
    setRemoveList(prev => prev.filter(s => s !== sender));
    // @ts-ignore
    setAvailableSenders(prev => [...new Set([...prev, sender])]);
  };

  const handleFilter = async (): Promise<void> => {
    if (storedMessages.length === 0) {
      setError('No messages to filter');
      return;
    }

    setIsFiltering(true);
    setError('');

    try {
      const filterData = {
        messages: storedMessages,
        me: meList,
        remove: removeList,
        other_label: otherLabel
      };

      const filterResponse = await filterMessages(filterData);
      setFilteredMessages(filterResponse.filtered_messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Filter failed');
    } finally {
      setIsFiltering(false);
    }
  };

  const handleAnalyze = async (): Promise<void> => {
    if (filteredMessages.length === 0) {
      setError('No filtered messages to analyze. Please filter messages first.');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      const analysisData = {
        filtered_messages: filteredMessages
      };

      const analysisResponse = await analyzeMessages(analysisData);
      setAnalysisResults(analysisResponse.analysis_report as AnalysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClearSession = async (): Promise<void> => {
    try {
      await clearSession();
      // Reset all state
      setSessionId('');
      setStoredMessages([]);
      setAvailableSenders([]);
      setMeList([]);
      setRemoveList([]);
      setFilteredMessages([]);
      setAnalysisResults(null);
      setUploadSuccess('');
      setError('');
      setShowDashboard(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear session');
    }
  };

  const handleViewDashboard = (): void => {
    setShowDashboard(true);
  };

  const handleBackToAnalyzer = (): void => {
    setShowDashboard(false);
  };

  // If showing dashboard, render the dashboard component
  if (showDashboard && analysisResults) {
    return (
      <div>
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <button
            onClick={handleBackToAnalyzer}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Analyzer
          </button>
        </div>
        <ChatAnalysisDashboard data={analysisResults} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Chat Analyzer</h1>
          <p className="text-gray-600">Upload chat files and analyze conversations</p>
          {sessionId && (
            <div className="mt-2 flex items-center justify-center gap-4">
              <p className="text-sm text-gray-500">Session: {sessionId}</p>
              <button
                onClick={handleClearSession}
                className="inline-flex items-center text-sm text-red-600 hover:text-red-700"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Clear Session
              </button>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Success Display */}
        {uploadSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 text-center">
            <MessageSquare className="w-5 h-5 inline mr-2" />
            {uploadSuccess}
          </div>
        )}

        {/* File Upload */}
        <FileUpload onFilesUploaded={handleFilesUploaded} isUploading={isUploading} />

        {/* Message Stats */}
        {storedMessages.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-700 text-center">
            <MessageSquare className="w-5 h-5 inline mr-2" />
            {storedMessages.length} messages loaded from {availableSenders.length} unique senders
          </div>
        )}

        {/* Sender Management */}
        {availableSenders.length > 0 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Organize Senders</h2>
              <p className="text-gray-600">Drag senders to categorize them, then filter and analyze</p>
            </div>

            {/* Available Senders */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Available Senders ({availableSenders.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {availableSenders.map((sender) => (
                  <SenderCard
                    key={sender}
                    sender={sender}
                    onDragStart={handleDragStart}
                  />
                ))}
              </div>
            </div>

            {/* Sender Groups */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SenderGroup
                title="Me"
                icon={User}
                senders={meList}
                onDrop={moveSenderToMe}
                onRemove={moveSenderToAvailable}
                color="blue"
              />
              <SenderGroup
                title="Remove"
                icon={Trash2}
                senders={removeList}
                onDrop={moveSenderToRemove}
                onRemove={moveSenderToAvailable}
                color="red"
              />
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-600" />
                  <label className="font-medium text-gray-900">Other Label</label>
                </div>
                <input
                  type="text"
                  value={otherLabel}
                  onChange={(e) => setOtherLabel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Label for other senders"
                />
              </div>
            </div>

            {/* Filter Button */}
            <div className="text-center">
              <button
                onClick={handleFilter}
                disabled={isFiltering}
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mr-4"
              >
                {isFiltering ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {isFiltering ? 'Filtering...' : 'Filter Messages'}
              </button>
            </div>
          </div>
        )}

        {/* Filtered Messages Status */}
        {filteredMessages.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 text-center">
            <BarChart3 className="w-5 h-5 inline mr-2" />
            {filteredMessages.length} messages ready for analysis
          </div>
        )}

        {/* Analyze Button */}
        {filteredMessages.length > 0 && (
          <div className="text-center">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <BarChart3 className="w-4 h-4 mr-2" />
              )}
              {isAnalyzing ? 'Analyzing...' : 'Analyze Chat'}
            </button>
          </div>
        )}

        {/* Analysis Results */}
        {analysisResults && (
          <div className="space-y-6">
            <AnalysisResults results={analysisResults} />

            {/* Dashboard Button */}
            <div className="text-center">
              <button
                onClick={handleViewDashboard}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                View Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatAnalyzer;