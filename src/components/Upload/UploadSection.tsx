'use client';

import React, { useCallback, useState, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, AlertCircle, Trash2, X, Send, CheckCircle, RefreshCw } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/custom/Button';
import { Card } from '@/components/ui/custom/Card';
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from '@/utils/constants';

export default function UploadSection() {
    const { actions, state } = useAppContext();
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const hasProcessedFiles = useMemo(() => state.processedMessages.length > 0, [state.processedMessages]);

    const isUploadTaskActive = useMemo(() => {
        return state.tasks.some(
            (task) => task.name === 'process_file' && (task.status === 'pending' || task.status === 'running')
        );
    }, [state.tasks]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setSelectedFiles(prevFiles => {
            const newFiles = acceptedFiles.filter(
                newFile => !prevFiles.some(prevFile => prevFile.name === newFile.name && prevFile.size === newFile.size)
            );
            return [...prevFiles, ...newFiles];
        });
    }, []);

    const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
        onDrop,
        accept: ACCEPTED_FILE_TYPES,
        maxSize: MAX_FILE_SIZE,
        multiple: true,
        disabled: hasProcessedFiles || isUploadTaskActive,
    });

    const handleRemoveFile = (fileToRemove: File) => {
        setSelectedFiles(prevFiles => prevFiles.filter(file => file !== fileToRemove));
    };

    const handleClearAll = () => {
        setSelectedFiles([]);
    };

    const handleProcessFiles = async () => {
        if (selectedFiles.length === 0) return;
        setIsSubmitting(true);
        try {
            await Promise.all(selectedFiles.map(file => actions.uploadFile(file).catch(error => {
                console.error(`Upload failed for ${file.name}:`, error);
            })));
            setSelectedFiles([]);
        } catch (error) {
            console.error("An error occurred during file processing:", error);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const isLoading = isUploadTaskActive;

    if (hasProcessedFiles) {
        return (
            <div className="space-y-6 text-center">
                 <Card className="p-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="flex flex-col items-center space-y-4">
                        <CheckCircle className="h-12 w-12 text-green-500" />
                        <div>
                            <h3 className="text-xl font-bold text-green-700 dark:text-green-300">
                                Data Uploaded Successfully
                            </h3>
                            <p className="text-muted-foreground mt-2">
                                {state.processedMessages.length.toLocaleString()} messages have been processed.
                            </p>
                        </div>
                        <Button 
                            variant="destructive" 
                            className="mt-4"
                            icon={RefreshCw}
                            onClick={actions.clearProcessed}
                            loading={state.isLoading}
                        >
                            Clear Data & Restart
                        </Button>
                    </div>
                 </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Upload Your Data</h2>
                <p className="text-muted-foreground">
                    Upload HTML, JSON, or ZIP files containing your message data.
                </p>
            </div>

            <div
                {...getRootProps()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                    isDragActive
                        ? 'border-primary bg-primary/5 shadow-inner'
                        : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/5'
                }`}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center space-y-4">
                    <div className="p-4 rounded-full bg-muted transition-colors">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-lg font-medium">
                            {isDragActive ? 'Drop files here' : 'Drag & drop files to upload'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            or click to browse
                        </p>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {selectedFiles.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0, transition: { duration: 0.3 } }}
                    >
                        <Card className="p-4">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-medium">Selected Files ({selectedFiles.length})</h3>
                                <Button variant="ghost" size="sm" onClick={handleClearAll} icon={Trash2}>Clear All</Button>
                            </div>
                            <ul className="space-y-2 max-h-48 overflow-y-auto">
                                {selectedFiles.map((file, index) => (
                                    <li key={`${file.name}-${index}`} className="flex items-center justify-between p-2 rounded-md bg-secondary animate-in fade-in">
                                        <div className="flex items-center space-x-2 overflow-hidden">
                                            <FileText className="h-4 w-4 flex-shrink-0" />
                                            <span className="text-sm truncate">{file.name}</span>
                                            <span className="text-xs text-muted-foreground">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => handleRemoveFile(file)}><X className="h-4 w-4" /></Button>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="text-center pt-4">
                <Button
                    onClick={handleProcessFiles}
                    disabled={selectedFiles.length === 0 || isLoading}
                    loading={isLoading}
                    icon={Send}
                    size="lg"
                >
                    {isLoading ? 'Processing...' : `Process ${selectedFiles.length > 0 ? `${selectedFiles.length} File(s)` : 'Files'}`}
                </Button>
            </div>

            {fileRejections.length > 0 && (
                 <Card className="p-4 border-destructive bg-destructive/10">
                     <div className="flex items-start space-x-3">
                         <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                         <div>
                             <h3 className="font-medium text-destructive mb-2">Files Rejected</h3>
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
            {state.error && (
                <Card className="p-4 border-destructive bg-destructive/10">
                    <div className="flex items-start space-x-3">
                        <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                        <div>
                            <h3 className="font-medium text-destructive mb-1">An Error Occurred</h3>
                            <p className="text-sm text-destructive/80">{state.error}</p>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
