import axios, { AxiosError } from 'axios';
import {
  AnalysisRequest,
  FilterRequest,
  Task,
  Message
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

/**
 * A helper function to handle API errors consistently.
 */
const handleError = (error: unknown, defaultMessage: string): Error => {
  const err = error as AxiosError<{ error?: string }>;
  if (err.response && err.response.data?.error) {
    return new Error(err.response.data.error);
  }
  return new Error(defaultMessage);
};

/**
 * A helper function to trigger a browser download for any JSON data.
 */
const triggerJsonDownload = (data: unknown, filename: string) => {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
  )}`;
  const link = document.createElement("a");
  link.href = jsonString;
  link.download = filename;
  link.click();
};

// --- Core Workflow API Calls ---

export const processFiles = async (files: File[]): Promise<Task[]> => {
  try {
    const formData = new FormData();
    // Append all files with the same key 'file'
    files.forEach((file) => formData.append('file', file));

    // The backend now returns an array of tasks
    const response = await api.post<Task[]>('/process', formData);
    return response.data;
  } catch (error) {
    throw handleError(error, 'File processing failed to start.');
  }
};
export const filterMessages = async (data: FilterRequest): Promise<{ message: string }> => {
  try {
    const response = await api.post<{ message: string }>('/filter', data);
    return response.data;
  } catch (error) {
    throw handleError(error, 'Filtering messages failed.');
  }
};

export const analyzeMessages = async (data: AnalysisRequest): Promise<Task> => {
  try {
    const response = await api.post<Task>('/analyze', data);
    return response.data;
  } catch (error) {
    throw handleError(error, 'Analysis failed to start.');
  }
};

// --- Task & Session Management ---

export const getTaskStatus = async (taskId: string): Promise<Task> => {
  try {
    const response = await api.get<Task>(`/tasks/status/${taskId}`);
    return response.data;
  } catch (error) {
    throw handleError(error, 'Failed to get task status.');
  }
};

export const clearSession = async (): Promise<{ message: string }> => {
  try {
    const response = await api.post<{ message: string }>('/session/clear');
    return response.data;
  } catch (error) {
    throw handleError(error, 'Failed to clear session.');
  }
};

// --- New Download API Calls ---

export const downloadProcessedMessages = async (): Promise<void> => {
  try {
    const response = await api.get<Message[]>('/data/processed');
    triggerJsonDownload(response.data, 'processed_messages.json');
  } catch (error) {
    throw handleError(error, 'Failed to download processed messages.');
  }
};

export const downloadFilteredMessages = async (): Promise<void> => {
  try {
    const response = await api.get<Message[]>('/data/filtered');
    triggerJsonDownload(response.data, 'filtered_messages.json');
  } catch (error) {
    throw handleError(error, 'Failed to download filtered messages.');
  }
};

export const downloadAnalysisReport = async (): Promise<void> => {
  try {
    const response = await api.get<any>('/data/report');
    triggerJsonDownload(response.data, 'analysis_report.json');
  } catch (error) {
    throw handleError(error, 'Failed to download analysis report.');
  }
};