import { Message } from './index';

export interface ContextualMessage {
    datetime: string;
    sender: string;
    message: string;
}

export interface Question {
    question_text: string;
    datetime: string;
}

export interface Streak {
    length_days: number;
    start_date: string;
    end_date: string;
    first_message: ContextualMessage;
    last_message: ContextualMessage;
    first_message_after_break?: ContextualMessage & { days_gap: number };
}

export interface DatasetOverview {
    total_messages: number;
    total_reactions: number;
    date_range: {
        start_date: string;
        end_date: string;
        total_days: number;
    };
    participants: {
        count: number;
        names: string[];
    };
    chat_platforms_distribution: Record<string, number>;
    analysis_timestamp: string;
    daily_average_messages: number;
}

export interface FirstLastMessages {
    first_message: ContextualMessage;
    last_message: ContextualMessage;
}

export interface TemporalPatterns {
    hourly_distribution: Record<string, number>;
    daily_distribution: Record<string, number>;
    daily_distribution_by_date: Record<string, number>;
    monthly_trend: Record<string, number>;
    peak_hour: number | null;
    quietest_hour: number | null;
    most_active_day: string | null;
    least_active_day: string | null;
    night_owl_percentage: number;
    early_bird_percentage: number;
    weekend_activity_percentage: number;
}

export interface UnbrokenStreaks {
    top_streaks: Streak[];
    total_active_days: number;
}

export interface GhostPeriod {
    start_time: string;
    end_time: string;
    duration_hours: number;
    last_sender_before_ghost: string;
    last_message_before_ghost: string;
    who_broke_silence: string;
    first_message_after_ghost: string;
}

export interface GhostPeriodsAnalysis {
    total_ghost_periods: number;
    longest_ghost_period_hours: number;
    average_ghost_duration_hours: number;
    who_breaks_silence_most: { user: string; count: number }[];
    top_ghost_periods: GhostPeriod[];
}

export interface ResponseMetrics {
    [user: string]: {
        [target: string]: {
            avg_response_minutes: number;
            median_response_minutes: number;
            p90_response_minutes: number;
            fastest_response_minutes: number;
            slowest_response_minutes: number;
            response_count: number;
            response_time_std_dev: number;
        };
    };
}

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
    sample_messages: Message[];
}

export interface ConversationPatterns {
    total_conversations: number;
    population_average_response_seconds: number;
    conversation_starter_counts: { user: string; count: number }[];
    longest_conversations_by_duration: Conversation[];
    longest_conversations_by_messages: Conversation[];
    most_intense_conversations: Conversation[];
}

export interface WordAnalysis {
    overall_word_counts: {
        total_words: number;
        unique_words: number;
        total_meaningful_words: number;
        unique_meaningful_words: number;
    };
    top_50_meaningful_words: { word: string; count: number }[];
    top_20_bigrams: { phrase: string; count: number }[];
    top_20_trigrams: { phrase: string; count: number }[];
    user_word_analysis: {
        [user: string]: {
            total_words: number;
            unique_words: number;
            vocabulary_richness: number;
            top_20_words: { word: string; count: number }[];
            avg_word_length: number;
        };
    };
}

export interface EmojiAnalysis {
    total_emojis_used: number;
    unique_emojis_overall: number;
    messages_with_emojis_percent: number;
    top_20_emojis_overall: { emoji: string; count: number }[];
    user_emoji_analysis: {
        [user: string]: {
            total_emojis_sent: number;
            unique_emojis_used: number;
            top_10_emojis: { emoji: string; count: number }[];
        };
    };
}

export interface QuestionAnalysis {
    total_questions_asked: number;
    user_question_analysis: {
        [user: string]: {
            total_questions: number;
            latest_5_questions: Question[];
        };
    };
}

export interface LinkAnalysis {
    total_urls_shared: number;
    unique_domains_shared: number;
    top_10_shared_domains: { domain: string; count: number }[];
    links_per_user: { user: string; count: number }[];
}

export interface SentimentAnalysis {
    overall_average_sentiment: number;
    sentiment_timeline: Record<string, number>;
    user_average_sentiment: {
        [user: string]: {
            mean: number;
            std_dev: number;
        };
    };
    positive_message_count: number;
    negative_message_count: number;
    neutral_message_count: number;
}

export interface TopicModeling {
    discovered_topics: {
        topic_id: number;
        top_words: string[];
        message_percentage: number;
    }[];
    error?: string;
}

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
        hourly_distribution: Record<string, number>;
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
    };
}

export interface ToneAnalysis {
    total_matching_messages: number;
    top_senders: { user: string; count: number }[];
    top_messages: ContextualMessage[];
    most_used_words: { word: string; count: number }[];
    user_stats: {
        [user: string]: {
            count: number;
            top_words_used: [string, number][];
        };
    };
    argument_intensity_percent?: number;
    sadness_intensity_percent?: number;
    romance_intensity_percent?: number;
    sexual_content_intensity_percent?: number;
    happy_content_intensity_percent?: number;
}

export interface RelationshipMetrics {
    relationship_score: number;
    relationship_intensity: "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW" | string;
    score_components: {
        balance_score: number;
        consistency_score: number;
        responsiveness_score: number;
        engagement_score: number;
    };
    underlying_metrics: {
        communication_balance_percent: Record<string, number>;
        daily_average_messages: number;
        overall_median_response_time_minutes: number;
    };
}

export interface EmotionAnalysis {
    summary: {
        overall_average_scores: Record<string, number>;
        user_dominant_emotions: {
            [user: string]: {
                dominant_emotion: string;
                average_scores: Record<string, number>;
            };
        };
    };
    top_messages_per_emotion: {
        [emotion: string]: (ContextualMessage & { score: number })[];
    };
    note: string;
    error?: string;
}

export interface InfoSharingStats {
    total_messages: number;
    info_sharing_messages: number;
    personal_messages: number;
    info_sharing_percentage: number;
    info_sharing_by_category: Record<string, number>;
    confidence_threshold_used: number;
}

export interface AnalysisResult {
    dataset_overview?: DatasetOverview;
    first_last_messages?: FirstLastMessages;
    temporal_patterns?: TemporalPatterns;
    unbroken_streaks?: UnbrokenStreaks;
    ghost_periods?: GhostPeriodsAnalysis;
    icebreaker_analysis?: {
        conversation_starter_counts: { user: string; count: number }[];
        first_ever_icebreaker: ContextualMessage;
    };
    response_metrics?: ResponseMetrics | { message: string };
    conversation_patterns?: ConversationPatterns;
    word_analysis?: WordAnalysis;
    emoji_analysis?: EmojiAnalysis;
    question_analysis?: QuestionAnalysis;
    link_analysis?: LinkAnalysis;
    sentiment_analysis?: SentimentAnalysis;
    topic_modeling?: TopicModeling | { error: string };
    user_behavior?: Record<string, UserBehavior>;
    argument_analysis?: ToneAnalysis;
    sad_tone_analysis?: ToneAnalysis;
    romance_tone_analysis?: ToneAnalysis;
    sexual_tone_analysis?: ToneAnalysis;
    happy_tone_analysis?: ToneAnalysis;
    relationship_metrics?: RelationshipMetrics;
    emotion_analysis?: EmotionAnalysis;
    rapid_fire_analysis?: any;
    reaction_analysis?: any;
    attachment_analysis?: any;
    info_sharing_stats?: InfoSharingStats;
    metadata?: Record<string, any>;
    filter_settings?: Record<string, any>;
}
