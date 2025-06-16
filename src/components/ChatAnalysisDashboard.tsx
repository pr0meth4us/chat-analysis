"use client";

import React, { useState, useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Cell
} from 'recharts';
import { MessageCircle, Clock, Users, Zap, Heart, Hourglass } from 'lucide-react';
import { AnalysisResult, Conversation, WordCount, PhraseCount } from "@/types";

// ==============================================================================
// 1. PROP TYPES
// ==============================================================================
interface ChatAnalysisDashboardProps {
    data: AnalysisResult;
}

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ElementType;
    color?: 'indigo' | 'green' | 'blue' | 'pink' | 'amber' | 'sky';
}

interface TabButtonProps {
    id: string;
    label: string;
    isActive: boolean;
    onClick: (id: string) => void;
}

// ==============================================================================
// 2. HELPER & STYLING COMPONENTS
// ==============================================================================

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#0ea5e9'];

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon: Icon, color = 'indigo' }) => {
    const colorClasses = {
        indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
        green: { bg: 'bg-green-100', text: 'text-green-600' },
        blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
        pink: { bg: 'bg-pink-100', text: 'text-pink-600' },
        amber: { bg: 'bg-amber-100', text: 'text-amber-600' },
        sky: { bg: 'bg-sky-100', text: 'text-sky-600' },
    };
    const classes = colorClasses[color];

    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-lg hover:shadow-xl transition-shadow duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className={`text-3xl font-bold ${classes.text} mt-1`}>{value}</p>
                    {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
                </div>
                <div className={`p-3 ${classes.bg} rounded-xl`}>
                    <Icon className={`w-6 h-6 ${classes.text}`} />
                </div>
            </div>
        </div>
    );
};

const TabButton: React.FC<TabButtonProps> = ({ id, label, isActive, onClick }) => (
    <button
        onClick={() => onClick(id)}
        className={`px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-medium transition-all duration-300 ${
            isActive
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-100/50'
        }`}
    >
        {label}
    </button>
);

const ConversationCard: React.FC<{ conv: Conversation, title: string }> = ({ conv, title }) => (
    <div className='bg-gray-50 border border-gray-200 p-4 rounded-lg'>
        <p className='text-sm font-semibold text-gray-700 mb-2'>{title}</p>
        <div className='text-xs text-gray-500 space-y-1'>
            {conv.sample_messages?.slice(0, 2).map((msg, i) => (
                <p key={i} className='truncate'><strong>{msg.sender}:</strong> {msg.message}</p>
            ))}
        </div>
        <div className='mt-3 pt-3 border-t border-gray-200 flex justify-between text-xs font-medium text-gray-600'>
            <span>{conv.message_count} msgs</span>
            <span>{conv.duration_minutes.toFixed(0)} mins</span>
            <span className='font-bold text-indigo-500'>Score: {conv.intensity_score}</span>
        </div>
    </div>
);


// ==============================================================================
// 3. TAB-SPECIFIC COMPONENTS
// ==============================================================================

