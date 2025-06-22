import { FilterConfig, TaskStatus, SearchResult, KeywordCountResult, Message } from '@/types';
import { AnalysisResult } from '@/types/analysis';

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
        return response.json() as Promise<T>;
    }
    return response.text() as unknown as Promise<T>;
}

export const api = {
    async uploadFiles(files: File[]): Promise<TaskStatus> {
        const formData = new FormData();

        if (!files || files.length === 0) {
            throw new Error("No files selected to upload.");
        }

        files.forEach(file => {
            formData.append('file', file);
        });

        const response = await fetch(`${API_BASE}/process`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
        });
        return handleResponse<TaskStatus>(response);
    },

    async getTaskStatus(taskId: string): Promise<TaskStatus> {
        const response = await fetch(`${API_BASE}/tasks/status/${taskId}`, {
            credentials: 'include',
        });
        return handleResponse<TaskStatus>(response);
    },

    async getSessionTasks(): Promise<{ session_id: string; tasks: { [taskId: string]: TaskStatus } }> {
        const response = await fetch(`${API_BASE}/tasks/session`, {
            credentials: 'include',
        });
        return handleResponse<{ session_id: string; tasks: { [taskId: string]: TaskStatus } }>(response);
    },

    async clearSession(): Promise<{ message: string }> {
        const response = await fetch(`${API_BASE}/tasks/session/clear`, {
            method: 'POST',
            credentials: 'include',
        });
        return handleResponse<{ message: string }>(response);
    },

    async getProcessedMessages(): Promise<Message[]> {
        const response = await fetch(`${API_BASE}/data/processed`, {
            credentials: 'include',
        });
        return handleResponse<Message[]>(response);
    },

    async getFilteredMessages(): Promise<Message[]> {
        const response = await fetch(`${API_BASE}/data/filtered`, {
            credentials: 'include',
        });
        return handleResponse<Message[]>(response);
    },

    async getAnalysisReport(): Promise<AnalysisResult> {
        const response = await fetch(`${API_BASE}/data/report`, {
            credentials: 'include',
        });
        return handleResponse<AnalysisResult>(response);
    },

    async insertProcessedMessages(messages: Message[]): Promise<{ message: string; count: number }> {
        const response = await fetch(`${API_BASE}/data/insert/processed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(messages),
            credentials: 'include',
        });
        return handleResponse<{ message: string; count: number }>(response);
    },

    async insertFilteredMessages(messages: Message[]): Promise<{ message: string; count: number }> {
        const response = await fetch(`${API_BASE}/data/insert/filtered`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(messages),
            credentials: 'include',
        });
        return handleResponse<{ message: string; count: number }>(response);
    },

    async insertAnalysisReport(report: AnalysisResult): Promise<{ message: string }> {
        const response = await fetch(`${API_BASE}/data/insert/report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(report),
            credentials: 'include',
        });
        return handleResponse<{ message: string }>(response);
    },

    async clearProcessedData(): Promise<{ message: string }> {
        const response = await fetch(`${API_BASE}/data/clear/processed`, {
            method: 'POST',
            credentials: 'include',
        });
        return handleResponse<{ message: string }>(response);
    },

    async clearFilteredData(): Promise<{ message: string }> {
        const response = await fetch(`${API_BASE}/data/clear/filtered`, {
            method: 'POST',
            credentials: 'include',
        });
        return handleResponse<{ message: string }>(response);
    },

    async clearAnalysisReport(): Promise<{ message: string }> {
        const response = await fetch(`${API_BASE}/data/clear/report`, {
            method: 'POST',
            credentials: 'include',
        });
        return handleResponse<{ message: string }>(response);
    },

    async filterMessages(config: FilterConfig): Promise<TaskStatus | Message[]> { // <-- Use the new FilterConfig type
        const response = await fetch(`${API_BASE}/filter`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config), // Send the new flexible config object
            credentials: 'include',
        });

        if (response.status === 202) {
            return handleResponse<TaskStatus>(response);
        } else if (response.status === 200) {
            return handleResponse<Message[]>(response);
        } else {
            return handleResponse<TaskStatus>(response);
        }
    },

    async startAnalysis(modulesToRun?: string[]): Promise<TaskStatus> {
        const response = await fetch(`${API_BASE}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ modules_to_run: modulesToRun }),
            credentials: 'include',
        });
        return handleResponse<TaskStatus>(response);
    },

    async countKeyword(keyword: string): Promise<KeywordCountResult> {
        const response = await fetch(`${API_BASE}/search/count_keyword`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyword }),
            credentials: 'include',
        });
        return handleResponse<KeywordCountResult>(response);
    },

    async fuzzySearch(query: string, cutoff: number = 75): Promise<SearchResult> {
        const response = await fetch(`${API_BASE}/search/fuzzy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, cutoff }),
            credentials: 'include',
        });
        return handleResponse<SearchResult>(response);
    },

    async downloadProcessedFile(): Promise<void> {
        const response = await fetch(`${API_BASE}/data/processed`, {
            credentials: 'include',
        });
        await handleFileDownload(response, 'processed_messages.json');
    },

    async downloadFilteredFile(): Promise<void> {
        const response = await fetch(`${API_BASE}/data/filtered`, {
            credentials: 'include',
        });
        await handleFileDownload(response, 'filtered_messages.json');
    },

    async cancelTask(taskId: string): Promise<{ message: string }> {
        const response = await fetch(`${API_BASE}/tasks/cancel/${taskId}`, {
            method: 'POST',
            credentials: 'include',
        });
        return handleResponse<{ message: string }>(response);
    },

    async downloadChatAsHtml(
        messages: Message[],
        onProgress: (progress: number) => void
    ): Promise<Blob> {
        return new Promise((resolve, reject) => {
            let renderedHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Chat Log</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f0f2f5; color: #050505; margin: 0; padding: 20px; display: flex; justify-content: center; }
                .chat-container { width: 100%; max-width: 800px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24); display: flex; flex-direction: column; }
                .chat-header { padding: 16px; background-color: #007aff; color: white; text-align: center; font-size: 1.25rem; font-weight: 600; border-top-left-radius: 8px; border-top-right-radius: 8px; }
                .chat-body { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
                .message { display: flex; flex-direction: column; max-width: 75%; padding: 10px 15px; border-radius: 18px; line-height: 1.4; word-wrap: break-word; }
                .message.me { background-color: #007aff; color: white; align-self: flex-end; border-bottom-right-radius: 4px; }
                .message.other { background-color: #e5e5ea; color: #050505; align-self: flex-start; border-bottom-left-radius: 4px; }
                .sender { font-weight: 600; margin-bottom: 4px; font-size: 0.8rem; opacity: 0.8; }
                .meta-info { display: flex; justify-content: space-between; align-items: center; font-size: 0.7rem; color: #8e8e93; margin-top: 5px; }
                .message.me .meta-info { color: #f0f0f0; opacity: 0.9; }
                .source { font-style: italic; }
            </style>
        </head>
        <body>
            <div class="chat-container">
                <div class="chat-header">Chat Log</div>
                <div class="chat-body">
      `;
            const totalMessages = messages.length;
            if (totalMessages === 0) {
                renderedHtml += '</div></div></body></html>';
                resolve(new Blob([renderedHtml], { type: 'text/html' }));
                return;
            }
            let processedCount = 0;
            const processBatch = () => {
                const batchSize = 50;
                const batchEnd = Math.min(processedCount + batchSize, totalMessages);
                for (let i = processedCount; i < batchEnd; i++) {
                    const msg = messages[i];
                    const senderClass = msg.sender === 'me' ? 'me' : 'other';
                    const senderName = msg.sender === 'me' ? 'Me' : msg.sender || 'Other';
                    const sanitizedMessage = msg.message
                        ? String(msg.message).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;")
                        : '';
                    const sourceText = msg.source || 'Unknown';
                    renderedHtml += `
            <div class="message ${senderClass}">
              <div class="sender">${senderName}</div>
              <div>${sanitizedMessage}</div>
              <div class="meta-info">
                <span class="source">${sourceText}</span>
                <span class="timestamp">${new Date(msg.timestamp).toLocaleString()}</span>
              </div>
            </div>
          `;
                }
                processedCount = batchEnd;
                const currentProgress = Math.round((processedCount / totalMessages) * 100);
                onProgress(currentProgress);
                if (processedCount < totalMessages) {
                    setTimeout(processBatch, 20);
                } else {
                    renderedHtml += `
                </div>
            </div>
        </body>
        </html>
        `;
                    resolve(new Blob([renderedHtml], { type: 'text/html' }));
                }
            };
            processBatch();
        });
    },
};
