"use client";

import React, { useState, useCallback } from 'react';
import {
  Upload,
  Users,
  Trash2,
  User,
  MessageSquare,
  BarChart3,
  FileText,
  Loader2,
  ArrowLeft
} from 'lucide-react';

import ChatAnalysisDashboard from "@/components/ChatAnalysisDashboard";

// Type Definitions
interface Message {
  sender: string;
  content: string;
  timestamp?: string;
}

interface UploadResponse {
  message: string;
  unique_senders: string[];
  processed_messages: Message[];
}

interface AnalysisResult {
  dataset_overview: {
    total_messages: number;
    date_range: {
      total_days: number;
      start_date: string;
      end_date: string;
    };
  };
  relationship_metrics: {
    relationship_intensity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREMELY_HIGH';
    daily_average_messages: number;
    avg_response_time_minutes: number;
    balance_score: number;
    peak_single_day_messages: number;
    most_active_date: string;
    communication_balance: Record<string, number>;
  };
  conversation_patterns: {
    total_conversations: number;
    avg_conversation_duration_minutes: number;
    avg_conversation_length: number;
    conversation_starters: Record<string, number>;
    conversation_enders: Record<string, number>;
  };
  ghost_analysis: {
    total_ghost_periods: number;
    longest_ghost_hours: number;
    who_breaks_silence_most: Record<string, number>;
    top_10_ghost_periods: GhostPeriod[];
  };
  user_behavior: Record<string, UserBehavior>;
  word_analysis: {
    english_word_count: number;
    khmer_word_count: number;
    top_50_meaningful_words: [string, number][];
  };
}

interface GhostPeriod {
  duration_hours: number;
  last_sender_before_ghost: string;
  who_broke_silence: string;
  last_message_before_ghost: string;
  first_message_after_ghost: string;
}

interface UserBehavior {
  total_messages: number;
  avg_message_length: number;
  emoji_usage_rate: number;
  vocabulary_size: number;
  active_days: Record<string, number>;
}

interface FileUploadProps {
  onFilesUploaded: (files: File[]) => void;
  isUploading: boolean;
}

interface SenderGroupProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  senders: string[];
  onDrop: (sender: string) => void;
  onRemove: (sender: string) => void;
  color?: 'blue' | 'green' | 'red' | 'gray';
}

interface SenderCardProps {
  sender: string;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, sender: string) => void;
}

interface AnalysisResultsProps {
  results: AnalysisResult | null;
}

// API Functions
const uploadChatFiles = async (files: File[]): Promise<UploadResponse> => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const response = await fetch("http://localhost:5328/api/upload", {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown upload error" }));
    throw new Error(error.error || `Upload failed with status ${response.status}`);
  }

  return response.json();
};

const runChatAnalysis = async (requestData: {
  messages: Message[];
  me: string[];
  remove: string[];
  other_label: string;
}): Promise<AnalysisResult> => {
  const response = await fetch("http://localhost:5328/api/filter_and_analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown analysis error" }));
    throw new Error(error.error || `Analysis failed with status ${response.status}`);
  }

  return response.json();
};

// Components
const FileUpload: React.FC<FileUploadProps> = ({ onFilesUploaded, isUploading }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    onFilesUploaded(files);
  }, [onFilesUploaded]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onFilesUploaded(files);
  }, [onFilesUploaded]);

  return (
      <div className="w-full max-w-2xl mx-auto">
        <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                isDragOver
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
            } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
          {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 rounded-xl">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
          )}

          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Chat Files</h3>
          <p className="text-gray-500 mb-4">
            Drag and drop your chat files here, or click to select
          </p>

          <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
          />

          <button
              type="button"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={isUploading}
          >
            <FileText className="w-4 h-4 mr-2" />
            Choose Files
          </button>
        </div>
      </div>
  );
};

const SenderGroup: React.FC<SenderGroupProps> = ({
                                                   title,
                                                   icon: Icon,
                                                   senders,
                                                   onDrop,
                                                   onRemove,
                                                   color = "gray"
                                                 }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    red: 'border-red-200 bg-red-50',
    gray: 'border-gray-200 bg-gray-50'
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const sender = e.dataTransfer.getData('text/plain');
    if (sender) onDrop(sender);
  };

  return (
      <div
          className={`border-2 border-dashed rounded-lg p-4 min-h-32 transition-all duration-200 ${
              isDragOver ? colorClasses[color] : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
      >
        <div className="flex items-center gap-2 mb-3">
          <Icon className="w-4 h-4 text-gray-600" />
          <h3 className="font-medium text-gray-900">{title}</h3>
          {senders.length > 0 && (
              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
            {senders.length}
          </span>
          )}
        </div>

        <div className="space-y-2">
          {senders.map((sender) => (
              <div
                  key={sender}
                  className="flex items-center justify-between bg-white p-2 rounded border"
              >
                <span className="text-sm text-gray-700">{sender}</span>
                <button
                    onClick={() => onRemove(sender)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
          ))}
          {senders.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">
                Drag senders here
              </p>
          )}
        </div>
      </div>
  );
};

const SenderCard: React.FC<SenderCardProps> = ({ sender, onDragStart }) => {
  return (
      <div
          draggable
          onDragStart={(e) => onDragStart(e, sender)}
          className="bg-white border border-gray-200 rounded-lg p-3 cursor-move hover:shadow-md transition-shadow"
      >
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-gray-900">{sender}</span>
        </div>
      </div>
  );
};

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ results }) => {
  if (!results) return null;

  return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Analysis Results</h2>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
        <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-auto max-h-96">
          {JSON.stringify(results, null, 2)}
        </pre>
        </div>
      </div>
  );
};

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