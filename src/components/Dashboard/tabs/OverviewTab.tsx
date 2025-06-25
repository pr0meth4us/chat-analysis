'use client';

import React, { useState } from 'react';
import { ResponsiveContainer } from 'recharts';
import { AnalysisResult } from '@/types/analysis';
import { formatDate } from '@/utils/formatDate';
import { ContributionsCalendar } from "@/components/Dashboard/shared/ContributionsCalendar";
import { StatCard } from '../layout/StatCard';
import { Card } from '../layout/Card';
import { InfoPopup } from '../layout/InfoPopup';
import { Info } from 'lucide-react';
import { ProfileBreakdownModal } from '../shared/ProfileBreakdownModal';
import {Treemap} from "@/components/Dashboard/shared/Treemap";

interface OverviewTabProps {
    result: AnalysisResult;
    processedData: any;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ result, processedData }) => {
    const metadata = result?.metadata || {};
    const dailyAvgMessages = result.relationship_metrics?.underlying_metrics?.daily_average_messages;
    const totalFilteredMessages = metadata.filtered_messages || result.dataset_overview?.total_messages || 0;
    const initialYear = processedData?.contributionData?.length > 0 ? new Date(processedData.contributionData[0].date + 'T00:00:00Z').getUTCFullYear().toString() : new Date().getFullYear().toString();

    // NEW: State to control the modal's visibility
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                className="col-span-1"
                title="Total Messages"
                value={totalFilteredMessages.toLocaleString()}
                subValue={dailyAvgMessages ? `~${dailyAvgMessages.toFixed(0)} msgs/day` : `${result.dataset_overview?.total_reactions?.toLocaleString() || 0} reactions`}
                icon="💬"
                info={
                    <button onClick={() => setIsModalOpen(true)} className="text-gray-500 hover:text-white transition-colors">
                        <Info className="h-4 w-4" />
                    </button>
                }
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
                <ContributionsCalendar data={processedData.contributionData || []} initialYear={initialYear} />
            </div>


            <div className="col-span-full grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-200">Platform Distribution</h3>
                        <InfoPopup
                            text="Shows the breakdown of messages across different chat platforms. Hover for details."/>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                        {/* @ts-ignore */}
                        <Treemap data={processedData.platformData || []}/>
                    </ResponsiveContainer>
                </Card>

                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-200">Top Topics</h3>
                        <InfoPopup text="Shows the most common topics of conversation identified in the chat."/>
                    </div>
                    <div className="space-y-3 pr-4 overflow-y-auto" style={{maxHeight: '250px'}}>
                        {(processedData.topTopics || []).map((topic: {
                            words: string;
                            percentage: number
                        }, index: number) => (
                            <div key={index}>
                                <div className="flex justify-between items-center text-sm text-gray-300 mb-1">
                                    <span className="truncate" title={topic.words}>{topic.words}</span>
                                    <span className="font-semibold">{topic.percentage.toFixed(2)}%</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div className="bg-blue-500 h-2 rounded-full"
                                         style={{width: `${topic.percentage}%`}}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard title="First Message"
                          value={`"${result.first_last_messages?.first_message?.message || 'N/A'}"`}
                          subValue={`by ${result.first_last_messages?.first_message?.sender || 'N/A'} on ${formatDate(result.first_last_messages?.first_message?.datetime)}`}
                          icon="🌅"/>
                <StatCard title="Last Message" value={`"${result.first_last_messages?.last_message?.message || 'N/A'}"`}
                          subValue={`by ${result.first_last_messages?.last_message?.sender || 'N/A'} on ${formatDate(result.first_last_messages?.last_message?.datetime)}`}
                          icon="🌃"/>
            </div>
            <ProfileBreakdownModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                participants={metadata.participants || {}}
            />
        </div>
    );
};
