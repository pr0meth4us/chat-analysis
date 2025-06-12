import React, { useState } from 'react';
import {
    MessageCircle,
    MessageSquare,
    Send,
    Reply,
    Users,
    User,
    Clock,
    Calendar,
    Timer,
    TrendingUp,
    Activity,
    Heart,
    Zap,
    Moon,
    Sun,
    Flame,
    Ghost,
    ArrowRight,
    ChevronDown,
    ChevronUp,
    Globe,
    Hash,
    Award,
    Target,
    Smile, // New icon for Emoji Usage
    BookOpen // New icon for Vocabulary
} from 'lucide-react';

import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart as RechartsPieChart,
    Cell,
    Pie
} from 'recharts';
import {
    ActivityDataPoint,
    BalanceDataPoint,
    ChatAnalysisDashboardProps,
    CollapsibleSectionProps,
    GhostPeriodCardProps,
    IntensityBadgeProps,
    MetricCardProps,
    RelationshipMetrics,
    WordCloudCardProps
} from "@/types"; // Assuming types are correctly defined here

// Modernized color palette
const MODERN_COLORS = [
    '#6366F1', // Indigo 500
    '#10B981', // Green 500
    '#F97316', // Orange 500
    '#EF4444', // Red 500
    '#8B5CF6', // Purple 500
    '#0EA5E9', // Sky 500
    '#EAB308', // Yellow 500
    '#D946EF', // Fuchsia 500
];

const COLOR_MAP = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    purple: 'bg-purple-100 text-purple-700',
    orange: 'bg-orange-100 text-orange-700',
    red: 'bg-red-100 text-red-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    pink: 'bg-pink-100 text-pink-700', // Added pink for variety
    gray: 'bg-gray-100 text-gray-700',
};

const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
};

const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(Math.round(num));
};

const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    subtitle,
    icon: Icon,
    color = 'blue',
    trend
}) => (
    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transform hover:scale-105 transition-all duration-300 ease-in-out">
        <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-full ${COLOR_MAP[color]} shadow-sm`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-base font-medium text-gray-600">{title}</p>
                    <p className="text-3xl font-extrabold text-gray-900 mt-1">{value}</p>
                    {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
                </div>
            </div>
            {trend !== undefined && (
                <div className={`flex items-center text-sm font-semibold ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trend >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingUp className="w-4 h-4 mr-1 transform rotate-180 text-red-600" />}
                    {Math.abs(trend)}%
                </div>
            )}
        </div>
    </div>
);

const IntensityBadge: React.FC<IntensityBadgeProps> = ({ intensity }) => {
    const getIntensityConfig = (level: RelationshipMetrics['relationship_intensity']) => {
        switch (level) {
            case 'EXTREMELY_HIGH':
                return { color: 'red', icon: Flame, text: 'Extremely High' };
            case 'HIGH':
                return { color: 'orange', icon: Zap, text: 'High' };
            case 'MEDIUM':
                return { color: 'yellow', icon: Activity, text: 'Medium' };
            case 'LOW':
                return { color: 'green', icon: Sun, text: 'Low' }; // Assuming low is generally good, can be adjusted
            default:
                return { color: 'gray', icon: Activity, text: 'Undetermined' };
        }
    };

    const config = getIntensityConfig(intensity);
    const Icon = config.icon;
    const colorClass = `bg-${config.color}-100 text-${config.color}-800`;

    return (
        <div className={`inline-flex items-center px-4 py-2 rounded-full text-base font-semibold ${colorClass} shadow-sm`}>
            <Icon className="w-5 h-5 mr-2" />
            {config.text}
        </div>
    );
};

const GhostPeriodCard: React.FC<GhostPeriodCardProps> = ({ ghost, index }) => (
    <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
                <Ghost className="w-6 h-6 text-purple-500" />
                <span className="font-semibold text-lg text-gray-900">Ghost Period #{index + 1}</span>
            </div>
            <div className="text-right">
                <p className="text-xl font-bold text-gray-900">{Math.round(ghost.duration_hours)}h</p>
                <p className="text-sm text-gray-600">Duration</p>
            </div>
        </div>

        <div className="space-y-2 text-sm text-gray-700">
            <div className="flex justify-between items-center pb-1 border-b border-gray-100">
                <span className="font-medium">Last message by:</span>
                <span className="text-gray-900 font-semibold">{ghost.last_sender_before_ghost}</span>
            </div>
            <div className="flex justify-between items-center pt-1">
                <span className="font-medium">Silence broken by:</span>
                <span className="text-blue-600 font-semibold">{ghost.who_broke_silence}</span>
            </div>
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-700 border border-gray-100">
            <p className="truncate italic">"{ghost.last_message_before_ghost}"</p>
            <ArrowRight className="w-4 h-4 text-gray-400 mx-auto my-2" />
            <p className="truncate italic">"{ghost.first_message_after_ghost}"</p>
        </div>
    </div>
);

