'use client';

import React from 'react';
import { Download } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { api } from '@/utils/api';

export default function DataExport() {
    const { state } = useAppContext();

    const downloadReport = () => {
        if (state.analysisResult) {
            const blob = new Blob([JSON.stringify(state.analysisResult, null, 2)], {
                type: 'application/json',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'analysis-report.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    return (
        <Card className="glass p-6 mt-6">
            <CardHeader className="p-0 mb-4">
                <CardTitle>Data Export</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                        variant="outline"
                        icon={Download}
                        onClick={() => api.downloadProcessedFile()}
                        disabled={state.processedMessages.length === 0}
                    >
                        Download Processed Data
                    </Button>
                    <Button
                        variant="outline"
                        icon={Download}
                        onClick={() => api.downloadFilteredFile()}
                        disabled={state.filteredMessages.length === 0}
                    >
                        Download Filtered Data
                    </Button>
                    <Button
                        variant="outline"
                        icon={Download}
                        onClick={downloadReport}
                        disabled={!state.analysisResult}
                    >
                        Download Report
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}