"use client";
import React, { useState, useMemo } from 'react';
import data from "../2025-06-13T114447.200.json";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart, Legend } from 'recharts';
import { MessageCircle, Clock, PieChart as PieChartIcon, TrendingUp, Users, Smile, Zap, Heart, Globe, MessageSquare } from 'lucide-react';

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');

    // Use a consistent source for the analysis data
    const report = useMemo(() => data.analysis_report || data, []);

    // Get participants dynamically
    const participants = useMemo(() => {
        return report.dataset_overview?.participants ||
            Object.keys(report.user_behavior || {}) ||
            ['user1', 'user2'];
    }, [report]);

    const [participant1, participant2] = participants;

    // Process data for charts
    const hourlyData = useMemo(() => {
        const hourlyDist = report.temporal_patterns?.hourly_distribution || {};
        return Object.entries(hourlyDist).map(([hour, count]) => ({
            hour: `${hour}:00`,
            messages: count
        }));
    }, [report]);

    const dailyData = useMemo(() => {
        const dailyDist = report.temporal_patterns?.daily_distribution || {};
        return Object.entries(dailyDist).map(([day, count]) => ({
            day,
            messages: count
        }));
    }, [report]);

    const monthlyData = useMemo(() => {
        const monthlyTrend = report.temporal_patterns?.monthly_trend || {};
        return Object.entries(monthlyTrend).map(([month, count]) => ({
            month,
            messages: count
        }));
    }, [report]);

    const emojiData = useMemo(() => {
        const topEmojis = report.emoji_analysis?.top_20_emojis_overall || [];
        return topEmojis.slice(0, 10).map(emoji => ({
            emoji: emoji.emoji,
            count: emoji.count
        }));
    }, [report]);

    // --- REFACTORED FOR SEPARATE CHARTS ---
    const userTotalMessagesData = useMemo(() => {
        const userBehavior = report.user_behavior || {};
        return participants.map(p => ({
            name: p,
            value: userBehavior[p]?.total_messages || 0,
        }));
    }, [participants, report]);

    const userAvgLengthData = useMemo(() => {
        const userBehavior = report.user_behavior || {};
        return participants.map(p => ({
            name: p,
            value: Math.round(userBehavior[p]?.avg_message_length || 0),
        }));
    }, [participants, report]);
    const platformData = useMemo(() => {
        const platforms = report.dataset_overview?.chat_platforms || {};
        return Object.entries(platforms).map(([name, value]) => ({
            name,
            value
        })).sort((a, b) => b.value - a.value);
    }, [report]);
    const questionsData = useMemo(() => {
        const questionsAnalysis = report.questions_analysis || {};
        return participants.map(p => ({
            user: p,
            questions: questionsAnalysis[p]?.total_questions || 0,
        }));
    }, [participants, report]);


    const topicsData = useMemo(() => {
        const topics = report.inferred_topics?.topic_analysis?.detected_topics || {};
        return Object.entries(topics).map(([topic, count]) => ({
            topic: topic.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            count
        }));
    }, [report]);

    const wordAnalysis = useMemo(() => {
        const wordData = report.word_analysis || {};
        const userWordData = wordData.user_word_analysis || {};
        return {
            topWords: wordData.top_50_meaningful_words_overall?.slice(0, 15) || [],
            topBigrams: wordData.top_20_bigrams_overall?.slice(0, 10) || [],
            languageRatio: wordData.language_ratio_overall || {},
            userWords: Object.fromEntries(
                participants.map(p => [p, userWordData[p]?.top_meaningful_words?.slice(0, 10) || []])
            )
        };
    }, [participants, report]);

    const conversationInsights = useMemo(() => {
        const patterns = report.conversation_patterns || {};
        return {
            longestConversations: patterns.longest_conversations?.slice(0, 3) || [],
            intensestConversations: patterns.most_intense_conversations?.slice(0, 3) || [],
            starterCounts: patterns.conversation_starters_counts || {}
        };
    }, [report]);
    const RADIAN = Math.PI / 180;


    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#84cc16', '#f97316'];

    const StatCard = ({ title, value, subtitle, icon: Icon, color = 'indigo' }) => (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className={`text-3xl font-bold text-${color}-600 mt-1`}>{value}</p>
                    {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
                </div>
                <div className={`p-3 bg-${color}-100 rounded-xl`}>
                    <Icon className={`w-6 h-6 text-${color}-600`} />
                </div>
            </div>
        </div>
    );

    const TabButton = ({ id, label, isActive, onClick }) => (
        <button
            onClick={() => onClick(id)}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                isActive
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
            }`}
        >
            {label}
        </button>
    );
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        if (percent < 0.05) return null; // Don't render label for small slices
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        return (
            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12px" fontWeight="bold">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    const datasetInfo = report.dataset_overview || {};
    const relationshipMetrics = report.relationship_metrics || {};
    const ghostPeriods = report.ghost_periods || {};
    const responseMetrics = report.response_metrics || {};
    const emojiAnalysis = report.emoji_analysis || {};

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        Chat Analytics Dashboard
                    </h1>
                    <p className="text-gray-600">
                        Analysis of {(datasetInfo.total_messages || 0).toLocaleString()} messages
                        {datasetInfo.date_range && (
                            <span> from {datasetInfo.date_range.start_date} to {datasetInfo.date_range.end_date}</span>
                        )}
                    </p>
                </div>

                {/* Navigation */}
                <div className="flex justify-center mb-8">
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 border border-gray-200 shadow-lg">
                        <div className="flex space-x-2">
                            <TabButton id="overview" label="Overview" isActive={activeTab === 'overview'} onClick={setActiveTab} />
                            <TabButton id="patterns" label="Patterns" isActive={activeTab === 'patterns'} onClick={setActiveTab} />
                            <TabButton id="behavior" label="Behavior" isActive={activeTab === 'behavior'} onClick={setActiveTab} />
                            <TabButton id="language" label="Language" isActive={activeTab === 'language'} onClick={setActiveTab} />
                            <TabButton id="emotions" label="Emotions" isActive={activeTab === 'emotions'} onClick={setActiveTab} />
                        </div>
                    </div>
                </div>

                {/* Content */}
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        {/* Key Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard
                                title="Total Messages"
                                value={(datasetInfo.total_messages || 0).toLocaleString()}
                                subtitle={`Over ${datasetInfo.date_range?.total_days || 0} days`}
                                icon={MessageCircle}
                                color="indigo"
                            />
                            <StatCard
                                title="Participants"
                                value={participants.length}
                                subtitle={participants.join(', ')}
                                icon={Users}
                                color="green"
                            />
                            <StatCard
                                title="Avg Response Time"
                                value={`${Math.round(relationshipMetrics.overall_avg_response_time_minutes || 0)} min`}
                                subtitle="Overall average"
                                icon={Clock}
                                color="blue"
                            />
                            <StatCard
                                title="Balance Score"
                                value={`${Math.round(relationshipMetrics.balance_score || 0)}%`}
                                subtitle="Communication balance"
                                icon={Heart}
                                color="pink"
                            />
                        </div>

                        {/* Monthly Trend */}
                        {monthlyData.length > 0 && (
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-lg">
                                <h3 className="text-xl font-semibold text-gray-800 mb-4">Message Volume Over Time</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={monthlyData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
                                        <XAxis dataKey="month" stroke="#6b7280"/>
                                        <YAxis stroke="#6b7280"/>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'white',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '12px',
                                                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                                            }}
                                        />
                                        <Area type="monotone" dataKey="messages" stroke="#6366f1" fill="url(#gradient)"
                                              strokeWidth={2}/>
                                        <defs>
                                            <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                            <div
                                className="lg:col-span-3 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-lg">
                                <h3 className="text-xl font-semibold text-gray-800 mb-4">Message Volume Over Time</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={monthlyData} margin={{top: 5, right: 20, left: -10, bottom: 5}}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
                                        <XAxis dataKey="month" stroke="#6b7280"/>
                                        <YAxis stroke="#6b7280"/>
                                        <Tooltip contentStyle={{
                                            backgroundColor: 'white',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '12px'
                                        }}/>
                                        <Area type="monotone" dataKey="messages" stroke="#6366f1" fill="url(#gradient)"
                                              strokeWidth={2}/>
                                        <defs>
                                            <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div
                                className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-lg">
                                <h3 className="text-xl font-semibold text-gray-800 mb-4">Platform Distribution</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie data={platformData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}
                                             labelLine={false} label={renderCustomizedLabel}>
                                            {platformData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>))}
                                        </Pie>
                                        <Tooltip contentStyle={{
                                            backgroundColor: 'white',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '12px'
                                        }}/>
                                        <Legend wrapperStyle={{fontSize: "14px"}}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* User Comparison */}
                        {/* --- REPLACEMENT: USER COMPARISON SPLIT CHARTS --- */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Total Messages Chart */}
                            {userTotalMessagesData.some(d => d.value > 0) && (
                                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-lg">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Total Messages Sent</h3>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={userTotalMessagesData} layout="vertical"
                                                  margin={{top: 5, right: 20, left: 20, bottom: 5}}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
                                            <XAxis type="number" stroke="#6b7280"/>
                                            <YAxis type="category" dataKey="name" stroke="#6b7280" width={80} interval={0}/>
                                            <Tooltip contentStyle={{
                                                backgroundColor: 'white',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '12px'
                                            }} cursor={{fill: 'rgba(99, 102, 241, 0.1)'}}/>
                                            <Bar dataKey="value" name="Total Messages" radius={[0, 8, 8, 0]}>
                                                {userTotalMessagesData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {/* Average Message Length Chart */}
                            {userAvgLengthData.some(d => d.value > 0) && (
                                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-lg">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Avg. Message Length (chars)</h3>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={userAvgLengthData} layout="vertical"
                                                  margin={{top: 5, right: 20, left: 20, bottom: 5}}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
                                            <XAxis type="number" stroke="#6b7280"/>
                                            <YAxis type="category" dataKey="name" stroke="#6b7280" width={80} interval={0}/>
                                            <Tooltip contentStyle={{
                                                backgroundColor: 'white',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '12px'
                                            }} cursor={{fill: 'rgba(236, 72, 153, 0.1)'}}/>
                                            <Bar dataKey="value" name="Avg Length" radius={[0, 8, 8, 0]}>
                                                {userAvgLengthData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]}/>
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                        {/* --- END REPLACEMENT --- */}


                        {/* Questions Asked - Separate Chart */}
                        {questionsData.some(d => d.questions > 0) && (
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-lg">
                                <h3 className="text-xl font-semibold text-gray-800 mb-4">Questions Asked</h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={questionsData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
                                        <XAxis dataKey="user" stroke="#6b7280"/>
                                        <YAxis stroke="#6b7280"/>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'white',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '12px',
                                                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                                            }}
                                        />
                                        <Bar dataKey="questions" fill="#ec4899" radius={8}/>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'patterns' && (
                    <div className="space-y-8">
                        {/* Hourly Pattern */}
                        {hourlyData.length > 0 && (
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-lg">
                                <h3 className="text-xl font-semibold text-gray-800 mb-4">Daily Activity Pattern</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={hourlyData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
                                        <XAxis dataKey="hour" stroke="#6b7280"/>
                                        <YAxis stroke="#6b7280"/>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'white',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '12px',
                                                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                                            }}
                                        />
                                        <Line type="monotone" dataKey="messages" stroke="#6366f1" strokeWidth={3}
                                              dot={{fill: '#6366f1', strokeWidth: 2, r: 4}}/>
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Daily Distribution */}
                        {dailyData.length > 0 && (
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-lg">
                                <h3 className="text-xl font-semibold text-gray-800 mb-4">Weekly Pattern</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={dailyData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
                                        <XAxis dataKey="day" stroke="#6b7280"/>
                                        <YAxis stroke="#6b7280"/>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'white',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '12px',
                                                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                                            }}
                                        />
                                        <Bar dataKey="messages" fill="#8b5cf6" radius={8} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Ghost Periods */}
                        {ghostPeriods.total_ghost_periods > 0 && (
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-lg">
                                <h3 className="text-xl font-semibold text-gray-800 mb-4">Communication Gaps</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="text-center p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl">
                                        <p className="text-sm text-gray-600">Longest Gap</p>
                                        <p className="text-2xl font-bold text-red-600">{Math.round((ghostPeriods.longest_ghost_hours || 0) / 24)} days</p>
                                    </div>
                                    <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                                        <p className="text-sm text-gray-600">Average Gap</p>
                                        <p className="text-2xl font-bold text-blue-600">{Math.round(ghostPeriods.avg_ghost_duration_hours || 0)} hours</p>
                                    </div>
                                    <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                                        <p className="text-sm text-gray-600">Total Gaps</p>
                                        <p className="text-2xl font-bold text-green-600">{ghostPeriods.total_ghost_periods || 0}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'behavior' && (
                    <div className="space-y-8">
                        {/* Topics */}
                        {topicsData.length > 0 && (
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-lg">
                                <h3 className="text-xl font-semibold text-gray-800 mb-4">Discussion Topics</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={topicsData}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="count"
                                            label={({ topic, percent }) => `${topic} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {topicsData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Conversation Insights */}
                        {conversationInsights.longestConversations.length > 0 && (
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-lg">
                                <h3 className="text-xl font-semibold text-gray-800 mb-4">Conversation Insights</h3>
                                <div className="space-y-4">
                                    <h4 className="text-lg font-medium text-gray-700">Longest Conversations</h4>
                                    {conversationInsights.longestConversations.slice(0, 3).map((conv, index) => (
                                        <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-600 mb-1">Started with: "{conv.starter_message?.substring(0, 50)}..."</p>
                                                    <p className="text-sm text-gray-600">Ended with: "{conv.ender_message?.substring(0, 50)}..."</p>
                                                </div>
                                                <div className="text-right ml-4">
                                                    <p className="text-lg font-bold text-blue-600">{conv.total_messages} messages</p>
                                                    <p className="text-sm text-gray-500">{Math.round(conv.duration_minutes)} min</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Response Times */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {participants.map((participant) => {
                                const otherParticipant = participants.find(p => p !== participant);
                                const responseKey = `${participant}_to_${otherParticipant}`;
                                const metrics = responseMetrics[responseKey] || {};

                                return (
                                    <div key={participant} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-lg">
                                        <h4 className="text-lg font-semibold text-gray-800 mb-4">{participant}'s Response Stats</h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Avg Response Time</span>
                                                <span className="font-semibold">{Math.round(metrics.avg_response_time_minutes || 0)} min</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Quick Responses (&lt;1min)</span>
                                                <span className="font-semibold">{(metrics.quick_responses_under_1min || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Slow Responses (&gt;1hr)</span>
                                                <span className="font-semibold">{(metrics.slow_responses_over_1hr || 0).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {activeTab === 'language' && (
                    <div className="space-y-8">
                        {/* Language Distribution */}
                        {wordAnalysis.languageRatio && Object.keys(wordAnalysis.languageRatio).length > 0 && (
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-lg">
                                <h3 className="text-xl font-semibold text-gray-800 mb-4">Language Distribution</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {Object.entries(wordAnalysis.languageRatio).map(([lang, percentage]) => (
                                        <div key={lang} className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                                            <p className="text-sm text-gray-600 capitalize">{lang.replace('_percentage', '')}</p>
                                            <p className="text-2xl font-bold text-green-600">{Math.round(percentage)}%</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Top Words */}
                        {wordAnalysis.topWords.length > 0 && (
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-lg">
                                <h3 className="text-xl font-semibold text-gray-800 mb-4">Most Used Words</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                    {wordAnalysis.topWords.map((word, index) => (
                                        <div key={index} className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg text-center">
                                            <p className="font-semibold text-purple-700">{word[0]}</p>
                                            <p className="text-sm text-gray-600">{word[1]} times</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Top Phrases */}
                        {wordAnalysis.topBigrams.length > 0 && (
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-lg">
                                <h3 className="text-xl font-semibold text-gray-800 mb-4">Popular Phrases</h3>
                                <div className="space-y-2">
                                    {wordAnalysis.topBigrams.map((phrase, index) => (
                                        <div key={index} className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                                            <span className="font-medium text-blue-800">"{phrase.phrase}"</span>
                                            <span className="text-blue-600 font-semibold">{phrase.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* User Word Analysis */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {participants.map((participant) => {
                                const userWords = wordAnalysis.userWords[participant] || [];
                                return (
                                    <div key={participant} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-lg">
                                        <h4 className="text-lg font-semibold text-gray-800 mb-4">{participant}'s Top Words</h4>
                                        <div className="space-y-2">
                                            {userWords.slice(0, 8).map((word, index) => (
                                                <div key={index} className="flex items-center justify-between p-2 bg-indigo-50 rounded-lg">
                                                    <div className="flex items-center space-x-3">
                                                        <span className="text-gray-700 font-medium">{word[0]}</span>
                                                        <span className="text-gray-500">#{index + 1}</span>
                                                    </div>
                                                    <span className="font-semibold text-indigo-600">{word[1]}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {activeTab === 'emotions' && (
                    <div className="space-y-8">
                        {/* Top Emojis */}
                        {emojiData.length > 0 && (
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-lg">
                                <h3 className="text-xl font-semibold text-gray-800 mb-4">Most Used Emojis</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={emojiData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis dataKey="emoji" stroke="#6b7280" />
                                        <YAxis stroke="#6b7280" />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'white',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '12px',
                                                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                                            }}
                                        />
                                        <Bar dataKey="count" fill="#f59e0b" radius={8} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Emoji Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard
                                title="Total Emojis Used"
                                value={(emojiAnalysis.total_emojis_used_overall || 0).toLocaleString()}
                                subtitle={`${(emojiAnalysis.emoji_usage_rate_overall_percent || 0).toFixed(1)}% of messages`}
                                icon={Smile}
                                color="yellow"
                            />
                            <StatCard
                                title="Unique Emojis"
                                value={emojiAnalysis.unique_emojis_overall || 0}
                                subtitle="Different expressions"
                                icon={Zap}
                                color="purple"
                            />
                            <StatCard
                                title="Most Popular"
                                value={emojiAnalysis.top_20_emojis_overall?.[0]?.emoji || '😊'}
                                subtitle={`Used ${emojiAnalysis.top_20_emojis_overall?.[0]?.count || 0} times`}
                                icon={TrendingUp}
                                color="green"
                            />
                        </div>

                        {/* User Emoji Comparison */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {participants.map((participant) => {
                                const userEmojiStats = emojiAnalysis.user_emoji_analysis?.[participant] || {};
                                const topEmojis = userEmojiStats.top_10_emojis || [];

                                return (
                                    <div key={participant} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-lg">
                                        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            <Smile className="w-5 h-5 mr-2 text-yellow-600" />
                                            {participant}'s Emoji Usage
                                        </h4>
                                        <div className="space-y-3 mb-4">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-600">Total Emojis Used</span>
                                                <span className="font-bold text-gray-800">{(userEmojiStats.total_emojis_used || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-600">Emoji Usage Rate</span>
                                                <span className="font-bold text-gray-800">{`${(userEmojiStats.emoji_usage_rate_percent || 0).toFixed(1)}%`}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-600">Favorite Emoji</span>
                                                <span className="font-bold text-2xl">{topEmojis[0]?.emoji || 'N/A'}</span>
                                            </div>
                                        </div>

                                        <h5 className="text-md font-semibold text-gray-700 mt-6 mb-3">Top 5 Emojis</h5>
                                        <div className="space-y-2">
                                            {topEmojis.slice(0, 5).map((emoji, index) => (
                                                <div key={index} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                                                    <div className="flex items-center space-x-3">
                                                        <span className="text-xl">{emoji.emoji}</span>
                                                        <span className="text-gray-500 font-mono">#{index + 1}</span>
                                                    </div>
                                                    <span className="font-semibold text-yellow-700">{emoji.count} uses</span>
                                                </div>
                                            ))}
                                            {topEmojis.length === 0 && (
                                                <p className="text-sm text-gray-500 text-center py-4">No emoji data available.</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;