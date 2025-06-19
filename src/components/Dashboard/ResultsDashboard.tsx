'use client';

import React from 'react';
import { DatasetOverviewCard } from './DatasetOverviewCard';
import { TemporalPatternsCard } from './TemporalPatternsCard';
import { WordAnalysisCard } from './WordAnalysisCard';
import { EmojiAnalysisCard } from './EmojiAnalysisCard';
import { SentimentAnalysisCard } from './SentimentAnalysisCard';
import { UnbrokenStreaksCard } from './UnbrokenStreaksCard';
import { EngagementHighlightsCard } from './EngagementHighlightsCard';
import { RelationshipMetricsCard } from './RelationshipMetricsCard';
import { UserComparisonCard } from './UserComparisonCard';
import { GhostPeriodsCard } from './GhostPeriodsCard';
import { ArgumentAnalysisCard } from './ArgumentAnalysisCard';
import { ToneAnalysisCard } from './ToneAnalysisCard';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

export function ResultsDashboard({ result }: { result: any }) {
    if (!result) {
        return <p>No analysis result available.</p>;
    }

    const availableModules = Object.keys(result);

    return (
        <div className="space-y-6">
            {availableModules.includes('dataset_overview') &&
                <DatasetOverviewCard overview={result.dataset_overview} />}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {(availableModules.includes('rapid_fire_analysis') && availableModules.includes('conversation_patterns')) &&
                    <EngagementHighlightsCard analysis={result} />
                }
                {availableModules.includes('unbroken_streaks') &&
                    <UnbrokenStreaksCard analysis={result} />}
            </div>

            {availableModules.includes('temporal_patterns') &&
                <TemporalPatternsCard patterns={result.temporal_patterns} />}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {availableModules.includes('word_analysis') &&
                    <WordAnalysisCard analysis={result} />}
                {availableModules.includes('emoji_analysis') &&
                    <EmojiAnalysisCard analysis={result} />}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {availableModules.includes('relationship_metrics') &&
                    <RelationshipMetricsCard analysis={result} />}
                {availableModules.includes('user_behavior') &&
                    <UserComparisonCard analysis={result} />}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {availableModules.includes('ghost_periods') &&
                    <GhostPeriodsCard analysis={result} />}
                {availableModules.includes('argument_analysis') &&
                    <ArgumentAnalysisCard analysis={result} />}
                {(availableModules.includes('sad_tone_analysis') &&
                        availableModules.includes('romance_tone_analysis') &&
                        availableModules.includes('sexual_tone_analysis')) &&
                    <ToneAnalysisCard analysis={result} />}
            </div>

            {availableModules.includes('sentiment_analysis') &&
                <SentimentAnalysisCard analysis={result} />}

            <Card className="glass">
                <CardHeader>
                    <CardTitle>Full JSON Report</CardTitle>
                </CardHeader>
                <CardContent>
                    <pre className="text-xs p-4 bg-muted rounded-lg max-h-[500px] overflow-auto">
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </CardContent>
            </Card>
        </div>
    );
}