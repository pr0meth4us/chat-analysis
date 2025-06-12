import React, { useCallback, useState } from "react";
import { FileUploadProps } from "@/types";
import { FileText, Loader2, Upload } from "lucide-react";

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesUploaded, isUploading }) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        onFilesUploaded(files);
    }, [onFilesUploaded]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        onFilesUploaded(files);
    }, [onFilesUploaded]);

    return (
        <div className="w-full">
            <div
                className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 ${
                    isDragOver
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                } ${isUploading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 rounded-xl z-10">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                        <span className="ml-3 text-lg font-medium text-blue-600">Uploading...</span>
                    </div>
                )}

                <Upload className="w-16 h-16 mx-auto mb-5 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Drag & Drop Your Chat Files</h3>
                <p className="text-gray-600 mb-6">
                    Supports `.txt` chat logs or `.zip` archives.
                </p>

                <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isUploading}
                    aria-label="Upload chat files"
                />

                <button
                    type="button"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isUploading}
                    onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()} // Trigger input click
                >
                    <FileText className="w-5 h-5 mr-3" />
                    Browse Files
                </button>
            </div>
        </div>
    );
};