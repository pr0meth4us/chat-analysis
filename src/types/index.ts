import { AnalysisResult } from './analysis';

export interface Message {
    sender: string;
    message: string;
    timestamp: string;
    source?: string;
}

export interface FilterConfig {
    group_mappings: Record<string, string[]>;
    unassigned_label: string;
    removed_senders: string[];
}

export interface FilteredData {
    messages: Message[];
    metadata: {
        total_messages_after_filtering: number;
        participants: Record<string, string[]>;
        removed_senders: string[];
    };
    filter_settings: FilterConfig;
}

export interface TaskStatus {
    task_id: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
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
    filteredData: FilteredData | null;
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
    deps?: string[];
}

export const ANALYSIS_MODULES: AnalysisModule[] = [
    { key: 'dataset_overview', name: 'Dataset Overview', description: 'General statistics about your messages', enabled: true, deps: [] },
    { key: 'first_last_messages', name: 'First & Last Messages', description: 'Timeline boundaries of conversations', enabled: true, deps: [] },
    { key: 'temporal_patterns', name: 'Temporal Patterns', description: 'Time-based messaging patterns', enabled: true, deps: [] },
    { key: 'unbroken_streaks', name: 'Unbroken Streaks', description: 'Consecutive messaging periods', enabled: false, deps: [] },
    { key: 'ghost_periods', name: 'Ghost Periods', description: 'Periods of inactivity', enabled: false, deps: [] },
    { key: 'icebreaker_analysis', name: 'Icebreaker Analysis', description: 'Conversation starters', enabled: false, deps: [] },
    { key: 'response_metrics', name: 'Response Metrics', description: 'Response time patterns', enabled: true, deps: [] },
    { key: 'conversation_patterns', name: 'Conversation Patterns', description: 'Communication flow analysis', enabled: true, deps: [] },
    { key: 'rapid_fire_analysis', name: 'Rapid Fire Analysis', description: 'Quick message exchanges', enabled: false, deps: [] },
    { key: 'word_analysis', name: 'Word Analysis', description: 'Word frequency and usage', enabled: true, deps: [] },
    { key: 'emoji_analysis', name: 'Emoji Analysis', description: 'Emoji usage patterns', enabled: true, deps: [] },
    { key: 'question_analysis', name: 'Question Analysis', description: 'Question patterns and types', enabled: false, deps: [] },
    { key: 'link_analysis', name: 'Link Analysis', description: 'Shared links and media', enabled: false, deps: [] },
    { key: 'sentiment_analysis', name: 'Sentiment Analysis', description: 'Emotional tone analysis', enabled: true, deps: [] },
    { key: 'topic_modeling', name: 'Topic Modeling', description: 'Conversation topics', enabled: false, deps: [] },
    { key: 'user_behavior', name: 'User Behavior', description: 'Individual behavior patterns', enabled: true, deps: [] },
    { key: 'argument_analysis', name: 'Argument Analysis', description: 'Conflict detection', enabled: false, deps: [] },
    { key: 'sad_tone_analysis', name: 'Sad Tone Analysis', description: 'Negative emotion detection', enabled: false, deps: [] },
    { key: 'romance_tone_analysis', name: 'Romance Tone Analysis', description: 'Romantic sentiment analysis', enabled: false, deps: [] },
    { key: 'sexual_tone_analysis', name: 'Sexual Tone Analysis', description: 'Adult content detection', enabled: false, deps: [] },
    { key: 'happy_tone_analysis', name: 'Happy Tone Analysis', description: 'Positive emotion detection', enabled: false, deps: [] },
    { key: 'relationship_metrics', name: 'Relationship Metrics', description: 'Relationship health indicators', enabled: true, deps: ['response_metrics'] },
    { key: 'emotion_analysis', name: 'Emotion Analysis', description: 'ML-based emotion detection', enabled: false, deps: [] },
    { key: 'attachment_analysis', name: 'Attachment Analysis', description: 'Analyzes file attachments', enabled: false, deps: [] },
];
