'use client';

import React, { ReactNode } from 'react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, PieChart, Pie, Cell } from 'recharts';
import { AnalysisResult } from '@/types/analysis';
import { Card } from '../layout/Card';
import { Icons } from "@/components/Dashboard/shared/Icons";
import { NgramTable } from "@/components/Dashboard/shared/NgramTable";
import { CustomTooltip } from "@/components/Dashboard/shared/CustomTooltip";
import { InfoPopup } from '../layout/InfoPopup';

interface BehaviorContentTabProps {
    result: AnalysisResult;
    processedData: any;
}

export const BehaviorContentTab: React.FC<BehaviorContentTabProps> = ({ result, processedData }) => {
    const { user1Name, user2Name } = processedData;

    const UserCard = ({ userName, userColor }: { userName: string; userColor: string }) => {
        const userBehavior = result.user_behavior?.[userName];
        const wordAnalysis = result.word_analysis?.user_word_analysis?.[userName];
        const emojiAnalysis = result.emoji_analysis?.user_emoji_analysis?.[userName];
        const qAnalysis = result.question_analysis?.user_question_analysis?.[userName];

        if (!userBehavior || !wordAnalysis || !emojiAnalysis || !qAnalysis) return <Card className={`border-t-4 ${userColor}`}><h3 className="text-xl font-bold mb-4 text-center">{userName}</h3><p>Data not available.</p></Card>;

        const StatLine = ({ icon, label, value }: { icon: ReactNode, label: string, value: string | number }) => (
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3 text-gray-300">
                    {icon}
                    <span>{label}</span>
                </div>
                <span className="font-semibold text-white">{value}</span>
            </div>
        );

        return (
            <Card className={`border-t-4 ${userColor} flex flex-col space-y-5 p-5`}>
                <h3 className="text-xl font-bold text-center text-white">{userName}</h3>
                <div className="space-y-3">
                    <StatLine icon={<Icons.Messages/>} label="Total Messages" value={userBehavior.message_counts?.total_messages?.toLocaleString()}/>
                    <StatLine icon={<Icons.Words/>} label="Avg. Words / Msg" value={userBehavior.message_stats.avg_message_length_words.toFixed(1)}/>
                    <StatLine icon={<Icons.Questions/>} label="Questions Asked" value={qAnalysis.total_questions?.toLocaleString()}/>
                    <StatLine icon={<Icons.Emoji/>} label="Emojis Sent" value={emojiAnalysis.total_emojis_sent?.toLocaleString()}/>
                </div>
                <div className="pt-2">
                    <h4 className="font-semibold text-gray-300 text-sm mb-2">Top 5 Words:</h4>
                    <div className="flex flex-wrap gap-2">
                        {wordAnalysis.top_20_words?.slice(0, 5).map(w =>
                            <span key={w.word} className="bg-gray-700/80 text-gray-300 text-xs font-medium px-2.5 py-1 rounded-full">{w.word}</span>
                        )}
                    </div>
                </div>
                <div className="pt-2">
                    <h4 className="font-semibold text-gray-300 text-sm mb-2">Top 5 Emojis:</h4>
                    <div className="flex items-center gap-4 text-3xl">
                        {emojiAnalysis.top_10_emojis?.slice(0, 5).map(e =>
                            <span key={e.emoji} title={`${e.emoji} (used ${e.count} times)`}>{e.emoji}</span>
                        )}
                    </div>
                </div>
            </Card>
        );
    };

    return (
        <div className="space-y-6">
            {/* User Cards remain the same */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <UserCard userName={user1Name} userColor="border-blue-500" />
                <UserCard userName={user2Name} userColor="border-purple-500" />
            </div>

            {/* --- REDESIGNED BALANCED GRID WITH INFOPOPUPS --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-200">Message Volume Trends</h3>
                        <InfoPopup text="Shows the total number of messages sent per month over the dataset's duration." />
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={processedData.monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                            <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                            <YAxis stroke="#9ca3af" fontSize={12} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{fontSize: '14px'}}/>
                            <Line type="monotone" dataKey="messages" stroke="#82ca9d" name="Monthly Messages" dot={false} strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>

                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-200">Sentiment Distribution</h3>
                        <InfoPopup text="The overall breakdown of messages into Positive, Negative, and Neutral categories." />
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={processedData.sentimentDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} label>
                                {processedData.sentimentDistribution.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={{ Positive: '#22c55e', Negative: '#ef4444', Neutral: '#6b7280' }[entry.name]} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{fontSize: '14px'}}/>
                        </PieChart>
                    </ResponsiveContainer>
                </Card>

                <Card>
                    <InfoPopup text="The most common two-word phrases found in the chat." className="absolute top-4 right-4" />
                    <NgramTable title="Top Bigrams" data={result.word_analysis?.top_20_bigrams} />
                </Card>
                <Card>
                    <InfoPopup text="The most common three-word phrases found in the chat." className="absolute top-4 right-4" />
                    <NgramTable title="Top Trigrams" data={result.word_analysis?.top_20_trigrams} />
                </Card>
            </div>
        </div>
    );
};
