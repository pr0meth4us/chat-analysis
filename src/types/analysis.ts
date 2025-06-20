// src/types/analysis.ts
import { Message } from './index';
export interface DatasetOverview {
    participants: {
        names: string[];
    };
    total_messages: number;
    chat_platforms_distribution: Record<string, number>;
}

export interface FirstLastMessages {
    first_message: {
        message: string;
        sender: string;
        datetime: string;
    };
    last_message: {
        message: string;
        sender: string;
        datetime: string;
    };
}

export interface TemporalPatterns {
    hourly_distribution: Record<string, number>;
    daily_distribution: Record<string, number>;
    night_owl_percentage: number;
    early_bird_percentage: number;
    weekend_activity_percentage: number;
}

export interface UnbrokenStreaks {
    longest_consecutive_days: number;
    streak_start_date: string;
}

export interface ResponseMetrics {
    [user: string]: {
        me: {
            avg_response_minutes: number;
            median_response_minutes: number;
            p90_response_minutes: number;
        };
        other: {
            avg_response_minutes: number;
            median_response_minutes: number;
            p90_response_minutes: number;
        };
    };
}

export interface RelationshipMetrics {
    relationship_score: number;
    relationship_intensity: string;
    score_components: Record<string, number>;
}

// Define the overall AnalysisResult type with optional properties
export interface AnalysisResult {
    dataset_overview?: DatasetOverview;
    first_last_messages?: FirstLastMessages;
    temporal_patterns?: TemporalPatterns;
    unbroken_streaks?: UnbrokenStreaks;
    response_metrics?: ResponseMetrics;
    relationship_metrics?: RelationshipMetrics;
    // Add more modules as needed based on ANALYSIS_MODULES
    ghost_periods?: {
        total_ghost_periods: number;
        average_ghost_duration_hours: number;
        who_breaks_silence_most: { user: string; count: number }[];
    };
    icebreaker_analysis?: {
        conversation_starter_counts: { user: string; count: number }[];
    };
    conversation_patterns?: {
        most_intense_conversations: {
            id: string;
            intensity_score: number;
            message_count: number;
            duration_minutes: number;
            start_time: string;
            sample_messages: Message[];
        }[];
    };
    rapid_fire_analysis?: {
        top_10_sessions: {
            start_time: string;
            messages_per_minute: number;
            total_messages: number;
            sample_messages?: Message[];
        }[];
    };
    word_analysis?: {
        user_word_analysis: {
            [user: string]: {
                top_20_words: { word: string; count: number }[];
            };
        };
    };
    emoji_analysis?: {
        user_emoji_analysis: {
            [user: string]: {
                top_10_emojis: { emoji: string; count: number }[];
            };
        };
    };
    question_analysis?: {
        user_question_analysis: {
            [user: string]: {
                total_questions: number;
            };
        };
    };
    link_analysis?: {
        links_per_user: { user: string; count: number }[];
    };
    sentiment_analysis?: {
        sentiment_timeline: Record<string, number>;
    };
    user_behavior?: {
        [user: string]: {
            message_counts: {
                total_messages: number;
            };
        };
    };
    argument_analysis?: {
        user_argument_stats: {
            [user: string]: {
                words_used: [string, number][];
            };
        };
    };
    sad_tone_analysis?: {
        top_messages: { message: string; sender: string }[];
    };
    romance_tone_analysis?: {
        top_messages: { message: string; sender: string }[];
    };
}
