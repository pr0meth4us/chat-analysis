import axios, { AxiosError } from 'axios';
import {AnalysisRequest, AnalysisResult, UploadResponse,} from "@/types";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send cookies with requests (similar to fetch's credentials: "include")
});

export const uploadChatFiles = async (files: File[]): Promise<UploadResponse> => {
  try {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    const response = await api.post<UploadResponse>('/api/upload', formData);
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ error?: string }>;
    if (err.response) {
      throw new Error(err.response.data?.error || 'Upload failed');
    }
    throw new Error('Network error during upload');
  }
};

export const runChatAnalysis = async (data: AnalysisRequest): Promise<AnalysisResult> => {
  try {
    const response = await api.post<AnalysisResult>('/api/filter_and_analyze', data);
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ error?: string }>;
    if (err.response) {
      throw new Error(err.response.data?.error || 'Analysis failed');
    }
    throw new Error('Network error during analysis');
  }
};