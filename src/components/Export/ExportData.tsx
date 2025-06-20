'use client';

import React, { useState, useTransition } from 'react';
import { Download, FileText, FileJson, Info } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import { Label } from '@/components/ui/Label';
import { Progress } from '@/components/ui/Progress';
import { api } from '@/utils/api';

type DownloadFormat = 'json' | 'html';

export default function DataExport() {
    const { state } = useAppContext();
    const [isPending, startTransition] = useTransition();
    const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>('html');
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    /**
     * Helper function to create a download link and trigger the download.
     * @param blob The data blob to download.
     * @param filename The desired filename for the download.
     */
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

    const handleChatDownload = (data: any[], baseFilename: string) => {
        if (!data || data.length === 0) return;
        setError(null);
        setProgress(0);

        if (downloadFormat === 'json') {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            downloadFile(blob, `${baseFilename}.json`);
        } else {
            startTransition(async () => {
                try {
                    const htmlBlob = await api.downloadChatAsHtml(data, (p) => setProgress(p));
                    downloadFile(htmlBlob, `${baseFilename}.html`);
                } catch (err: any) {
                    setError('Failed to render HTML. Please try again.');
                    console.error(err);
                }
            });
        }
    };

    const downloadAnalysisReport = () => {
        if (state.analysisResult) {
            const blob = new Blob([JSON.stringify(state.analysisResult, null, 2)], {
                type: 'application/json',
            });
            downloadFile(blob, 'analysis-report.json');
        }
    };

    return (
        <Card className="glass p-6 mt-6">
            <CardHeader className="p-0 mb-4">
                <CardTitle>Data Export</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="mb-6">
                    <Label className="font-semibold">Chat Download Format:</Label>
                    <RadioGroup
                        defaultValue="html"
                        onValueChange={(value: DownloadFormat) => setDownloadFormat(value)}
                        className="flex items-center space-x-4 mt-2"
                        disabled={isPending}
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="html" id="html-format" />
                            <Label htmlFor="html-format" className="flex items-center cursor-pointer">
                                <FileText className="mr-2 h-4 w-4" /> HTML
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="json" id="json-format" />
                            <Label htmlFor="json-format" className="flex items-center cursor-pointer">
                                <FileJson className="mr-2 h-4 w-4" /> JSON
                            </Label>
                        </div>
                    </RadioGroup>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                        variant="outline"
                        icon={Download}
                        onClick={() => handleChatDownload(state.processedMessages, 'processed_messages')}
                        disabled={state.processedMessages.length === 0 || isPending}
                    >
                        Download Processed Data
                    </Button>
                    <Button
                        variant="outline"
                        icon={Download}
                        onClick={() => handleChatDownload(state.filteredMessages, 'filtered_messages')}
                        disabled={state.filteredMessages.length === 0 || isPending}
                    >
                        Download Filtered Data
                    </Button>
                    <div className="flex flex-col">
                        <Button
                            variant="outline"
                            icon={Download}
                            onClick={downloadAnalysisReport}
                            disabled={!state.analysisResult || isPending}
                        >
                            Download Report
                        </Button>
                         <p className="text-xs text-muted-foreground mt-2 text-center flex items-center justify-center">
                            <Info className="h-3 w-3 mr-1"/> Report available as JSON only.
                        </p>
                    </div>
                </div>

                {isPending && (
                    <div className="mt-4">
                        <Label>Rendering HTML...</Label>
                        <Progress value={progress} className="w-full mt-2" />
                    </div>
                )}

                {error && <p className="text-red-500 mt-4">{error}</p>}
            </CardContent>
        </Card>
    );
}
