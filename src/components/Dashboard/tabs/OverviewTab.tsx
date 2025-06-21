'use client';

import React from 'react';
// Recharts imports for other charts
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, Bar } from 'recharts';

// --- Import our new custom-built component ---
import { Treemap } from '@/components/Dashboard/shared/Treemap';

import { AnalysisResult } from '@/types/analysis';
import { formatDate } from '@/utils/formatDate';
import { ContributionsCalendar } from "@/components/Dashboard/shared/ContributionsCalendar";
import { CustomTooltip } from "@/components/Dashboard/shared/CustomTooltip";
import { StatCard } from '../layout/StatCard';
import { Card } from '../layout/Card';
import { InfoPopup } from '../layout/InfoPopup';

interface OverviewTabProps {
    result: AnalysisResult;
    processedData: any;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ result, processedData }) => {
    const starterCounts = result.icebreaker_analysis?.conversation_starter_counts || [];
    const starterLeader = starterCounts.length > 0 ? starterCounts.reduce((prev, current) => (prev.count > current.count ? prev : current)) : { user: 'N/A', count: 0 };

    const initialYear = processedData?.contributionData.length > 0
        ? new Date(processedData.contributionData[0].date + 'T00:00:00Z').getUTCFullYear().toString()
        : new Date().getFullYear().toString();
    const dailyAvgMessages = result.relationship_metrics?.underlying_metrics?.daily_average_messages;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                className="col-span-1"
                title="Total Messages"
                value={result.dataset_overview?.total_messages?.toLocaleString() || 'N/A'}
                subValue={dailyAvgMessages ? `~${dailyAvgMessages.toFixed(0)} msgs/day` : `${result.dataset_overview?.total_reactions?.toLocaleString() || 0} reactions`}
                icon="💬"
            />
            <StatCard
                className="col-span-1"
                title="Chatting For"
                value={`${result.dataset_overview?.date_range.total_days || 0} Days`}
                subValue={`Since ${formatDate(result.dataset_overview?.date_range.start_date)}`}
                icon="🗓️"
            />
            <StatCard
                className="col-span-1"
                title="Longest Streak"
                value={`${result.unbroken_streaks?.top_streaks?.[0]?.length_days || 0} Days`}
                subValue={`${result.unbroken_streaks?.total_active_days || 0} total active days`}
                icon="🔥"
            />
            <StatCard
                className="col-span-1"
                title="Relationship Score"
                value={`${result.relationship_metrics?.relationship_score?.toFixed(1) || 'N/A'}/100`}
                subValue={`Intensity: ${result.relationship_metrics?.relationship_intensity || 'N/A'}`}
                icon="❤️‍🔥"
            />

            <div className="col-span-full">
                <ContributionsCalendar data={processedData.contributionData} initialYear={initialYear} />
            </div>

            <div className="col-span-full grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-200">Hourly Activity (Total)</h3>
                        <InfoPopup text="Shows the total number of messages sent by all participants for each hour of the day." />
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={processedData.totalHourlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568"/>
                            <XAxis dataKey="hour" stroke="#9ca3af" fontSize={10} tick={{fill: '#e5e7eb'}}/>
                            <YAxis stroke="#9ca3af" fontSize={12} tick={{fill: '#e5e7eb'}}/>
                            <RechartsTooltip content={<CustomTooltip/>}/>
                            <Legend wrapperStyle={{fontSize: '14px'}}/>
                            <Bar dataKey={'Total Messages'} fill="#8884d8" radius={[4, 4, 0, 0]}/>
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-200">Weekly Activity (Total)</h3>
                        <InfoPopup text="Shows the total number of messages sent by all participants for each day of the week." />
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={processedData.weeklyActivityData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568"/>
                            <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} tick={{fill: '#e5e7eb'}}/>
                            <YAxis stroke="#9ca3af" fontSize={12} tick={{fill: '#e5e7eb'}}/>
                            <RechartsTooltip content={<CustomTooltip/>}/>
                            <Legend wrapperStyle={{fontSize: '14px'}}/>
                            <Bar dataKey="Messages" fill="#22c55e" radius={[4, 4, 0, 0]}/>
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            </div>

            <div className="col-span-full grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* --- PLATFORM CARD USING OUR CUSTOM TREEMAP --- */}
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-200">Platform Distribution</h3>
                        <InfoPopup text="Shows the breakdown of messages across different chat platforms. Hover for details." />
                    </div>
                    {/* The ResponsiveContainer provides the width/height to the CustomTreemap */}
                    <ResponsiveContainer width="100%" height={250}>
                        <Treemap data={processedData.platformData} />
                    </ResponsiveContainer>
                </Card>

                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-200">Top Topics</h3>
                        <InfoPopup text="Shows the most common topics of conversation identified in the chat." />
                    </div>
                    <div className="space-y-3 pr-4 overflow-y-auto" style={{maxHeight: '250px'}}>
                        {processedData.topTopics.map((topic, index) => (
                            <div key={index}>
                                <div className="flex justify-between items-center text-sm text-gray-300 mb-1">
                                    <span className="truncate" title={topic.words}>{topic.words}</span>
                                    <span className="font-semibold">{topic.percentage.toFixed(2)}%</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${topic.percentage}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard title="First Message" value={`"${result.first_last_messages?.first_message?.message || 'N/A'}"`} subValue={`by ${result.first_last_messages?.first_message?.sender || 'N/A'} on ${formatDate(result.first_last_messages?.first_message?.datetime)}`} icon="🌅" />
                <StatCard title="Last Message" value={`"${result.first_last_messages?.last_message?.message || 'N/A'}"`} subValue={`by ${result.first_last_messages?.last_message?.sender || 'N/A'} on ${formatDate(result.first_last_messages?.last_message?.datetime)}`} icon="🌃" />
            </div>
        </div>
    );
};
