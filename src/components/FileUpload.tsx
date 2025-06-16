"use client";

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File as FileIcon, Loader2 } from 'lucide-react';
import { FileUploadProps } from '@/types'; // Import the correct props type

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelected, isUploading }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileDrop = useCallback((acceptedFiles: File[]) => {
        // The new API handles one file at a time (which can be a .zip)
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            setSelectedFile(file);
            // This now correctly calls the prop from the parent component
            onFileSelected(file);
        }
    }, [onFileSelected]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: handleFileDrop,
        multiple: false, // Ensure only one file is accepted
        accept: {
            'text/html': ['.html', '.htm'],
            'application/zip': ['.zip'],
            'application/json': ['.json'],
            'text/plain': ['.txt'],
        }
    });

    return (
        <div className="w-full">
            <div
                {...getRootProps()}
                className={`
          w-full p-8 border-2 border-dashed rounded-xl cursor-pointer
          transition-colors duration-300 ease-in-out
          ${isDragActive ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 bg-gray-50/50'}
        `}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center text-center">
                    <UploadCloud className={`w-12 h-12 mb-4 ${isDragActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <p className="text-lg font-semibold text-gray-700">
                        {isDragActive ? "Drop the file here!" : "Drag & drop your file here, or click to select"}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                        Supports: Single Chat File or a .ZIP Archive
                    </p>
                </div>
            </div>

            {isUploading && (
                <div className="mt-4 flex items-center justify-center space-x-3 text-lg font-semibold text-indigo-600">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Processing, please wait...</span>
                </div>
            )}

            {!isUploading && selectedFile && (
                <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-lg flex items-center justify-between shadow-sm">
                    <div className="flex items-center space-x-3">
                        <FileIcon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium truncate">{selectedFile.name}</span>
                    </div>
                    <span className="text-sm font-mono text-green-600">
            {(selectedFile.size / 1024).toFixed(2)} KB
          </span>
                </div>
            )}
        </div>
    );
};