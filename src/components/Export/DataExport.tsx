'use client';

import React, { useState, useTransition } from 'react';
import { Download } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/custom/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/custom/Card';
import { Label } from '@/components/ui/radix/Label';
import { Progress } from '@/components/ui/custom/Progress';
import { api } from '@/utils/api';


export default function DataExport() {
    const { state } = useAppContext();
    const [isPending, startTransition] = useTransition();
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const downloadFile = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const downloadDataAsJson = (data: any, baseFilename: string) => {
        if (!data) return;
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        downloadFile(blob, `${baseFilename}.json`);
    };

    const handleDownloadHtml = () => {
        // MODIFIED: Get the message list from the correct state object.
        const messages = state.filteredData?.messages || [];
        if (messages.length === 0) return;
        setError(null);
        setProgress(0);
        startTransition(async () => {
            try {
                // The API call correctly receives the message list.
                const htmlBlob = await api.downloadChatAsHtml(messages, (p) => setProgress(p));
                downloadFile(htmlBlob, `filtered_messages.html`);
            } catch (err: unknown) {
                setError('Failed to render HTML. Please try again.');
                console.error(err);
            }
        });
    };

    const handleDownloadJson = () => {
        // MODIFIED: Pass the entire filteredData object to the download function.
        // This ensures the downloaded JSON includes the messages, metadata, and settings.
        downloadDataAsJson(state.filteredData, 'filtered_messages');
    };

    const DownloadRow = ({ title, description, buttonLabel, onDownload, disabled }: {
        title: string;
        description?: string;
        buttonLabel: string;
        onDownload: () => void;
        disabled: boolean;
    }) => (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-border/50 pt-4 first:border-t-0 first:pt-0">
            <div className="flex-1">
                <h4 className="font-semibold text-foreground">{title}</h4>
                {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                )}
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
                <Button
                    variant="outline"
                    icon={Download}
                    onClick={onDownload}
                    disabled={disabled || isPending}
                    className="flex-shrink-0 w-full sm:w-auto"
                >
                    {buttonLabel}
                </Button>
            </div>
        </div>
    );

    // This derived state is correct, but was not being used everywhere.
    const filteredMessages = state.filteredData?.messages || [];

    return (
        <Card className="glass p-6 mt-6">
            <CardHeader className="p-0 mb-4">
                <div className="flex justify-between items-center">
                    <CardTitle>Data Export</CardTitle>
                    {/* This UI part is correct. */}
                    {filteredMessages.length > 0 && (
                        <div className="text-sm font-semibold text-primary">
                            Total Messages: {filteredMessages.length.toLocaleString()}
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="space-y-4">
                    <DownloadRow
                        title="Processed Messages"
                        buttonLabel="Download JSON"
                        onDownload={() => downloadDataAsJson(state.processedMessages, 'processed_messages')}
                        disabled={state.processedMessages.length === 0}
                    />

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-border/50 pt-4">
                        <div className="flex-1">
                            <h4 className="font-semibold text-foreground">
                                Filtered Messages
                            </h4>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Button
                                variant="outline"
                                icon={Download}
                                onClick={handleDownloadHtml}
                                disabled={filteredMessages.length === 0 || isPending}
                                className="flex-shrink-0 w-full sm:w-auto"
                            >
                                Download HTML
                            </Button>
                            <Button
                                variant="outline"
                                icon={Download}
                                onClick={handleDownloadJson}
                                // This check is also correct now.
                                disabled={!state.filteredData || isPending}
                                className="flex-shrink-0 w-full sm:w-auto"
                            >
                                Download JSON
                            </Button>
                        </div>
                    </div>

                    <DownloadRow
                        title="Full Analysis Report"
                        buttonLabel="Download JSON"
                        onDownload={() => downloadDataAsJson(state.analysisResult, 'analysis_report')}
                        disabled={!state.analysisResult}
                    />
                </div>

                {isPending && (
                    <div className="mt-4">
                        <Label>Rendering HTML...</Label>
                        <Progress value={progress} className="w-full mt-2" />
                    </div>
                )}

                {error && <p className="text-destructive mt-4">{error}</p>}
            </CardContent>
        </Card>
    );
}