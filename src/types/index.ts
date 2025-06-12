import React from "react";

export interface DateRange {
  total_days: number;
  start_date: string;
  end_date: string;
}

export interface DatasetOverview {
  total_messages: number;
  date_range: DateRange;
}

export interface GhostPeriod {
  duration_hours: number;
  last_sender_before_ghost: string;
  who_broke_silence: string;
  last_message_before_ghost: string;
  first_message_after_ghost: string;
}

export interface UserBehavior {
  total_messages: number;
  avg_message_length: number;
  emoji_usage_rate: number;
  vocabulary_size: number;
  active_days: Record<string, number>;
}

// Analysis Result Types
export interface RelationshipMetrics {
  relationship_intensity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREMELY_HIGH';
  daily_average_messages: number;
  avg_response_time_minutes: number;
  balance_score: number;
  peak_single_day_messages: number;
  most_active_date: string;
  communication_balance: Record<string, number>;
}

export interface ConversationPatterns {
  total_conversations: number;
  avg_conversation_duration_minutes: number;
  avg_conversation_length: number;
  conversation_starters: Record<string, number>;
  conversation_enders: Record<string, number>;
}

export interface GhostAnalysis {
  total_ghost_periods: number;
  longest_ghost_hours: number;
  who_breaks_silence_most: Record<string, number>;
  top_10_ghost_periods: GhostPeriod[];
}

export interface WordAnalysis {
  english_word_count: number;
  khmer_word_count: number;
  top_50_meaningful_words: [string, number][];
}

export interface AnalysisData {
  dataset_overview: DatasetOverview;
  relationship_metrics: RelationshipMetrics;
  conversation_patterns: ConversationPatterns;
  ghost_analysis: GhostAnalysis;
  user_behavior: Record<string, UserBehavior>;
  word_analysis: WordAnalysis;
}

// Chart Data Types
export interface ActivityDataPoint {
  day: string;
  Other: number;
  me: number;
}

export interface BalanceDataPoint {
  name: string;
  value: number;
  color: string;
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo' | 'yellow';
  trend?: number;
}

export interface IntensityBadgeProps {
  intensity: RelationshipMetrics['relationship_intensity'];
}

export interface GhostPeriodCardProps {
  ghost: GhostPeriod;
  index: number;
}

export interface WordCloudCardProps {
  words: [string, number][];
  title: string;
}

export interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export interface ChatAnalysisDashboardProps {
  data: AnalysisData;
}

// Message Type
export interface Message {
  sender: string;
  content: string;
  timestamp?: string;
}

// UploadResponse
export interface UploadResponse {
  message: string;
  unique_senders: string[];
  processed_messages: Message[];
}

// AnalysisResult – rough fallback
export interface AnalysisResult {
  [key: string]: any;
}
export interface AnalysisRequest {
  messages: Message[];
  me: string[];
  remove: string[];
  other_label: string;
}

// Type Definitions
export interface Message {
  sender: string;
  content: string;
  timestamp?: string;
}

export interface UploadResponse {
  message: string;
  unique_senders: string[];
  processed_messages: Message[];
}

export interface AnalysisResult {
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

export interface GhostPeriod {
  duration_hours: number;
  last_sender_before_ghost: string;
  who_broke_silence: string;
  last_message_before_ghost: string;
  first_message_after_ghost: string;
}

export interface UserBehavior {
  total_messages: number;
  avg_message_length: number;
  emoji_usage_rate: number;
  vocabulary_size: number;
  active_days: Record<string, number>;
}

export interface FileUploadProps {
  onFilesUploaded: (files: File[]) => void;
  isUploading: boolean;
}

export interface SenderGroupProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  senders: string[];
  onDrop: (sender: string) => void;
  onRemove: (sender: string) => void;
  color?: 'blue' | 'green' | 'red' | 'gray';
}

export interface SenderCardProps {
  sender: string;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, sender: string) => void;
}

export interface AnalysisResultsProps {
  results: AnalysisResult;
}