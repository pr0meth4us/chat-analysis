import { AnalysisResult } from './analysis';

export interface Message {
    sender: string;
    message: string;
    timestamp: string;
    source?: string;
}

export interface TaskStatus {
    task_id: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number;
    message?: string;
    result?: AnalysisResult | Message[] | unknown;
    error?: string;
    start_time?: string;
    end_time?: string;
    name?: string;
    stage?: string;
}

export interface AppState {
    processedMessages: Message[];
    filteredMessages: Message[];
    senders: string[];
    tasks: TaskStatus[];
    analysisResult: AnalysisResult | null;
    isLoading: boolean;
    error: string | null;
}

export interface SearchResult {
    matches: Message[];
    match_count: number;
    total_messages_searched: number;
    query: string;
    similarity_cutoff?: number;
}

export interface KeywordCountResult {
    counts: Record<string, number>;
    total_matches: number;
    message_count: number;
}

export interface AnalysisModule {
    key: string;
    name: string;
    description: string;
    enabled: boolean;
}

export const ANALYSIS_MODULES: AnalysisModule[] = [
    { key: 'dataset_overview', name: 'Dataset Overview', description: 'General statistics about your messages', enabled: true },
    { key: 'first_last_messages', name: 'First & Last Messages', description: 'Timeline boundaries of conversations', enabled: true },
    { key: 'temporal_patterns', name: 'Temporal Patterns', description: 'Time-based messaging patterns', enabled: true },
    { key: 'unbroken_streaks', name: 'Unbroken Streaks', description: 'Consecutive messaging periods', enabled: false },
    { key: 'ghost_periods', name: 'Ghost Periods', description: 'Periods of inactivity', enabled: false },
    { key: 'icebreaker_analysis', name: 'Icebreaker Analysis', description: 'Conversation starters', enabled: false },
    { key: 'response_metrics', name: 'Response Metrics', description: 'Response time patterns', enabled: true },
    { key: 'conversation_patterns', name: 'Conversation Patterns', description: 'Communication flow analysis', enabled: true },
    { key: 'rapid_fire_analysis', name: 'Rapid Fire Analysis', description: 'Quick message exchanges', enabled: false },
    { key: 'word_analysis', name: 'Word Analysis', description: 'Word frequency and usage', enabled: true },
    { key: 'emoji_analysis', name: 'Emoji Analysis', description: 'Emoji usage patterns', enabled: true },
    { key: 'question_analysis', name: 'Question Analysis', description: 'Question patterns and types', enabled: false },
    { key: 'link_analysis', name: 'Link Analysis', description: 'Shared links and media', enabled: false },
    { key: 'sentiment_analysis', name: 'Sentiment Analysis', description: 'Emotional tone analysis', enabled: true },
    { key: 'topic_modeling', name: 'Topic Modeling', description: 'Conversation topics', enabled: false },
    { key: 'user_behavior', name: 'User Behavior', description: 'Individual behavior patterns', enabled: true },
    { key: 'argument_analysis', name: 'Argument Analysis', description: 'Conflict detection', enabled: false },
    { key: 'sad_tone_analysis', name: 'Sad Tone Analysis', description: 'Negative emotion detection', enabled: false },
    { key: 'romance_tone_analysis', name: 'Romance Tone Analysis', description: 'Romantic sentiment analysis', enabled: false },
    { key: 'sexual_tone_analysis', name: 'Sexual Tone Analysis', description: 'Adult content detection', enabled: false },
    { key: 'happy_tone_analysis', name: 'Happy Tone Analysis', description: 'Positive emotion detection', enabled: false },
    { key: 'relationship_metrics', name: 'Relationship Metrics', description: 'Relationship health indicators', enabled: false },
    { key: 'emotion_analysis', name: 'Emotion Analysis', description: 'ML-based emotion detection', enabled: false },
];

export interface FilterConfig {
    me: string[];
    remove: string[];
    other_label: string;
}

export interface SearchResult {
    matches: Message[];
    match_count: number;
    total_messages_searched: number;
    query: string;
    similarity_cutoff?: number;
}

export interface KeywordCountResult {
    counts: Record<string, number>;
    total_matches: number;
    message_count: number;
}

export interface AnalysisModule {
    key: string;
    name: string;
    description: string;
    enabled: boolean;
}