const WordCloudCard: React.FC<WordCloudCardProps> = ({ words, title }) => (
    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
        <h3 className="text-xl font-semibold text-gray-900 mb-5 flex items-center">
            <Hash className="w-6 h-6 mr-3 text-blue-600" />
            {title}
        </h3>
        <div className="flex flex-wrap gap-3">
            {words.slice(0, 20).map(([word, count], index) => (
                <span
                    key={word}
                    className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-transform transform hover:scale-105"
                    style={{
                        backgroundColor: MODERN_COLORS[index % MODERN_COLORS.length] + '20', // Lighter shade for background
                        color: MODERN_COLORS[index % MODERN_COLORS.length],
                        fontSize: `${Math.max(0.8, Math.min(1.5, count / words[0][1] * 1.2))}rem`, // Adjusted font size scaling
                    }}
                >
                    {word} <span className="ml-2 text-xs opacity-80 font-normal">({count})</span>
                </span>
            ))}
        </div>
    </div>
);

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors duration-200"
            >
                <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                {isOpen ? <ChevronUp className="w-6 h-6 text-gray-600" /> : <ChevronDown className="w-6 h-6 text-gray-600" />}
            </button>
            {isOpen && <div className="px-6 pb-6 pt-2 border-t border-gray-100">{children}</div>}
        </div>
    );
};

