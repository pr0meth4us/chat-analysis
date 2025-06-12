"use client";

import React, { useState } from 'react';
import {
  Users,
  Trash2,
  User,
  MessageSquare,
  BarChart3,
  Loader2,
  ArrowLeft
} from 'lucide-react';

import ChatAnalysisDashboard from "@/components/ChatAnalysisDashboard";
import {runChatAnalysis, uploadChatFiles} from "@/utils/api";
import {
  AnalysisResult,
  AnalysisResultsProps,
  UploadResponse
} from "@/types";
import {FileUpload} from "@/components/FileUpload";
import {SenderCard} from "@/components/SenderCard";
import {SenderGroup} from "@/components/SenderGroup";
import {AnalysisResults} from "@/components/AnalysisResults";

// Main Component
const ChatAnalyzer: React.FC = () => {
  const [uploadedData, setUploadedData] = useState<UploadResponse | null>(null);
  const [availableSenders, setAvailableSenders] = useState<string[]>([]);
  const [meList, setMeList] = useState<string[]>([]);
  const [removeList, setRemoveList] = useState<string[]>([]);
  const [otherLabel, setOtherLabel] = useState<string>('Other');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string>('');
  const [showDashboard, setShowDashboard] = useState<boolean>(false);

  const handleFilesUploaded = async (files: File[]): Promise<void> => {
    if (files.length === 0) return;

    setIsUploading(true);
    setError('');

    try {
      const response = await uploadChatFiles(files);
      setUploadedData(response);
      setAvailableSenders(response.unique_senders || []);
      setAnalysisResults(null);
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

  const handleAnalyze = async (): Promise<void> => {
    if (!uploadedData?.processed_messages) {
      setError('No messages to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      const analysisData = {
        messages: uploadedData.processed_messages,
        me: meList,
        remove: removeList,
        other_label: otherLabel
      };

      const results = await runChatAnalysis(analysisData);
      setAnalysisResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
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
          </div>

          {/* Error Display */}
          {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {error}
              </div>
          )}

          {/* File Upload */}
          <FileUpload onFilesUploaded={handleFilesUploaded} isUploading={isUploading} />

          {/* Upload Success */}
          {uploadedData && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 text-center">
                <MessageSquare className="w-5 h-5 inline mr-2" />
                {uploadedData.message}
              </div>
          )}

          {/* Sender Management */}
          {availableSenders.length > 0 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Organize Senders</h2>
                  <p className="text-gray-600">Drag senders to categorize them</p>
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

                {/* Analyze Button */}
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