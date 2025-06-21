'use client';

import React from 'react';
import { AnalysisResult, Conversation, Question } from '@/types/analysis';
import { Card } from '../layout/Card';
import { InfoPopup } from '../layout/InfoPopup';
import { formatDateTime } from '@/utils/formatDate';
import { ConversationTooltip } from "@/components/Dashboard/shared/ConversationTooltip";
import { GhostingTooltip } from "@/components/Dashboard/shared/GhostingTooltip";
import {StreakCard} from "@/components/Dashboard/shared/StreakCard";

interface ConvosTonesTabProps {
    result: AnalysisResult;
    user1Name: string;
    user2Name: string;
}

export const ConvosTonesTab: React.FC<ConvosTonesTabProps> = ({ result, user1Name, user2Name }) => {
    const UserQuestions = ({ userName, color }: { userName: string, color: string }) => {
        const userData = result.question_analysis?.user_question_analysis?.[userName];
        if (!userData || !userData.latest_5_questions) return null;

        return (
            <div>
                <h4 className="font-bold text-lg mb-2 text-center" style={{ color }}>{userName}</h4>
                <p className="text-center text-sm text-gray-400 mb-4">Asked {userData.total_questions?.toLocaleString()} questions</p>
                <div className="space-y-3">
                    {userData.latest_5_questions.slice(0,3).map((q: Question, i) => (
                        <div key={i} className="bg-gray-800/60 p-3 rounded-lg text-sm">
                            <p className="italic">"{q.question_text}"</p>
                            <p className="text-xs text-gray-400 mt-2 text-right">{formatDateTime(q.datetime)}</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    };
    const ConversationTable = ({ title, data, info }: { title: string, data?: Conversation[], info: string }) => {
        if (!data || data.length === 0) return <Card><h3 className="text-lg font-semibold text-gray-200">{title}</h3><p className="text-gray-400 mt-2">No data available.</p></Card>;
        return (
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-200">{title}</h3>
                    <InfoPopup text={info} />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-gray-700/50">
                        <tr>
                            <th className="px-4 py-3">Intensity</th>
                            <th className="px-4 py-3"># Msgs</th>
                            <th className="px-4 py-3">Duration (m)</th>
                            <th className="px-4 py-3">Start Time</th>
                        </tr>
                        </thead>
                        <tbody>
                        {data.slice(0, 5).map(c => (
                            <tr key={c.id} className="border-b border-gray-700 hover:bg-gray-700/50 group relative">
                                <td className="px-4 py-3 font-medium text-white">{c.intensity_score?.toFixed(2)}</td>
                                <td className="px-4 py-3">{c.message_count}</td>
                                <td className="px-4 py-3">{c.duration_minutes?.toFixed(1)}</td>
                                <td className="px-4 py-3">{formatDateTime(c.start_time)}</td>
                                <td className="absolute hidden group-hover:block -top-8 right-0 z-20">
                                    <ConversationTooltip messages={c.sample_messages || []} user1={user1Name} user2={user2Name} />
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        );
    };

    return (
        <div className="space-y-6">
            <ConversationTable title="Most Intense Conversations" data={result.conversation_patterns?.most_intense_conversations} info="Conversations ranked by an intensity score, considering message frequency and turn-taking speed."/>
            <ConversationTable title="Longest Conversations (by Duration)" data={result.conversation_patterns?.longest_conversations_by_duration} info="Conversations that lasted the longest in minutes."/>
            <ConversationTable title="Longest Conversations (by Messages)" data={result.conversation_patterns?.longest_conversations_by_messages} info="Conversations with the highest number of messages exchanged."/>

            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-200">Top Chatting Streaks</h3>
                    <InfoPopup text="Highlights the longest periods of consecutive daily messaging." />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {result.unbroken_streaks?.top_streaks?.map((streak, index) => (
                        <StreakCard key={index} streak={streak} />
                    ))}
                </div>
            </Card>

            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-200">Ghosting Insights</h3>
                    <InfoPopup text="Identifies periods of silence longer than a predefined threshold (e.g., 24 hours) and who eventually broke the silence." />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div><p className="text-2xl font-bold">{result.ghost_periods?.total_ghost_periods || 'N/A'}</p><p className="text-sm text-gray-400">Total Ghost Periods</p></div>
                    <div><p className="text-2xl font-bold">{result.ghost_periods?.average_ghost_duration_hours?.toFixed(1) || 'N/A'} hrs</p><p className="text-sm text-gray-400">Avg. Silence</p></div>
                    <div><p className="text-2xl font-bold">{result.ghost_periods?.longest_ghost_period_hours?.toFixed(1) || 'N/A'} hrs</p><p className="text-sm text-gray-400">Longest Silence</p></div>
                    <div><p className="text-2xl font-bold">{result.ghost_periods?.who_breaks_silence_most?.[0]?.user || 'N/A'}</p><p className="text-sm text-gray-400">Usually Breaks Silence</p></div>
                </div>
                {result.ghost_periods?.top_ghost_periods && result.ghost_periods.top_ghost_periods.length > 0 &&
                    <div className="mt-6">
                        <h4 className="font-semibold text-gray-300 mb-2">Ghosting Log:</h4>
                        <div className="max-h-80 overflow-y-auto pr-2">
                            <ul className="space-y-2 text-sm">
                                {result.ghost_periods.top_ghost_periods.map((p,i) => (
                                    <li key={i} className="bg-gray-700/50 p-3 rounded-lg hover:bg-gray-700 transition-colors group relative">
                                        <p><strong>{p.duration_hours.toFixed(1)} hours</strong> of silence, broken by <strong>{p.who_broke_silence}</strong></p>
                                        <p className="text-xs text-gray-400 mt-1">Ended on {formatDateTime(p.end_time)}</p>
                                        <div className="absolute hidden group-hover:block -top-4 right-0 z-20">
                                            <GhostingTooltip period={p} />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                }
            </Card>
                        <Card>
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-100">Question Analysis</h2>
                    <InfoPopup text="A look at who asks more questions and some recent examples from the conversation." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <UserQuestions userName={user1Name} color="#3b82f6" />
                    <UserQuestions userName={user2Name} color="#8b5cf6" />
                </div>
            </Card>
        </div>
    );
};
