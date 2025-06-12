import axios, { AxiosError } from 'axios';
import {
  UploadResponse,
  FilterRequest,
  FilterResponse,
  AnalysisRequest,
  AnalysisResponse,
  Message
} from "@/types";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const uploadChatFiles = async (files: File[]): Promise<UploadResponse> => {
  try {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    const response = await api.post<UploadResponse>('/upload', formData);
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ error?: string }>;
    if (err.response) {
      throw new Error(err.response.data?.error || 'Upload failed');
    }
    throw new Error('Network error during upload');
  }
};

export const uploadZipFile = async (zipFile: File): Promise<UploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('zipfile', zipFile);
    const response = await api.post<UploadResponse>('/upload-zip', formData);
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ error?: string }>;
    if (err.response) {
      throw new Error(err.response.data?.error || 'ZIP upload failed');
    }
    throw new Error('Network error during ZIP upload');
  }
};

export const filterMessages = async (data: FilterRequest): Promise<FilterResponse> => {
  try {
    const response = await api.post<FilterResponse>('/filter', data);
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ error?: string }>;
    if (err.response) {
      throw new Error(err.response.data?.error || 'Filter failed');
    }
    throw new Error('Network error during filtering');
  }
};

export const analyzeMessages = async (data: AnalysisRequest): Promise<AnalysisResponse> => {
  try {
    const response = await api.post<AnalysisResponse>('/analyze', data);
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ error?: string }>;
    if (err.response) {
      throw new Error(err.response.data?.error || 'Analysis failed');
    }
    throw new Error('Network error during analysis');
  }
};

export const getStoredMessages = async (): Promise<{ session_id: string; messages: Message[] }> => {
  try {
    const response = await api.get<{ session_id: string; messages: Message[] }>('/get_stored_messages');
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ error?: string }>;
    if (err.response) {
      throw new Error(err.response.data?.error || 'Failed to get stored messages');
    }
    throw new Error('Network error getting stored messages');
  }
};

export const clearSession = async (): Promise<{ message: string; session_id: string }> => {
  try {
    const response = await api.post<{ message: string; session_id: string }>('/clear');
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ error?: string }>;
    if (err.response) {
      throw new Error(err.response.data?.error || 'Failed to clear session');
    }
    throw new Error('Network error clearing session');
  }
};

export const countKeyword = async (keyword: string, messages?: Message[]): Promise<{
  keyword: string;
  message_count: number;
  total_matches: number;
  counts: Record<string, number>;
}> => {
  try {
    const response = await api.post('/count_keyword', { keyword, messages });
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ error?: string }>;
    if (err.response) {
      throw new Error(err.response.data?.error || 'Keyword count failed');
    }
    throw new Error('Network error during keyword counting');
  }
};
