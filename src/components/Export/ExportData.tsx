'use client';

import React, { useState, useTransition } from 'react';
import { Download } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/custom/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/custom/Card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/custom/RadioGroup';
import { Label } from '@/components/ui/radix/Label';
import { Progress } from '@/components/ui/custom/Progress';
import { api } from '@/utils/api';

type DownloadFormat = 'json' | 'html';

export default function DataExport() {
    const { state } = useAppContext();
    const [isPending, startTransition] = useTransition();
    const [filteredDownloadFormat, setFilteredDownloadFormat] = useState<DownloadFormat>('html');
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

    // Generic function to download any data as a JSON file
    const downloadDataAsJson = (data: any, baseFilename: string) => {
        if (!data) return;
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        downloadFile(blob, `${baseFilename}.json`);
    };

    // Specific handler for filtered messages which supports multiple formats
    const handleFilteredChatDownload = () => {
        const data = state.filteredMessages;
        if (!data || data.length === 0) return;

        setError(null);
        setProgress(0);

        if (filteredDownloadFormat === 'json') {
            downloadDataAsJson(data, 'filtered_messages');
        } else {
            startTransition(async () => {
                try {
                    const htmlBlob = await api.downloadChatAsHtml(data, (p) => setProgress(p));
                    downloadFile(htmlBlob, `filtered_messages.html`);
                } catch (err: unknown) {
                    setError('Failed to render HTML. Please try again.');
                    console.error(err);
                }
            });
        }
    };

    const DownloadRow = ({ title, description, buttonLabel, onDownload, disabled, isPending, children }: {
        title: string;
        description?: string; // description is optional
        buttonLabel: string;
        onDownload: () => void;
        disabled: boolean;
        isPending: boolean; // 1. Add isPending to the props
        children?: React.ReactNode;
    }) => (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-border/50 pt-4 first:border-t-0 first:pt-0">
            <div className="flex-1">
                <h4 className="font-semibold text-foreground">{title}</h4>

                {/* 2. Conditionally render the entire <p> tag only if description exists */}
                {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                )}

            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
                {children}
                <Button
                    variant="outline"
                    icon={Download}
                    onClick={onDownload}
                    // Now `isPending` is correctly accessed from props
                    disabled={disabled || isPending}
                    className="flex-shrink-0 w-full sm:w-auto"
                >
                    {buttonLabel}
                </Button>
            </div>
        </div>
    );
    return (
        <Card className="glass p-6 mt-6">
            <CardHeader className="p-0 mb-4">
                <CardTitle>Data Export</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="space-y-4">
                    <DownloadRow
                        title="Processed Messages"
                        buttonLabel="Download JSON"
                        onDownload={() => downloadDataAsJson(state.processedMessages, 'processed_messages')}
                        disabled={state.processedMessages.length === 0}
                        isPending={isPending}
                    />

                    <DownloadRow
                        title="Filtered Messages"
                        description="The data after applying your sender filters. Available as JSON or styled HTML."
                        buttonLabel="Download"
                        onDownload={handleFilteredChatDownload}
                        disabled={state.filteredMessages.length === 0}
                        isPending={isPending}
                    >
                        <RadioGroup
                            defaultValue="html"
                            onValueChange={(value: DownloadFormat) => setFilteredDownloadFormat(value)}
                            className="flex items-center space-x-4"
                            disabled={isPending}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="html" id="html-format" />
                                <Label htmlFor="html-format" className="cursor-pointer">HTML</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="json" id="json-format" />
                                <Label htmlFor="json-format" className="cursor-pointer">JSON</Label>
                            </div>
                        </RadioGroup>
                    </DownloadRow>

                    <DownloadRow
                        title="Full Analysis Report"
                        buttonLabel="Download JSON"
                        onDownload={() => downloadDataAsJson(state.analysisResult, 'analysis_report')}
                        disabled={!state.analysisResult}
                        isPending={isPending}
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