'use client';

import { useCallback } from 'react';
import { Upload, FileText, Loader } from 'lucide-react';
import {useAppContext} from "@/context/AppContext";
import {uploadFile} from "@/utils/api";

export default function FileUpload() {
    const { state, dispatch } = useAppContext();

    const handleFileSelect = useCallback(async (file: File) => {
        if (!file) return;

        dispatch({ type: 'SET_UPLOADED_FILE', payload: file });
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        try {
            const taskStatus = await uploadFile(file);
            dispatch({ type: 'SET_PROCESS_TASK', payload: taskStatus });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Upload failed' });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [dispatch]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    }, [handleFileSelect]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);

    return (
        <div className="card text-gray-900">
            <h2 className="text-2xl font-bold mb-6">Upload Chat History</h2>

            <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                {state.isLoading ? (
                    <div className="flex flex-col items-center">
                        <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                        <p className="text-gray-600">Uploading file...</p>
                    </div>
                ) : (
                    <>
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Drop your chat file here
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Or click to browse files
                        </p>
                        <input
                            type="file"
                            accept=".json,.txt,.zip"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileSelect(file);
                            }}
                            className="hidden"
                            id="file-upload"
                        />
                        <label
                            htmlFor="file-upload"
                            className="btn-primary cursor-pointer inline-block"
                        >
                            Choose File
                        </label>
                    </>
                )}
            </div>

            {state.uploadedFile && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                        <FileText className="w-5 h-5 text-blue-600 mr-2" />
                        <span className="text-blue-800 font-medium">
              {state.uploadedFile.name}
            </span>
                        <span className="text-blue-600 ml-2">
              ({(state.uploadedFile.size / 1024 / 1024).toFixed(1)} MB)
            </span>
                    </div>
                </div>
            )}

            <div className="mt-6 text-sm text-gray-500">
                <p className="mb-2">Supported formats:</p>
                <ul className="list-disc list-inside space-y-1">
                    <li>JSON files (.json)</li>
                    <li>Text files (.txt)</li>
                    <li>ZIP archives (.zip)</li>
                </ul>
            </div>
        </div>
    );
}
