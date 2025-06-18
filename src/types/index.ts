export interface TaskStatus {
    task_id: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
    result?: any;
    error?: string;
    progress: number;
    stage?: string;
    message?: string;
    created_at?: string;
    started_at?: string;
    completed_at?: string;
}

export interface ProcessedMessage {
    sender: string;
    message: string;
    timestamp: string;
    source?: string;
}

export interface FilterOptions {
    me: string[];
    remove: string[];
    other_label: string;
}

export interface AnalysisReport {
    basic_stats: {
        total_messages: number;
        unique_senders: number;
        date_range: {
            start: string;
            end: string;
        };
    };
    sender_stats: Record<string, any>;
    time_analysis: any;
    word_analysis: any;
    sentiment_analysis?: any;
}

export interface AppState {
    // File processing
    uploadedFile: File | null;
    processTask: TaskStatus | null;
    processedMessages: ProcessedMessage[];

    // Filtering
    filteredMessages: ProcessedMessage[];
    filterOptions: FilterOptions;

    // Analysis
    analysisTask: TaskStatus | null;
    analysisReport: AnalysisReport | null;

    // UI state
    currentStep: 'upload' | 'filter' | 'analyze' | 'results';
    isLoading: boolean;
    error: string | null;
}
