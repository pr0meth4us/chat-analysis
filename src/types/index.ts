import React from 'react';

// ==============================================================================
// 1. CORE API & DATA STRUCTURES
// ==============================================================================

/** A single chat message, matching the backend structure. */
export interface Message {
  sender: string;
  message: string;
  timestamp: string;
  [key: string]: any;
}

/** A single word or phrase with its count, used in charts. */
export interface WordCount {
  word: string;
  count: number;
}
export interface PhraseCount {
  phrase: string;
  count: number;
}

/** The detailed structure for a single conversation session. */
export interface Conversation {
  id: number;
  start_time: string;
  participants: string[];
  message_count: number;
  duration_minutes: number;
  intensity_score: number;
  avg_response_time_seconds: number;
  relative_pace_factor: number;
  turn_taking_ratio: number;
  messages_per_hour: number;
  sample_messages: { sender: string; message: string; datetime: string; }[];
}

/** The structure for a single user's behavioral stats from the backend. */
export interface UserBehavior {
  message_counts: {
    total_messages: number;
    total_posts_inc_reactions: number;
    reactions_given: number;
  };
  message_stats: {
    avg_message_length_chars: number;
    std_message_length_chars: number;
    avg_message_length_words: number;
  };
  activity_patterns: {
    peak_hours_of_day: Record<string, number>;
    active_days_of_week: Record<string, number>;
  };
  content_style: {
    question_asking_rate_percent: number;
    emoji_usage_rate_percent: number;
    link_sharing_rate_percent: number;
  };
  engagement: {
    conversation_initiation_count: number;
    platform_usage: Record<string, number>;
  }
}

/** Represents a background task status from the API. */
export interface Task {
  task_id: string;
  session_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
  progress: number;
  stage: string | null;
  message: string | null;
  error: string | null;
  result: {
    message?: string;
    unique_senders?: string[];
    analysis_report?: AnalysisResult;
  } | null;
}

/** The comprehensive structure of the final analysis report from the backend. */
export interface AnalysisResult {
  dataset_overview?: {
    total_messages: number;
    date_range: {
      total_days: number;
      start_date: string;
      end_date: string;
    },
    participants: {
      count: number;
      names: string[];
    }
  };
  relationship_metrics?: {
    relationship_score: number;
    relationship_intensity: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
    underlying_metrics: {
      overall_median_response_time_minutes: number;
    }
  };
  conversation_patterns?: {
    total_conversations: number;
    longest_conversations_by_messages: Conversation[];
    most_intense_conversations: Conversation[];
  };
  temporal_patterns?: {
    peak_hour?: number;
    hourly_distribution: Record<string, number>;
    daily_distribution: Record<string, number>;
  };
  ghost_periods?: {
    total_ghost_periods: number;
    longest_ghost_period_hours: number;
  };
  unbroken_streaks?: {
    longest_consecutive_days: number;
  };
  word_analysis?: {
    top_50_meaningful_words: WordCount[];
    top_20_bigrams: PhraseCount[];
  };
  user_behavior?: Record<string, UserBehavior>;
  response_metrics?: Record<string, Record<string, { median_response_minutes: number }>>;
  [key: string]: any; // Allow for other modules
}


// ==============================================================================
// 2. API REQUEST TYPES
// ==============================================================================

export interface FilterRequest {
  me: string[];
  remove: string[];
  other_label: string;
}

export interface AnalysisRequest {
  modules_to_run: string[] | null;
}

export interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  selectedFiles: File[];
  disabled: boolean;
}

export interface ChatAnalysisDashboardProps {
  data: AnalysisResult;
}

export interface TaskProgressProps {
    task: Task | null;
}

export interface SenderGroupProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  senders: string[];
  onDrop: (sender: string) => void;
  onRemove: (sender: string) => void;
  color?: 'blue' | 'red';
}