const ChatAnalysisDashboard: React.FC<ChatAnalysisDashboardProps> = ({ data }) => {
    const getActivityData = (): ActivityDataPoint[] => {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return days.map(day => ({
            day: day.slice(0, 3),
            Other: data.user_behavior?.Othher?.active_days?.[day] || 0,
            me: data.user_behavior?.me?.active_days?.[day] || 0
        }));
    };

    const getBalanceData = (): BalanceDataPoint[] => [
        {
            name: 'Me',
            value: Math.round(data.relationship_metrics?.communication_balance?.me || 0),
            color: MODERN_COLORS[0]
        },
        {
            name: 'Other',
            value: Math.round(data.relationship_metrics?.communication_balance?.Othher || 0),
            color: MODERN_COLORS[1]
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-blue-50 font-sans text-gray-900">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-6 py-16 text-center">
                    <h1 className="text-5xl font-extrabold mb-4 animate-fade-in-down">Chat Analysis Dashboard</h1>
                    <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto animate-fade-in-up">
                        Dive deep into your conversation patterns, relationships, and behavioral insights.
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10">
                        <div className="bg-white/15 backdrop-blur-sm rounded-xl p-5 shadow-inner border border-white/20 transform hover:scale-105 transition-all duration-300">
                            <MessageCircle className="w-9 h-9 mx-auto mb-3 text-white/90" />
                            <p className="text-3xl font-extrabold">{formatNumber(data.dataset_overview?.total_messages || 0)}</p>
                            <p className="text-sm opacity-80 mt-1">Total Messages</p>
                        </div>
                        <div className="bg-white/15 backdrop-blur-sm rounded-xl p-5 shadow-inner border border-white/20 transform hover:scale-105 transition-all duration-300">
                            <Calendar className="w-9 h-9 mx-auto mb-3 text-white/90" />
                            <p className="text-3xl font-extrabold">{data.dataset_overview?.date_range?.total_days || 0}</p>
                            <p className="text-sm opacity-80 mt-1">Days Analyzed</p>
                        </div>
                        <div className="bg-white/15 backdrop-blur-sm rounded-xl p-5 shadow-inner border border-white/20 transform hover:scale-105 transition-all duration-300">
                            <Users className="w-9 h-9 mx-auto mb-3 text-white/90" />
                            <p className="text-3xl font-extrabold">{data.conversation_patterns?.total_conversations || 0}</p>
                            <p className="text-sm opacity-80 mt-1">Conversations</p>
                        </div>
                        <div className="bg-white/15 backdrop-blur-sm rounded-xl p-5 shadow-inner border border-white/20 flex flex-col items-center justify-center transform hover:scale-105 transition-all duration-300">
                            <Heart className="w-9 h-9 mx-auto mb-3 text-white/90" />
                            <IntensityBadge intensity={data.relationship_metrics?.relationship_intensity || 'LOW'} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-12 space-y-10">
                {/* Key Metrics */}
                <CollapsibleSection title="Key Relationship Metrics" defaultOpen={true}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <MetricCard
                            title="Daily Messages"
                            value={formatNumber(data.relationship_metrics?.daily_average_messages || 0)}
                            subtitle="Average messages per day"
                            icon={MessageSquare}
                            color="blue"
                        />
                        <MetricCard
                            title="Avg. Response Time"
                            value={`${data.relationship_metrics?.avg_response_time_minutes?.toFixed(1) || 0}m`}
                            subtitle="Average time to reply"
                            icon={Timer}
                            color="green"
                        />
                        <MetricCard
                            title="Communication Balance"
                            value={`${Math.round(data.relationship_metrics?.balance_score || 0)}%`}
                            subtitle="Harmony in communication"
                            icon={Target}
                            color="purple"
                        />
                        <MetricCard
                            title="Peak Activity Day"
                            value={formatNumber(data.relationship_metrics?.peak_single_day_messages || 0)}
                            subtitle={data.relationship_metrics?.most_active_date || 'N/A'}
                            icon={Award}
                            color="orange"
                        />
                    </div>
                </CollapsibleSection>

                {/* Activity Patterns */}
                <CollapsibleSection title="Activity Patterns & Balance">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-gray-50 rounded-xl p-6 shadow-inner border border-gray-200">
                            <h3 className="text-xl font-semibold text-gray-900 mb-5 flex items-center">
                                <Activity className="w-5 h-5 mr-2 text-indigo-600" /> Weekly Activity Distribution
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={getActivityData()} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} className="text-sm text-gray-600" />
                                    <YAxis axisLine={false} tickLine={false} className="text-sm text-gray-600" />
                                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Bar dataKey="me" fill={MODERN_COLORS[0]} name="Me" radius={[5, 5, 0, 0]} />
                                    <Bar dataKey="Other" fill={MODERN_COLORS[1]} name="Other" radius={[5, 5, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-6 shadow-inner border border-gray-200">
                            <h3 className="text-xl font-semibold text-gray-900 mb-5 flex items-center">
                                <Users className="w-5 h-5 mr-2 text-green-600" /> Communication Balance Overview
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <RechartsPieChart>
                                    <Pie
                                        dataKey="value"
                                        data={getBalanceData()}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={120}
                                        fill="#8884d8"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {getBalanceData().map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                </RechartsPieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </CollapsibleSection>

                {/* Conversation Insights */}
                <CollapsibleSection title="Conversation Flow Insights">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                            <h4 className="font-semibold text-lg text-gray-900 mb-3 flex items-center">
                                <Send className="w-5 h-5 mr-2 text-blue-600" />
                                Top Conversation Starters
                            </h4>
                            <ul className="space-y-2">
                                {Object.entries(data.conversation_patterns?.conversation_starters || {}).sort(([, a], [, b]) => b - a).map(([user, count]) => (
                                    <li key={user} className="flex justify-between items-center text-gray-700 text-base border-b border-gray-100 pb-1">
                                        <span className="truncate">{user}</span>
                                        <span className="font-semibold text-blue-600">{count} times</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                            <h4 className="font-semibold text-lg text-gray-900 mb-3 flex items-center">
                                <Reply className="w-5 h-5 mr-2 text-green-600" />
                                Top Conversation Enders
                            </h4>
                            <ul className="space-y-2">
                                {Object.entries(data.conversation_patterns?.conversation_enders || {}).sort(([, a], [, b]) => b - a).map(([user, count]) => (
                                    <li key={user} className="flex justify-between items-center text-gray-700 text-base border-b border-gray-100 pb-1">
                                        <span className="truncate">{user}</span>
                                        <span className="font-semibold text-green-600">{count} times</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 flex flex-col justify-between">
                            <div>
                                <h4 className="font-semibold text-lg text-gray-900 mb-3 flex items-center">
                                    <Clock className="w-5 h-5 mr-2 text-purple-600" />
                                    Average Conversation Metrics
                                </h4>
                                <p className="text-3xl font-extrabold text-purple-600 mb-2">
                                    {formatDuration(data.conversation_patterns?.avg_conversation_duration_minutes || 0)}
                                </p>
                                <p className="text-base text-gray-600">
                                    Average Duration
                                </p>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-3xl font-extrabold text-purple-600 mb-2">
                                    {Math.round(data.conversation_patterns?.avg_conversation_length || 0)}
                                </p>
                                <p className="text-base text-gray-600">
                                    Messages per Conversation
                                </p>
                            </div>
                        </div>
                    </div>
                </CollapsibleSection>

                {/* Ghost Analysis */}
                <CollapsibleSection title="Silence & Ghost Mode Analysis">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <MetricCard
                            title="Total Silent Periods"
                            value={data.ghost_analysis?.total_ghost_periods || 0}
                            subtitle="Number of quiet spells"
                            icon={Ghost}
                            color="purple"
                        />
                        <MetricCard
                            title="Longest Silence"
                            value={`${Math.round(data.ghost_analysis?.longest_ghost_hours || 0)}h`}
                            subtitle="Maximum duration of no messages"
                            icon={Moon}
                            color="indigo"
                        />
                        <MetricCard
                            title="Most Common Silence Breaker"
                            value={Object.entries(data.ghost_analysis?.who_breaks_silence_most || {}).reduce((a, b) => a[1] > b[1] ? a : b)?.[0] || 'N/A'}
                            subtitle="Who usually initiates contact again"
                            icon={Sun}
                            color="yellow"
                        />
                    </div>

                    <h4 className="text-xl font-semibold text-gray-900 mb-5 flex items-center">
                        <Ghost className="w-5 h-5 mr-2 text-red-600" /> Top Silent Periods
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(data.ghost_analysis?.top_10_ghost_periods || []).slice(0, 6).map((ghost, index) => (
                            <GhostPeriodCard key={index} ghost={ghost} index={index} />
                        ))}
                    </div>
                </CollapsibleSection>

                {/* User Behavior Comparison */}
                <CollapsibleSection title="Individual User Behavior">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {Object.entries(data.user_behavior || {}).map(([user, behavior]) => (
                            <div key={user} className="bg-white rounded-xl border border-gray-200 p-6 shadow-md">
                                <div className="flex items-center mb-5">
                                    <User className="w-7 h-7 mr-3 text-blue-600" />
                                    <h3 className="text-2xl font-bold text-gray-900">{user}</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 rounded-lg p-4 text-center shadow-inner">
                                        <p className="text-sm text-gray-600">Total Messages</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(behavior.total_messages || 0)}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4 text-center shadow-inner">
                                        <p className="text-sm text-gray-600">Avg. Message Length</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{Math.round(behavior.avg_message_length || 0)} words</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4 text-center shadow-inner">
                                        <p className="text-sm text-gray-600">Emoji Usage Rate</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{Math.round(behavior.emoji_usage_rate || 0)}%</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4 text-center shadow-inner">
                                        <p className="text-sm text-gray-600">Vocabulary Size</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(behavior.vocabulary_size || 0)} unique</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CollapsibleSection>

                {/* Word Analysis */}
                <CollapsibleSection title="Word & Language Analysis">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                            <h4 className="text-xl font-semibold text-gray-900 mb-5 flex items-center">
                                <Globe className="w-5 h-5 mr-2 text-pink-600" /> Language Distribution
                            </h4>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100 shadow-sm">
                                    <div className="flex items-center">
                                        <span className="font-medium text-blue-700 text-lg">English Words</span>
                                    </div>
                                    <span className="text-3xl font-bold text-blue-600">
                                        {formatNumber(data.word_analysis?.english_word_count || 0)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100 shadow-sm">
                                    <div className="flex items-center">
                                        <span className="font-medium text-green-700 text-lg">Khmer Words</span>
                                    </div>
                                    <span className="text-3xl font-bold text-green-600">
                                        {formatNumber(data.word_analysis?.khmer_word_count || 0)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <WordCloudCard
                            words={data.word_analysis?.top_50_meaningful_words || []}
                            title="Most Meaningful Words (Word Cloud)"
                        />
                    </div>
                </CollapsibleSection>
            </div>
        </div>
    );
};

export default ChatAnalysisDashboard;