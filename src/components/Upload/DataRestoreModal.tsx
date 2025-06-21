// src/components/Upload/DataRestoreModal.tsx
'use client';

import React, { useState, ChangeEvent, useRef, FC } from 'react';
import { Modal } from '@/components/ui/custom/Modal';
import { Button } from '@/components/ui/custom/Button';
import { useAppContext } from '@/context/AppContext';
import { UploadCloud, FileJson, FileCheck, FileX } from 'lucide-react';

interface DataRestoreModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// A reusable button component for file uploads to keep the UI clean
const FileUploaderButton: FC<{
    id: string;
    label: string;
    onFileSelect: (file: File) => void;
}> = ({ id, label, onFileSelect }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            onFileSelect(e.target.files[0]);
        }
    };

    return (
        <>
            <input
                type="file"
                id={id}
                ref={inputRef}
                onChange={handleChange}
                accept=".json"
                className="hidden"
            />
            <Button
                variant="outline"
                onClick={() => inputRef.current?.click()}
                className="w-full justify-start"
                icon={FileJson}
            >
                {label}
            </Button>
        </>
    );
};

export const DataRestoreModal: FC<DataRestoreModalProps> = ({ isOpen, onClose }) => {
    const { actions } = useAppContext();
    const [status, setStatus] = useState<{ type: 'info' | 'success' | 'error'; message: string }>({
        type: 'info',
        message: 'Upload a previously downloaded JSON file to restore your session.',
    });

    const handleFileChange = async (file: File, action: (file: File) => Promise<void>, type: string) => {
        setStatus({ type: 'info', message: `Restoring ${type} from ${file.name}...` });
        try {
            await action(file);
            setStatus({ type: 'success', message: `${type} from ${file.name} restored successfully!` });
        } catch (error: any) {
            setStatus({ type: 'error', message: `Error restoring ${file.name}: ${error.message}` });
        }
    };

    const statusIcons = {
        info: <UploadCloud className="h-5 w-5 text-blue-400" />,
        success: <FileCheck className="h-5 w-5 text-green-400" />,
        error: <FileX className="h-5 w-5 text-red-400" />,
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Restore Session from File" size="md">
            <div className="space-y-6">
                <div className={`flex items-start gap-3 p-3 rounded-lg bg-secondary/50`}>
                    <div className="flex-shrink-0 mt-1">{statusIcons[status.type]}</div>
                    <p className="text-sm text-muted-foreground">{status.message}</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <FileUploaderButton
                        id="processed-file"
                        label="Restore Processed Messages"
                        onFileSelect={(file) => handleFileChange(file, actions.insertProcessedMessages, 'Processed Messages')}
                    />
                    <FileUploaderButton
                        id="filtered-file"
                        label="Restore Filtered Messages"
                        onFileSelect={(file) => handleFileChange(file, actions.insertFilteredMessages, 'Filtered Messages')}
                    />
                    <FileUploaderButton
                        id="report-file"
                        label="Restore Analysis Report"
                        onFileSelect={(file) => handleFileChange(file, actions.insertAnalysisReport, 'Analysis Report')}
                    />
                </div>

                <div className="flex justify-end">
                    <Button variant="ghost" onClick={onClose}>Close</Button>
                </div>
            </div>
        </Modal>
    );
};