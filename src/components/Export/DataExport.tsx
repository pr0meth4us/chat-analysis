'use client';

import React, { useState, useTransition, useEffect } from 'react'; // Added useEffect
import { Download } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/custom/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/custom/Card';
import { Label } from '@/components/ui/radix/Label';
import { Progress } from '@/components/ui/custom/Progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/shadcn/select";
import { api } from '@/utils/api';


export default function DataExport() {
    const { state } = useAppContext();
    const [isPending, startTransition] = useTransition();
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [htmlMeUser, setHtmlMeUser] = useState<string>('');
    const groupNames = Object.keys(state.filteredData?.filter_settings?.group_mappings || {});


    useEffect(() => {
        if (groupNames.length > 0) {
            setHtmlMeUser(groupNames[0]);
        } else {
            setHtmlMeUser(''); // Clear if no group mappings
        }
    }, [groupNames]);


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
        const messages = state.filteredData?.messages || [];
        // Ensure htmlMeUser is selected
        if (messages.length === 0 || !htmlMeUser) {
            setError("No messages or 'Me' participant selected for HTML export.");
            return;
        }

        setError(null);
        setProgress(0);
        startTransition(async () => {
            try {
                const htmlBlob = await api.downloadChatAsHtml(messages, htmlMeUser, (p) => setProgress(p));
                downloadFile(htmlBlob, `chat_log_${htmlMeUser.replace(/\s/g, '_')}.html`);
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                setError(`Failed to render HTML: ${errorMessage}`);
                console.error(err);
            }
        });
    };

    const handleDownloadJson = () => {
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

    const filteredMessages = state.filteredData?.messages || [];

    return (
        <Card className="glass p-6 mt-6">
            <CardHeader className="p-0 mb-4">
                <div className="flex justify-between items-center">
                    <CardTitle>Data Export</CardTitle>
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

                    {/* Updated section for HTML export with dynamic group name selection */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-border/50 pt-4">
                        <div className="flex-1">
                            <h4 className="font-semibold text-foreground">
                                Filtered Messages (HTML)
                            </h4>
                            <p className="text-sm text-muted-foreground">Select which assigned group should be styled as "me" (messages on the right).</p>
                            <div className="mt-2">
                                <Label htmlFor="htmlMeUserSelect" className="sr-only">Display as "Me"</Label>
                                <Select
                                    value={htmlMeUser}
                                    onValueChange={setHtmlMeUser}
                                    disabled={groupNames.length === 0 || isPending} // Use groupNames for disabled check
                                >
                                    <SelectTrigger id="htmlMeUserSelect" className="w-[180px]">
                                        <SelectValue placeholder="Select 'Me' Group" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {groupNames.map(groupName => (
                                            <SelectItem key={groupName} value={groupName}>{groupName}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Button
                                variant="outline"
                                icon={Download}
                                onClick={handleDownloadHtml}
                                disabled={filteredMessages.length === 0 || isPending || !htmlMeUser}
                                className="flex-shrink-0 w-full sm:w-auto"
                            >
                                Download HTML
                            </Button>
                        </div>
                    </div>

                    <DownloadRow
                        title="Filtered Messages (JSON)"
                        buttonLabel="Download JSON"
                        onDownload={handleDownloadJson}
                        disabled={!state.filteredData || filteredMessages.length === 0 || isPending}
                    />

                    <DownloadRow
                        title="Full Analysis Report"
                        buttonLabel="Download JSON"
                        onDownload={() => downloadDataAsJson(state.analysisResult, 'analysis_report')}
                        disabled={!state.analysisResult || isPending}
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