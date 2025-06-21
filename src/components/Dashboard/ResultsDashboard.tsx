'use client';

import React, { useState, useMemo, FC } from 'react';
import Link from 'next/link'; // Import Link for navigation
import { ArrowLeft } from 'lucide-react'; // Import a suitable icon
import { AnalysisResult } from '@/types/analysis';
import { Card } from './layout/Card';
import { Button } from '../ui/custom/Button'; // Import your custom Button

// Import Tab Components
import { OverviewTab } from './tabs/OverviewTab';
import { BehaviorContentTab } from './tabs/BehaviorContentTab';
import { ConvosTonesTab } from './tabs/ConvosTonesTab';
import { HeadToHeadTab } from './tabs/HeadToHeadTab';
import { EmotionLandscapeTab } from './tabs/EmotionLandscapeTab';
import { RelationshipDNATab } from './tabs/RelationshipDNATab';
import { formatDate } from '@/utils/formatDate';

interface ResultsDashboardProps {
    result: AnalysisResult;
}

export const ResultsDashboard: FC<ResultsDashboardProps> = ({ result }) => {
    const [activeTab, setActiveTab] = useState('overview');

    // useMemo hook remains unchanged...
    const processedData = useMemo(() => {
        if (!result) return null;

        const [user1Name, user2Name] = result.dataset_overview?.participants.names || ['User 1', 'User 2'];

        // For Relationship DNA Tab
        const responseMetrics = [
            { subject: 'Avg (m)', [user1Name]: result.response_metrics?.[user1Name]?.[user2Name]?.avg_response_minutes || 0, [user2Name]: result.response_metrics?.[user2Name]?.[user1Name]?.avg_response_minutes || 0 },
            { subject: 'Median (m)', [user1Name]: result.response_metrics?.[user1Name]?.[user2Name]?.median_response_minutes || 0, [user2Name]: result.response_metrics?.[user2Name]?.[user1Name]?.median_response_minutes || 0 },
            { subject: 'P90 (m)', [user1Name]: result.response_metrics?.[user1Name]?.[user2Name]?.p90_response_minutes || 0, [user2Name]: result.response_metrics?.[user2Name]?.[user1Name]?.p90_response_minutes || 0 },
            { subject: 'Std Dev (m)', [user1Name]: result.response_metrics?.[user1Name]?.[user2Name]?.response_time_std_dev || 0, [user2Name]: result.response_metrics?.[user2Name]?.[user1Name]?.response_time_std_dev || 0 },
        ];

        const relationshipScores = result.relationship_metrics?.score_components
            ? Object.entries(result.relationship_metrics.score_components).map(([name, value]) => ({
                name: name.replace(/_score/g, '').replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()),
                value: value,
                fill: { balance_score: '#4a90e2', consistency_score: '#50e3c2', responsiveness_score: '#f5a623', engagement_score: '#d0021b' }[name] || '#8884d8'
            }))
            : [];

        // For Behavior & Content Tab
        const sentimentDistribution = [
            { name: 'Positive', value: result.sentiment_analysis?.positive_message_count || 0 },
            { name: 'Neutral', value: result.sentiment_analysis?.neutral_message_count || 0 },
            { name: 'Negative', value: result.sentiment_analysis?.negative_message_count || 0 },
        ].filter(d => d.value > 0);

        const monthlyData = result.temporal_patterns?.monthly_trend
            ? Object.entries(result.temporal_patterns.monthly_trend).map(([month, count]) => ({ month, messages: count }))
            : [];

        const sentimentTimelineData = result.sentiment_analysis?.sentiment_timeline
            ? Object.entries(result.sentiment_analysis.sentiment_timeline).map(([date, sentiment]) => ({ date: formatDate(date), sentiment: sentiment.toFixed(4) }))
            : [];

        // For Overview & Head-to-Head Tabs
        const contributionData = result.temporal_patterns?.daily_distribution_by_date
            ? Object.entries(result.temporal_patterns.daily_distribution_by_date).map(([date, count]) => ({ date, count }))
            : [];

        const totalHourlyData = Array.from({ length: 24 }, (_, i) => {
            const hourKey = i.toString();
            const total = result.temporal_patterns?.hourly_distribution[hourKey] || 0;
            return {
                hour: `${hourKey.padStart(2, '0')}:00`,
                'Total Messages': total,
            };
        });

        const userHourlyData = Array.from({ length: 24 }, (_, i) => {
            const hourKey = i.toString();
            return {
                hour: `${hourKey.padStart(2, '0')}:00`,
                [user1Name]: result.user_behavior?.[user1Name]?.activity_patterns.hourly_distribution[hourKey] || 0,
                [user2Name]: result.user_behavior?.[user2Name]?.activity_patterns.hourly_distribution[hourKey] || 0,
            };
        });

        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const weeklyActivityData = result.temporal_patterns?.daily_distribution
            ? dayOrder.map(day => ({
                day: day.substring(0,3),
                Messages: result.temporal_patterns!.daily_distribution[day] || 0
            }))
            : [];

        const platformData = result.dataset_overview?.chat_platforms_distribution
            ? Object.entries(result.dataset_overview.chat_platforms_distribution).map(([name, value]) => ({ name, value }))
            : [];

        const topTopics = result.topic_modeling?.discovered_topics?.map(topic => ({
            words: topic.top_words.join(', '),
            percentage: topic.message_percentage
        })) || [];

        // For Emotion Landscape Tab
        const emotionSummary = result.emotion_analysis?.summary.overall_average_scores
            ? Object.entries(result.emotion_analysis.summary.overall_average_scores).map(([name, score]) => ({
                emotion: name.charAt(0).toUpperCase() + name.slice(1),
                score: parseFloat(score.toFixed(3))
            })) : [];

        const user1Emotion = result.emotion_analysis?.summary.user_dominant_emotions[user1Name]?.average_scores
            ? Object.entries(result.emotion_analysis.summary.user_dominant_emotions[user1Name].average_scores).map(([name, score]) => ({
                emotion: name.charAt(0).toUpperCase() + name.slice(1),
                score: parseFloat(score.toFixed(3))
            })) : [];

        const user2Emotion = result.emotion_analysis?.summary.user_dominant_emotions[user2Name]?.average_scores
            ? Object.entries(result.emotion_analysis.summary.user_dominant_emotions[user2Name].average_scores).map(([name, score]) => ({
                emotion: name.charAt(0).toUpperCase() + name.slice(1),
                score: parseFloat(score.toFixed(3))
            })) : [];

        return {
            user1Name,
            user2Name,
            responseMetrics,
            relationshipScores,
            sentimentDistribution,
            monthlyData,
            sentimentTimelineData,
            contributionData,
            totalHourlyData,
            userHourlyData,
            weeklyActivityData,
            platformData,
            topTopics,
            emotionSummary,
            user1Emotion,
            user2Emotion,
        };
    }, [result]);

    if (!result || !processedData) {
        return (
            <Card className="bg-gray-800 p-8 text-center text-gray-400">
                <p>Loading analysis data...</p>
            </Card>
        );
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview': return <OverviewTab result={result} processedData={processedData} />;
            case 'behavior-content': return <BehaviorContentTab result={result} processedData={processedData} />;
            case 'emotion-landscape': return <EmotionLandscapeTab result={result} processedData={processedData} />;
            case 'convos-tones': return <ConvosTonesTab result={result} user1Name={processedData.user1Name} user2Name={processedData.user2Name} />;
            case 'head-to-head': return <HeadToHeadTab result={result} processedData={processedData} />;
            case 'relationship-dna': return <RelationshipDNATab result={result} processedData={processedData} />;
            default: return null;
        }
    };

    const TabButton = ({ id, label }: { id: string; label: string }) => (
        <button onClick={() => setActiveTab(id)} className={`px-3 py-2 text-xs sm:px-4 sm:text-sm font-medium rounded-md transition-all duration-200 ${activeTab === id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-700'}`}>
            {label}
        </button>
    );

    return (
        <div className="bg-gray-900 text-white p-2 sm:p-6 rounded-2xl shadow-2xl border border-gray-700/50 font-sans">
            <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                {/* --- MODIFIED HEADER SECTION --- */}
                <div className="flex items-center gap-4">
                    <Link href="/" passHref>
                        <Button variant="outline" size="sm" icon={ArrowLeft}>
                            Back to App
                        </Button>
                    </Link>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-100">
                        Analysis Dashboard
                    </h2>
                </div>
                {/* --- END MODIFIED HEADER SECTION --- */}

                <div className="flex flex-wrap gap-1 sm:gap-2 p-1 bg-gray-800 rounded-lg">
                    <TabButton id="overview" label="Overview" />
                    <TabButton id="behavior-content" label="Behavior & Content" />
                    <TabButton id="emotion-landscape" label="Emotion Landscape" />
                    <TabButton id="convos-tones" label="Convos & Tones" />
                    <TabButton id="head-to-head" label="Head-to-Head" />
                    <TabButton id="relationship-dna" label="Relationship DNA" />
                </div>
            </div>
            <div className="transition-opacity duration-300">
                {renderTabContent()}
            </div>
        </div>
    );
};