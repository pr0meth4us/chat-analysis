import { TaskStatus, ProcessedMessage, AnalysisReport } from '@/types';

const API_BASE = 'http://127.0.0.1:5001';

export async function uploadFile(file: File): Promise<TaskStatus> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/process`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
}

export async function getTaskStatus(taskId: string): Promise<TaskStatus> {
    const response = await fetch(`${API_BASE}/tasks/status/${taskId}`, {
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error(`Failed to get task status: ${response.statusText}`);
    }

    return response.json();
}

export async function getProcessedMessages(): Promise<ProcessedMessage[]> {
    const response = await fetch(`${API_BASE}/data/processed`, {
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error(`Failed to get processed messages: ${response.statusText}`);
    }

    return response.json();
}

export async function filterMessages(filterOptions: {
    me: string[];
    remove: string[];
    other_label: string;
}): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/filter`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(filterOptions),
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error(`Failed to filter messages: ${response.statusText}`);
    }

    return response.json();
}

export async function getFilteredMessages(): Promise<ProcessedMessage[]> {
    const response = await fetch(`${API_BASE}/data/filtered`, {
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error(`Failed to get filtered messages: ${response.statusText}`);
    }

    return response.json();
}

export async function startAnalysis(modules?: string[]): Promise<TaskStatus> {
    const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modules_to_run: modules }),
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error(`Failed to start analysis: ${response.statusText}`);
    }

    return response.json();
}

export async function getAnalysisReport(): Promise<AnalysisReport> {
    const response = await fetch(`${API_BASE}/data/report`, {
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error(`Failed to get analysis report: ${response.statusText}`);
    }

    return response.json();
}
