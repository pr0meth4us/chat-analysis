import React, {useCallback, useState} from "react";
import {FileUploadProps} from "@/types";
import {FileText, Loader2, Upload} from "lucide-react";

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
        <div className="w-full max-w-2xl mx-auto">
            <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                    isDragOver
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 rounded-xl">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                )}

                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Chat Files</h3>
                <p className="text-gray-500 mb-4">
                    Drag and drop your chat files here, or click to select
                </p>

                <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isUploading}
                />

                <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    disabled={isUploading}
                >
                    <FileText className="w-4 h-4 mr-2" />
                    Choose Files
                </button>
            </div>
        </div>
    );
};
