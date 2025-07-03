import type {
    FilterConfig,
    TaskStatus,
    SearchResult,
    KeywordCountResult,
    Message,
    FilteredData,
} from '@/types';
import type { AnalysisResult } from '@/types/analysis';

class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'ApiError';
    }
}

async function handleFileDownload(
    response: Response,
    defaultFilename: string
): Promise<void> {
    if (!response.ok) {
        const errorText = await response.text();
        throw new ApiError(response.status, errorText || `HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const errorText = await response.text();
        throw new ApiError(response.status, errorText || `HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        return response.json() as Promise<T>;
    }

    return response.text() as unknown as Promise<T>;
}

export const api = {
    async uploadFiles(files: File[]): Promise<TaskStatus> {
        if (!files || files.length === 0) {
            throw new Error('No files selected to upload.');
        }

        const formData = new FormData();
        files.forEach((file) => formData.append('file', file));

        const response = await fetch('/process', {
            method: 'POST',
            body: formData,
            credentials: 'include',
        });

        return handleResponse<TaskStatus>(response);
    },

    async getTaskStatus(taskId: string): Promise<TaskStatus> {
        const response = await fetch(`/tasks/status/${taskId}`, {
            credentials: 'include',
        });
        return handleResponse<TaskStatus>(response);
    },

    async getSessionTasks(): Promise<{ session_id: string; tasks: Record<string, TaskStatus> }> {
        const response = await fetch('/tasks/session', {
            credentials: 'include',
        });

        return handleResponse<{ session_id: string; tasks: Record<string, TaskStatus> }>(
            response
        );
    },

    async clearSession(): Promise<{ message: string }> {
        const response = await fetch('/tasks/session/clear', {
            method: 'POST',
            credentials: 'include',
        });

        return handleResponse<{ message: string }>(response);
    },

    async getProcessedMessages(): Promise<Message[]> {
        const response = await fetch('/data/processed', {
            credentials: 'include',
        });
        return handleResponse<Message[]>(response);
    },

    async getFilteredMessages(): Promise<FilteredData> {
        const response = await fetch('/data/filtered', {
            credentials: 'include',
        });
        return handleResponse<FilteredData>(response);
    },

    async getAnalysisReport(): Promise<AnalysisResult> {
        const response = await fetch('/data/report', {
            credentials: 'include',
        });
        return handleResponse<AnalysisResult>(response);
    },

    async insertProcessedMessages(
        messages: Message[]
    ): Promise<{ message: string; count: number }> {
        const response = await fetch('/data/insert/processed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(messages),
            credentials: 'include',
        });

        return handleResponse<{ message: string; count: number }>(response);
    },

    async insertFilteredMessages(
        messages: Message[]
    ): Promise<{ message: string; count: number }> {
        const response = await fetch('/data/insert/filtered', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages }),
            credentials: 'include',
        });

        return handleResponse<{ message: string; count: number }>(response);
    },

    async insertAnalysisReport(
        report: AnalysisResult
    ): Promise<{ message: string }> {
        const response = await fetch('/data/insert/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(report),
            credentials: 'include',
        });

        return handleResponse<{ message: string }>(response);
    },

    async clearProcessedData(): Promise<{ message: string }> {
        const response = await fetch('/data/clear/processed', {
            method: 'POST',
            credentials: 'include',
        });

        return handleResponse<{ message: string }>(response);
    },

    async clearFilteredData(): Promise<{ message: string }> {
        const response = await fetch('/data/clear/filtered', {
            method: 'POST',
            credentials: 'include',
        });

        return handleResponse<{ message: string }>(response);
    },

    async clearAnalysisReport(): Promise<{ message: string }> {
        const response = await fetch('/data/clear/report', {
            method: 'POST',
            credentials: 'include',
        });

        return handleResponse<{ message: string }>(response);
    },

    async filterMessages(
        config: FilterConfig
    ): Promise<TaskStatus | { message: string }> {
        const response = await fetch('/filter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config),
            credentials: 'include',
        });

        return handleResponse<TaskStatus | { message: string }>(response);
    },

    async startAnalysis(
        modulesToRun?: string[]
    ): Promise<TaskStatus> {
        const response = await fetch('/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ modules_to_run: modulesToRun }),
            credentials: 'include',
        });

        return handleResponse<TaskStatus>(response);
    },

    async countKeyword(
        keyword: string
    ): Promise<KeywordCountResult> {
        const response = await fetch('/search/count_keyword', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyword }),
            credentials: 'include',
        });

        return handleResponse<KeywordCountResult>(response);
    },

    async fuzzySearch(
        query: string,
        cutoff: number = 75
    ): Promise<SearchResult> {
        const response = await fetch('/search/fuzzy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, cutoff }),
            credentials: 'include',
        });

        return handleResponse<SearchResult>(response);
    },

    async downloadProcessedFile(): Promise<void> {
        const response = await fetch('/data/processed', {
            credentials: 'include',
        });

        await handleFileDownload(response, 'processed_messages.json');
    },

    async downloadFilteredFile(): Promise<void> {
        const response = await fetch('/data/filtered', {
            credentials: 'include',
        });

        await handleFileDownload(response, 'filtered_messages.json');
    },

    async cancelTask(
        taskId: string
    ): Promise<{ message: string }> {
        const response = await fetch(`/tasks/cancel/${taskId}`, {
            method: 'POST',
            credentials: 'include',
        });

        return handleResponse<{ message: string }>(response);
    },
};