const OverviewTab: React.FC<{ data: AnalysisResult }> = ({ data }) => {
    const participants = data.dataset_overview?.participants?.names || [];
    const userBehaviorData = data.user_behavior || {};

    const userMessagesData = useMemo(() => participants.map(p => ({
        name: p,
        Messages: userBehaviorData[p]?.message_counts?.total_messages || 0,
    })), [participants, userBehaviorData]);

    const userAvgLengthData = useMemo(() => participants.map(p => ({
        name: p,
        'Avg Length': Math.round(userBehaviorData[p]?.message_stats?.avg_message_length_chars || 0),
    })), [participants, userBehaviorData]);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Messages" value={(data.dataset_overview?.total_messages || 0).toLocaleString()} subtitle={`Over ${data.dataset_overview?.date_range?.total_days || 0} days`} icon={MessageCircle} color="indigo" />
                <StatCard title="Participants" value={participants.length} subtitle={participants.join(', ')} icon={Users} color="green" />
                <StatCard title="Avg. Response Time" value={`${(data.relationship_metrics?.underlying_metrics?.overall_median_response_time_minutes || 0).toFixed(1)} min`} subtitle="Median" icon={Clock} color="blue" />
                <StatCard title="Relationship Score" value={`${(data.relationship_metrics?.relationship_score || 0)} / 100`} subtitle={data.relationship_metrics?.relationship_intensity} icon={Heart} color="pink" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Total Messages Sent</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={userMessagesData} layout="vertical" margin={{ left: 10, top: 10, right: 10, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis type="number" stroke="#6b7280" />
                            <YAxis type="category" dataKey="name" stroke="#6b7280" width={80} interval={0} />
                            <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }} />
                            <Bar dataKey="Messages" radius={[0, 8, 8, 0]}>
                                {userMessagesData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Avg. Message Length (chars)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={userAvgLengthData} layout="vertical" margin={{ left: 10, top: 10, right: 10, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis type="number" stroke="#6b7280" />
                            <YAxis type="category" dataKey="name" stroke="#6b7280" width={80} interval={0} />
                            <Tooltip cursor={{ fill: 'rgba(236, 72, 153, 0.1)' }} />
                            <Bar dataKey="Avg Length" radius={[0, 8, 8, 0]}>
                                {userAvgLengthData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

const PatternsTab: React.FC<{ data: AnalysisResult }> = ({ data }) => {
    const hourlyData = useMemo(() => {
        const dist = data.temporal_patterns?.hourly_distribution || {};
        return Object.entries(dist).map(([hour, count]) => ({ hour: `${hour.padStart(2, '0')}:00`, Messages: count as number }));
    }, [data.temporal_patterns]);

    const dailyData = useMemo(() => {
        const dist = data.temporal_patterns?.daily_distribution || {};
        const order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return order.map(day => ({ day: day.slice(0,3), Messages: dist[day] || 0 }));
    }, [data.temporal_patterns]);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Peak Hour" value={data.temporal_patterns?.peak_hour !== undefined ? `${data.temporal_patterns.peak_hour}:00` : 'N/A'} subtitle="Most active time" icon={Clock} color="amber" />
                <StatCard title="Chat Streak" value={`${data.unbroken_streaks?.longest_consecutive_days || 0} days`} subtitle="Consecutive days talking" icon={Zap} color="green" />
                <StatCard title="Total 'Ghost' Periods" value={data.ghost_periods?.total_ghost_periods || 0} subtitle="Gaps > 12 hours" icon={Hourglass} color="sky" />
                <StatCard title="Longest Silence" value={`${(data.ghost_periods?.longest_ghost_period_hours || 0).toFixed(1)} hours`} subtitle="Longest gap" icon={Hourglass} color="blue" />
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-lg">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Activity by Hour of Day</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={hourlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="hour" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="Messages" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-lg">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Activity by Day of Week</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="day" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" allowDecimals={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="Messages" stroke="#10b981" strokeWidth={3} dot={{r: 5}} activeDot={{r: 8}} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const LanguageTab: React.FC<{ data: AnalysisResult }> = ({ data }) => {
    const topWords = useMemo(() => data.word_analysis?.top_50_meaningful_words?.slice(0, 20) || [], [data.word_analysis]);
    const topBigrams = useMemo(() => data.word_analysis?.top_20_bigrams?.slice(0, 10) || [], [data.word_analysis]);

    return(
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Top 20 Most Used Words</h3>
                    <div className='flex flex-wrap gap-2'>
                        {topWords.map((word: WordCount) => (
                            <span key={word.word} className='bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full'>
                                 {word.word} <span className='opacity-60'>{word.count}</span>
                             </span>
                        ))}
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Top 10 Common Phrases</h3>
                    <div className='space-y-2'>
                        {topBigrams.map((phrase: PhraseCount) => (
                            <div key={phrase.phrase} className='flex justify-between items-center text-sm p-2 bg-gray-50 rounded-md'>
                                <span className='text-gray-700 font-medium'>"{phrase.phrase}"</span>
                                <span className='font-bold text-gray-500'>{phrase.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const BehaviorTab: React.FC<{ data: AnalysisResult }> = ({ data }) => {
    const longestConvos = data.conversation_patterns?.longest_conversations_by_messages || [];
    const intenseConvos = data.conversation_patterns?.most_intense_conversations || [];

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-lg space-y-4">
                    <h3 className="text-xl font-semibold text-gray-800">Longest Conversations (by Messages)</h3>
                    {longestConvos.map((c: Conversation) => <ConversationCard key={c.id} conv={c} title={`Duration: ${c.duration_minutes.toFixed(0)} mins`} />)}
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-lg space-y-4">
                    <h3 className="text-xl font-semibold text-gray-800">Most Intense Conversations</h3>
                    {intenseConvos.map((c: Conversation) => <ConversationCard key={c.id} conv={c} title={`Pace Factor: ${c.relative_pace_factor}`} />)}
                </div>
            </div>
        </div>
    );
};

// ==============================================================================
// 4. MAIN DASHBOARD COMPONENT
// ==============================================================================

const ChatAnalysisDashboard: React.FC<ChatAnalysisDashboardProps> = ({ data }) => {
    const [activeTab, setActiveTab] = useState('overview');

    if (!data) {
        return <div className="p-8 text-center text-red-500">Error: Analysis data is missing.</div>;
    }

    const TABS: { [key: string]: React.ReactNode } = {
        overview: <OverviewTab data={data} />,
        patterns: <PatternsTab data={data} />,
        behavior: <BehaviorTab data={data} />,
        language: <LanguageTab data={data} />,
    };

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Chat Analytics Dashboard
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Displaying analysis from {new Date(data.dataset_overview?.date_range?.start_date || '').toLocaleDateString()} to {new Date(data.dataset_overview?.date_range?.end_date || '').toLocaleDateString()}
                    </p>
                </header>

                <nav className="flex justify-center mb-10">
                    <div className="bg-gray-100/80 backdrop-blur-sm rounded-2xl p-2 border border-gray-200 shadow-sm">
                        <div className="flex flex-wrap justify-center gap-2">
                            <TabButton id="overview" label="Overview" isActive={activeTab === 'overview'} onClick={setActiveTab} />
                            <TabButton id="patterns" label="Patterns" isActive={activeTab === 'patterns'} onClick={setActiveTab} />
                            <TabButton id="behavior" label="Conversations" isActive={activeTab === 'behavior'} onClick={setActiveTab} />
                            <TabButton id="language" label="Language" isActive={activeTab === 'language'} onClick={setActiveTab} />
                        </div>
                    </div>
                </nav>

                <main>
                    {TABS[activeTab]}
                </main>
            </div>
        </div>
    );
};

export default ChatAnalysisDashboard;