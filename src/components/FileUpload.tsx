"use client";

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';

interface FileUploadProps {
    onFileSelected: (file: File | null) => void;
    disabled: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelected, disabled }) => {

    const handleFileDrop = useCallback((acceptedFiles: File[]) => {
        onFileSelected(acceptedFiles.length > 0 ? acceptedFiles[0] : null);
    }, [onFileSelected]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: handleFileDrop,
        multiple: false,
        disabled: disabled,
        accept: {
            'text/html': ['.html', '.htm'],
            'application/zip': ['.zip'],
            'application/json': ['.json'],
            'text/plain': ['.txt'],
        }
    });

    return (
        <div
            {...getRootProps()}
            className={`
        w-full p-8 border-2 border-dashed rounded-xl
        transition-colors duration-300 ease-in-out
        ${disabled ? 'bg-gray-200 cursor-not-allowed' : 'cursor-pointer'}
        ${isDragActive ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 bg-gray-50/50'}
      `}
        >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center text-center">
                <UploadCloud className={`w-12 h-12 mb-4 ${isDragActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                <p className="text-lg font-semibold text-gray-700">
                    {isDragActive ? "Drop the file here!" : "Drag & drop file here, or click to select"}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                    Supports .zip, .html, .json, .txt
                </p>
            </div>
        </div>
    );
};