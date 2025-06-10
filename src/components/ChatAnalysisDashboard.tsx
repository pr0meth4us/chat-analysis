import React, { useState } from 'react';

// Icon imports organized by category
import {
    // Communication icons
    MessageCircle,
    MessageSquare,
    Send,
    Reply,

    // User & People icons
    Users,
    User,

    // Time & Activity icons
    Clock,
    Calendar,
    Timer,

    // Analytics & Charts icons
    TrendingUp,
    Activity,

    // Status & Indicators
    Heart,
    Zap,
    Moon,
    Sun,
    Flame,
    Ghost,

    // Navigation & UI
    ArrowRight,
    ChevronDown,
    ChevronUp,

    // Content & Data icons
    Globe,
    Hash,
    Award,
    Target
} from 'lucide-react';

// Chart imports
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

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// Core Data Types
interface DateRange {
    total_days: number;
    start_date: string;
    end_date: string;
}

interface DatasetOverview {
    total_messages: number;
    date_range: DateRange;
}

interface GhostPeriod {
    duration_hours: number;
    last_sender_before_ghost: string;
    who_broke_silence: string;
    last_message_before_ghost: string;
    first_message_after_ghost: string;
}

interface UserBehavior {
    total_messages: number;
    avg_message_length: number;
    emoji_usage_rate: number;
    vocabulary_size: number;
    active_days: Record<string, number>;
}

// Analysis Result Types
interface RelationshipMetrics {
    relationship_intensity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREMELY_HIGH';
    daily_average_messages: number;
    avg_response_time_minutes: number;
    balance_score: number;
    peak_single_day_messages: number;
    most_active_date: string;
    communication_balance: Record<string, number>;
}

interface ConversationPatterns {
    total_conversations: number;
    avg_conversation_duration_minutes: number;
    avg_conversation_length: number;
    conversation_starters: Record<string, number>;
    conversation_enders: Record<string, number>;
}

interface GhostAnalysis {
    total_ghost_periods: number;
    longest_ghost_hours: number;
    who_breaks_silence_most: Record<string, number>;
    top_10_ghost_periods: GhostPeriod[];
}

interface WordAnalysis {
    english_word_count: number;
    khmer_word_count: number;
    top_50_meaningful_words: [string, number][];
}

// Main Data Structure
interface AnalysisData {
    dataset_overview: DatasetOverview;
    relationship_metrics: RelationshipMetrics;
    conversation_patterns: ConversationPatterns;
    ghost_analysis: GhostAnalysis;
    user_behavior: Record<string, UserBehavior>;
    word_analysis: WordAnalysis;
}

// Chart Data Types
interface ActivityDataPoint {
    day: string;
    Othher: number;
    me: number;
}

interface BalanceDataPoint {
    name: string;
    value: number;
    color: string;
}

// Component Props Types
interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ComponentType<{ className?: string }>;
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo' | 'yellow';
    trend?: number;
}

interface IntensityBadgeProps {
    intensity: RelationshipMetrics['relationship_intensity'];
}

interface GhostPeriodCardProps {
    ghost: GhostPeriod;
    index: number;
}

interface WordCloudCardProps {
    words: [string, number][];
    title: string;
}

interface CollapsibleSectionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

interface ChatAnalysisDashboardProps {
    data: AnalysisData;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

const COLOR_CLASSES = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    yellow: 'bg-yellow-100 text-yellow-600',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(Math.round(num));
};

// ============================================================================
// COMPONENTS
// ============================================================================

