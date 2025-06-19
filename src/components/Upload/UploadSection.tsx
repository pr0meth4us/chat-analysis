'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from '@/utils/constants';

export default function UploadSection() {
    const { actions, state } = useAppContext();

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            await actions.uploadFile(file);
        }
    }, [actions]);

    const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
        onDrop,
        accept: ACCEPTED_FILE_TYPES,
        maxSize: MAX_FILE_SIZE,
        multiple: false,
    });

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Upload Your Data</h2>
                <p className="text-muted-foreground">
                    Upload HTML, JSON, or ZIP files containing your message data
                </p>
            </div>

            <motion.div
                {...getRootProps()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                    isDragActive
                        ? 'border-primary bg-primary/5'
                        : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/5'
                }`}
            >
                <input {...getInputProps()} />

                <div className="flex flex-col items-center space-y-4">
                    <div className={`p-4 rounded-full transition-colors ${
                        isDragActive ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                        <Upload className={`h-8 w-8 ${
                            isDragActive ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                    </div>

                    <div>
                        <p className="text-lg font-medium">
                            {isDragActive ? 'Drop your file here' : 'Drag & drop your file here'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            or click to browse files
                        </p>
                    </div>

                    <Button variant="outline" size="sm" disabled={state.isLoading}>
                        {state.isLoading ? 'Processing...' : 'Choose File'}
                    </Button>
                </div>
            </motion.div>

            {/* File Type Info */}
            <Card className="p-4">
                <div className="flex items-start space-x-3">
                    <FileText className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                        <h3 className="font-medium mb-2">Supported File Types</h3>
                        <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• <strong>JSON</strong> - Structured message data</li>
                            <li>• <strong>HTML</strong> - Exported chat files</li>
                            <li>• <strong>ZIP</strong> - Compressed archives containing multiple files</li>
                        </ul>
                        <p className="text-xs text-muted-foreground mt-2">
                            Maximum file size: 100MB
                        </p>
                    </div>
                </div>
            </Card>

            {/* Upload Errors */}
            {fileRejections.length > 0 && (
                <Card className="p-4 border-destructive">
                    <div className="flex items-start space-x-3">
                        <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                        <div>
                            <h3 className="font-medium text-destructive mb-2">Upload Error</h3>
                            {fileRejections.map(({ file, errors }) => (
                                <div key={file.name} className="text-sm">
                                    <p className="font-medium">{file.name}</p>
                                    <ul className="text-destructive/80 mt-1">
                                        {errors.map(error => (
                                            <li key={error.code}>• {error.message}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            )}

            {/* App Error */}
            {state.error && (
                <Card className="p-4 border-destructive">
                    <div className="flex items-start space-x-3">
                        <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                        <div>
                            <h3 className="font-medium text-destructive mb-1">Error</h3>
                            <p className="text-sm text-destructive/80">{state.error}</p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Clear Session */}
            {(state.processedMessages.length > 0 || state.tasks.length > 0) && (
                <div className="flex justify-center">
                    <Button
                        variant="outline"
                        onClick={actions.clearSession}
                        disabled={state.isLoading}
                    >
                        Clear Session
                    </Button>
                </div>
            )}
        </div>
    );
}