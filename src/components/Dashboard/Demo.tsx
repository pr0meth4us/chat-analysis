'use client';

import React, { useState, useMemo, useEffect, FC } from 'react';
import { AnalysisResult, ResponseMetrics } from '@/types/analysis';
import { Card } from './layout/Card';
import { OverviewTab } from './tabs/OverviewTab';
import { BehaviorContentTab } from './tabs/BehaviorContentTab';
import { ConvosTonesTab } from './tabs/ConvosTonesTab';
import { HeadToHeadTab } from './tabs/HeadToHeadTab';
import { EmotionLandscapeTab } from './tabs/EmotionLandscapeTab';
import { RelationshipDNATab } from './tabs/RelationshipDNATab';
import { formatDate } from '@/utils/formatDate';

interface DemoResultsDashboardProps {}

export const DemoResultsDashboard: FC<DemoResultsDashboardProps> = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadMockData = async () => {
            try {
                const response = await fetch('/sample-data/mock-analysis.json');
                if (!response.ok) {
                    throw new Error(`Failed to load mock data: ${response.status}`);
                }
                const mockData = await response.json();
                setResult(mockData);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load mock data');
            } finally {
                setLoading(false);
            }
        };

        loadMockData();
    }, []);

    const processedData = useMemo(() => {
        if (!result) return null;

        const [user1Name, user2Name] = result.dataset_overview?.participants.names || ['User 1', 'User 2'];

        const validResponseMetrics: ResponseMetrics | null =
            result.response_metrics && !('message' in result.response_metrics)
                ? result.response_metrics
                : null;

        const responseMetrics = [
            { subject: 'Avg (m)', [user1Name]: validResponseMetrics?.[user1Name]?.[user2Name]?.avg_response_minutes || 0, [user2Name]: validResponseMetrics?.[user2Name]?.[user1Name]?.avg_response_minutes || 0 },
            { subject: 'Median (m)', [user1Name]: validResponseMetrics?.[user1Name]?.[user2Name]?.median_response_minutes || 0, [user2Name]: validResponseMetrics?.[user2Name]?.[user1Name]?.median_response_minutes || 0 },
            { subject: 'P90 (m)', [user1Name]: validResponseMetrics?.[user1Name]?.[user2Name]?.p90_response_minutes || 0, [user2Name]: validResponseMetrics?.[user2Name]?.[user1Name]?.p90_response_minutes || 0 },
            { subject: 'Std Dev (m)', [user1Name]: validResponseMetrics?.[user1Name]?.[user2Name]?.response_time_std_dev || 0, [user2Name]: validResponseMetrics?.[user2Name]?.[user1Name]?.response_time_std_dev || 0 },
        ];

        // This handles a case where relationship_metrics module could have an error string
        const relationshipScores = (result.relationship_metrics && 'score_components' in result.relationship_metrics)
            ? Object.entries(result.relationship_metrics.score_components).map(([name, value]) => ({
                name: name.replace(/_score/g, '').replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()),
                value: value,
                fill: { balance_score: '#4a90e2', consistency_score: '#50e3c2', responsiveness_score: '#f5a623', engagement_score: '#d0021b' }[name] || '#8884d8'
            }))
            : [];

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

        const contributionData = result.temporal_patterns?.daily_distribution_by_date
            ? Object.entries(result.temporal_patterns.daily_distribution_by_date).map(([date, count]) => ({ date, count }))
            : [];

        const totalHourlyData = Array.from({ length: 24 }, (_, i) => {
            const hourKey = i.toString();
            const total = result.temporal_patterns?.hourly_distribution?.[hourKey] ?? 0;
            return {
                hour: `${hourKey.padStart(2, '0')}:00`,
                'Total Messages': total,
            };
        });

        const userHourlyData = Array.from({ length: 24 }, (_, i) => {
            const hourKey = i.toString();
            return {
                hour: `${hourKey.padStart(2, '0')}:00`,
                [user1Name]: result.user_behavior?.[user1Name]?.activity_patterns?.hourly_distribution?.[hourKey] ?? 0,
                [user2Name]: result.user_behavior?.[user2Name]?.activity_patterns?.hourly_distribution?.[hourKey] ?? 0,
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

        // FIX: Add a type guard to safely handle the topic_modeling union type.
        const topTopics = (result.topic_modeling && 'discovered_topics' in result.topic_modeling)
            ? result.topic_modeling.discovered_topics.map(topic => ({
                words: topic.top_words.join(', '),
                percentage: topic.message_percentage
            }))
            : [];

        const emotionSummary = result.emotion_analysis?.summary?.overall_average_scores
            ? Object.entries(result.emotion_analysis.summary.overall_average_scores).map(([name, score]) => ({
                emotion: name.charAt(0).toUpperCase() + name.slice(1),
                score: parseFloat(score.toFixed(3))
            })) : [];

        const user1Emotion = result.emotion_analysis?.summary?.user_dominant_emotions?.[user1Name]?.average_scores
            ? Object.entries(result.emotion_analysis.summary.user_dominant_emotions[user1Name].average_scores).map(([name, score]) => ({
                emotion: name.charAt(0).toUpperCase() + name.slice(1),
                score: parseFloat(score.toFixed(3))
            })) : [];

        const user2Emotion = result.emotion_analysis?.summary?.user_dominant_emotions?.[user2Name]?.average_scores
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

    if (loading) {
        return (
            <Card className="bg-gray-800 p-8 text-center text-gray-400">
                <p>Loading mock analysis data...</p>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="bg-red-800 p-8 text-center text-red-300">
                <p>Error loading mock data: {error}</p>
            </Card>
        );
    }

    if (!result || !processedData) {
        return (
            <Card className="bg-gray-800 p-8 text-center text-gray-400">
                <p>No mock data available...</p>
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
        <div className="bg-gray-900 text-white font-sans">
            {/* Demo Warning Banner */}
            <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-4 mb-6 rounded-lg border border-red-500/50 shadow-lg">
                <div className="flex items-center justify-center gap-3">
                    <div className="text-2xl">⚠️</div>
                    <div className="text-center">
                        <h3 className="font-bold text-lg">DEMO MODE - MOCK DATA</h3>
                        <p className="text-sm opacity-90">
                            This is synthetic/fake data for demonstration purposes only.
                            <a href="/public" className="underline hover:text-yellow-200 ml-1 font-semibold">
                                Click here for real analysis
                            </a>
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-2 sm:p-6 rounded-2xl shadow-2xl border border-gray-700/50">
                <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-100">Analysis Dashboard (Demo)</h2>
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
        </div>
    );
};