const MetricCard: React.FC<MetricCardProps> = ({
                                                   title,
                                                   value,
                                                   subtitle,
                                                   icon: Icon,
                                                   color = 'blue',
                                                   trend
                                               }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${COLOR_CLASSES[color]}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
                </div>
            </div>
            {trend && (
                <div className={`flex items-center text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <TrendingUp className="w-4 h-4 mr-1" />
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
            default:
                return { color: 'gray', icon: Activity, text: 'Low' };
        }
    };

    const config = getIntensityConfig(intensity);
    const Icon = config.icon;
    const colorClass = `bg-${config.color}-100 text-${config.color}-800`;

    return (
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}>
            <Icon className="w-4 h-4 mr-1" />
            {config.text}
        </div>
    );
};

const GhostPeriodCard: React.FC<GhostPeriodCardProps> = ({ ghost, index }) => (
    <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
                <Ghost className="w-5 h-5 text-purple-500" />
                <span className="font-medium text-gray-900">Ghost #{index + 1}</span>
            </div>
            <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{Math.round(ghost.duration_hours)}h</p>
                <p className="text-xs text-gray-500">duration</p>
            </div>
        </div>

        <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
                <span className="text-gray-600">Last message:</span>
                <span className="text-gray-900 font-medium">{ghost.last_sender_before_ghost}</span>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-gray-600">Broke silence:</span>
                <span className="text-blue-600 font-medium">{ghost.who_broke_silence}</span>
            </div>
        </div>

        <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
            <p className="text-gray-600 truncate">"{ghost.last_message_before_ghost}"</p>
            <ArrowRight className="w-3 h-3 text-gray-400 mx-auto my-1" />
            <p className="text-gray-900 truncate">"{ghost.first_message_after_ghost}"</p>
        </div>
    </div>
);

const WordCloudCard: React.FC<WordCloudCardProps> = ({ words, title }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Hash className="w-5 h-5 mr-2 text-blue-600" />
            {title}
        </h3>
        <div className="flex flex-wrap gap-2">
            {words.slice(0, 20).map(([word, count], index) => (
                <span
                    key={word}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                        backgroundColor: COLORS[index % COLORS.length] + '20',
                        color: COLORS[index % COLORS.length],
                        fontSize: `${Math.max(0.7, Math.min(1.2, count / words[0][1]))}rem`
                    }}
                >
                    {word} <span className="ml-1 text-xs opacity-75">({count})</span>
                </span>
            ))}
        </div>
    </div>
);

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
            >
                <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {isOpen && <div className="px-6 pb-6">{children}</div>}
        </div>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ChatAnalysisDashboard: React.FC<ChatAnalysisDashboardProps> = ({ data }) => {
    // Helper functions for data processing
    const getActivityData = (): ActivityDataPoint[] => {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return days.map(day => ({
            day: day.slice(0, 3),
            Othher: data.user_behavior?.Othher?.active_days?.[day] || 0,
            me: data.user_behavior?.me?.active_days?.[day] || 0
        }));
    };

    const getBalanceData = (): BalanceDataPoint[] => [
        {
            name: 'Me',
            value: Math.round(data.relationship_metrics?.communication_balance?.me || 0),
            color: '#3B82F6'
        },
        {
            name: 'Other',
            value: Math.round(data.relationship_metrics?.communication_balance?.Othher || 0),
            color: '#10B981'
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold mb-4">Chat Analysis Dashboard</h1>
                        <p className="text-xl opacity-90 mb-6">
                            Deep insights into your conversation patterns and relationships
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
                            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                                <MessageCircle className="w-8 h-8 mx-auto mb-2" />
                                <p className="text-2xl font-bold">{formatNumber(data.dataset_overview?.total_messages || 0)}</p>
                                <p className="text-sm opacity-75">Total Messages</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                                <Calendar className="w-8 h-8 mx-auto mb-2" />
                                <p className="text-2xl font-bold">{data.dataset_overview?.date_range?.total_days || 0}</p>
                                <p className="text-sm opacity-75">Days Analyzed</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                                <Users className="w-8 h-8 mx-auto mb-2" />
                                <p className="text-2xl font-bold">{data.conversation_patterns?.total_conversations || 0}</p>
                                <p className="text-sm opacity-75">Conversations</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                                <Heart className="w-8 h-8 mx-auto mb-2" />
                                <IntensityBadge intensity={data.relationship_metrics?.relationship_intensity || 'LOW'} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        title="Daily Messages"
                        value={formatNumber(data.relationship_metrics?.daily_average_messages || 0)}
                        subtitle="Average per day"
                        icon={MessageSquare}
                        color="blue"
                    />
                    <MetricCard
                        title="Response Time"
                        value={`${data.relationship_metrics?.avg_response_time_minutes?.toFixed(1) || 0}m`}
                        subtitle="Average response"
                        icon={Timer}
                        color="green"
                    />
                    <MetricCard
                        title="Balance Score"
                        value={`${Math.round(data.relationship_metrics?.balance_score || 0)}%`}
                        subtitle="Communication balance"
                        icon={Target}
                        color="purple"
                    />
                    <MetricCard
                        title="Peak Day"
                        value={formatNumber(data.relationship_metrics?.peak_single_day_messages || 0)}
                        subtitle={data.relationship_metrics?.most_active_date || ''}
                        icon={Award}
                        color="orange"
                    />
                </div>

                {/* Activity Patterns */}
                <CollapsibleSection title="Activity Patterns" defaultOpen={true}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Activity</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={getActivityData()}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="day" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="me" fill="#3B82F6" name="Me" />
                                    <Bar dataKey="Othher" fill="#10B981" name="Other" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Communication Balance</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <RechartsPieChart>
                                    <Pie
                                        dataKey="value"
                                        data={getBalanceData()}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        label={({ name, value }) => `${name}: ${value}%`}
                                    >
                                        {getBalanceData().map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </RechartsPieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </CollapsibleSection>

                {/* Conversation Insights */}
                <CollapsibleSection title="Conversation Insights">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                                <Send className="w-4 h-4 mr-2 text-blue-600" />
                                Conversation Starters
                            </h4>
                            <div className="space-y-2">
                                {Object.entries(data.conversation_patterns?.conversation_starters || {}).map(([user, count]) => (
                                    <div key={user} className="flex justify-between">
                                        <span className="text-gray-700">{user}</span>
                                        <span className="font-medium text-blue-600">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                                <Reply className="w-4 h-4 mr-2 text-green-600" />
                                Conversation Enders
                            </h4>
                            <div className="space-y-2">
                                {Object.entries(data.conversation_patterns?.conversation_enders || {}).map(([user, count]) => (
                                    <div key={user} className="flex justify-between">
                                        <span className="text-gray-700">{user}</span>
                                        <span className="font-medium text-green-600">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                                <Clock className="w-4 h-4 mr-2 text-purple-600" />
                                Average Duration
                            </h4>
                            <p className="text-2xl font-bold text-purple-600 mb-1">
                                {formatDuration(data.conversation_patterns?.avg_conversation_duration_minutes || 0)}
                            </p>
                            <p className="text-sm text-gray-600">
                                {Math.round(data.conversation_patterns?.avg_conversation_length || 0)} messages avg
                            </p>
                        </div>
                    </div>
                </CollapsibleSection>

                {/* Ghost Analysis */}
                <CollapsibleSection title="Ghost Mode Analysis">
                    <div className="mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <MetricCard
                                title="Total Ghost Periods"
                                value={data.ghost_analysis?.total_ghost_periods || 0}
                                subtitle="Silent periods found"
                                icon={Ghost}
                                color="purple"
                            />
                            <MetricCard
                                title="Longest Ghost"
                                value={`${Math.round(data.ghost_analysis?.longest_ghost_hours || 0)}h`}
                                subtitle="Maximum silence"
                                icon={Moon}
                                color="indigo"
                            />
                            <MetricCard
                                title="Silence Breaker"
                                value={Object.entries(data.ghost_analysis?.who_breaks_silence_most || {}).reduce((a, b) => a[1] > b[1] ? a : b)?.[0] || 'N/A'}
                                subtitle="Most likely to reconnect"
                                icon={Sun}
                                color="yellow"
                            />
                        </div>
                    </div>

                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Top Ghost Periods</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(data.ghost_analysis?.top_10_ghost_periods || []).slice(0, 6).map((ghost, index) => (
                            <GhostPeriodCard key={index} ghost={ghost} index={index} />
                        ))}
                    </div>
                </CollapsibleSection>

                {/* User Behavior Comparison */}
                <CollapsibleSection title="User Behavior Comparison">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {Object.entries(data.user_behavior || {}).map(([user, behavior]) => (
                            <div key={user} className="bg-white rounded-lg border border-gray-200 p-6">
                                <div className="flex items-center mb-4">
                                    <User className="w-5 h-5 mr-2 text-blue-600" />
                                    <h3 className="text-lg font-semibold text-gray-900">{user}</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-gray-50 rounded p-3">
                                        <p className="text-sm text-gray-600">Messages</p>
                                        <p className="text-xl font-bold text-gray-900">{formatNumber(behavior.total_messages || 0)}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded p-3">
                                        <p className="text-sm text-gray-600">Avg Length</p>
                                        <p className="text-xl font-bold text-gray-900">{Math.round(behavior.avg_message_length || 0)}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded p-3">
                                        <p className="text-sm text-gray-600">Emoji Usage</p>
                                        <p className="text-xl font-bold text-gray-900">{Math.round(behavior.emoji_usage_rate || 0)}%</p>
                                    </div>
                                    <div className="bg-gray-50 rounded p-3">
                                        <p className="text-sm text-gray-600">Vocabulary</p>
                                        <p className="text-xl font-bold text-gray-900">{formatNumber(behavior.vocabulary_size || 0)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CollapsibleSection>

                {/* Word Analysis */}
                <CollapsibleSection title="Word Analysis">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Language Distribution</h4>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                                    <div className="flex items-center">
                                        <Globe className="w-5 h-5 mr-2 text-blue-600" />
                                        <span className="font-medium">English Words</span>
                                    </div>
                                    <span className="text-xl font-bold text-blue-600">
                                        {formatNumber(data.word_analysis?.english_word_count || 0)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                                    <div className="flex items-center">
                                        <Globe className="w-5 h-5 mr-2 text-green-600" />
                                        <span className="font-medium">Khmer Words</span>
                                    </div>
                                    <span className="text-xl font-bold text-green-600">
                                        {formatNumber(data.word_analysis?.khmer_word_count || 0)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <WordCloudCard
                            words={data.word_analysis?.top_50_meaningful_words || []}
                            title="Top Words"
                        />
                    </div>
                </CollapsibleSection>
            </div>
        </div>
    );
};

export default ChatAnalysisDashboard;