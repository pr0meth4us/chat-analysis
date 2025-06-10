// src/api/upload.ts

import { UploadResponse } from "@/types";

export const uploadChatFiles = async (files: File[]): Promise<UploadResponse> => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const response = await fetch("http://localhost:5328/api/upload", {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown upload error" }));
    throw new Error(error.error || `Upload failed with status ${response.status}`);
  }

  const data = await response.json();
  return data;
};

export const runChatAnalysis = async (
    requestData: object
): Promise<any> => {
  const response = await fetch("http://localhost:5328/api/filter_and_analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown analysis error" }));
    throw new Error(error.error || `Analysis failed with status ${response.status}`);
  }

  const result = await response.json();
  return result;
};