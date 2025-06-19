import { FilterConfig, TaskStatus, SearchResult, KeywordCountResult } from '@/types';

const API_BASE = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5001';

class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'ApiError';
    }
}
async function handleFileDownload(response: Response, defaultFilename: string): Promise<void> {
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

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
        return response.json();
    }

    return response.text() as T;
}

export const api = {
    // Upload and Processing
    async uploadFile(file: File): Promise<TaskStatus> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE}/process`, {
            method: 'POST',
            body: formData,
            credentials: 'include', // Send session cookie
        });

        return handleResponse<TaskStatus>(response);
    },

    // Task Management
    async getTaskStatus(taskId: string): Promise<TaskStatus> {
        const response = await fetch(`${API_BASE}/tasks/status/${taskId}`, {
            credentials: 'include', // Send session cookie
        });
        return handleResponse<TaskStatus>(response);
    },

    async getSessionTasks(): Promise<{ session_id: string; tasks: { [taskId: string]: TaskStatus } }> {
        const response = await fetch(`${API_BASE}/tasks/session`, {
            credentials: 'include', // Send session cookie
        });
        return handleResponse<{ session_id: string; tasks: { [taskId: string]: TaskStatus } }>(response);
    },

    async clearSession(): Promise<{ message: string }> {
        const response = await fetch(`${API_BASE}/tasks/session/clear`, {
            method: 'POST',
            credentials: 'include', // Send session cookie
        });
        return handleResponse<{ message: string }>(response);
    },

    // Data Downloads
    async getProcessedMessages(): Promise<any[]> {
        const response = await fetch(`${API_BASE}/data/processed`, {
            credentials: 'include', // Send session cookie
        });
        return handleResponse<any[]>(response);
    },

    async getFilteredMessages(): Promise<any[]> {
        const response = await fetch(`${API_BASE}/data/filtered`, {
            credentials: 'include', // Send session cookie
        });
        return handleResponse<any[]>(response);
    },

    async getAnalysisReport(): Promise<any> {
        const response = await fetch(`${API_BASE}/data/report`, {
            credentials: 'include', // Send session cookie
        });
        return handleResponse<any>(response);
    },

    // Filtering
    async filterMessages(config: FilterConfig): Promise<{ message: string }> {
        const response = await fetch(`${API_BASE}/filter`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(config),
            credentials: 'include', // Send session cookie
        });
        return handleResponse<{ message: string }>(response);
    },

    // Analysis
    async startAnalysis(modulesToRun?: string[]): Promise<TaskStatus> {
        const response = await fetch(`${API_BASE}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ modules_to_run: modulesToRun }),
            credentials: 'include', // Send session cookie
        });
        return handleResponse<TaskStatus>(response);
    },

    // Search
    async countKeyword(keyword: string): Promise<KeywordCountResult> {
        const response = await fetch(`${API_BASE}/search/count_keyword`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ keyword }),
            credentials: 'include', // Send session cookie
        });
        return handleResponse<KeywordCountResult>(response);
    },

    async fuzzySearch(query: string, cutoff: number = 75): Promise<SearchResult> {
        const response = await fetch(`${API_BASE}/search/fuzzy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query, cutoff }),
            credentials: 'include', // Send session cookie
        });
        return handleResponse<SearchResult>(response);
    },
    async downloadProcessedFile(): Promise<void> {
        const response = await fetch(`${API_BASE}/data/processed`, {
            credentials: 'include',
        });
        await handleFileDownload(response, 'processed_messages.json');
    },

    // NEW: Download Filtered Messages
    async downloadFilteredFile(): Promise<void> {
        const response = await fetch(`${API_BASE}/data/filtered`, {
            credentials: 'include',
        });
        await handleFileDownload(response, 'filtered_messages.json');
    },
};