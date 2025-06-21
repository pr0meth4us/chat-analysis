'use client';

import React from 'react';
import { ResponsiveContainer, RadialBarChart, PolarGrid, RadialBar, Cell, Legend, Tooltip, RadarChart, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { AnalysisResult, ToneAnalysis, Message } from '@/types/analysis';
import { Card } from '../layout/Card';
import { InfoPopup } from '../layout/InfoPopup';
import { CustomTooltip } from "@/components/Dashboard/shared/CustomTooltip";


interface RelationshipDNATabProps {
    result: AnalysisResult;
    processedData: any;
}

export const RelationshipDNATab: React.FC<RelationshipDNATabProps> = ({ result, processedData }) => {
    const { user1Name, user2Name, responseMetrics, relationshipScores } = processedData;

    const ToneCard = ({ title, icon, data, color }: { title: string, icon: string, data?: ToneAnalysis, color: string }) => {
        if(!data || data.total_matching_messages === 0) return null;

        const intensity = data.romance_intensity_percent ?? data.sadness_intensity_percent ?? data.argument_intensity_percent ?? data.sexual_content_intensity_percent ?? data.happy_content_intensity_percent ?? 0;

        const Excerpt = ({ msg }: { msg?: { sender: string, message: string }}) => {
            if (!msg) return null;
            return (
                <div className="bg-gray-900/70 p-3 rounded-lg border-l-2" style={{borderColor: color}}>
                    <p className="text-sm text-gray-300 italic">"{msg.message}"</p>
                    <p className={`text-xs text-right mt-2 font-semibold`} style={{color: color}}>- {msg.sender}</p>
                </div>
            )
        }

        return (
            <Card className="flex-1 min-w-[300px] flex flex-col">
                <h3 className={`text-lg font-semibold mb-3 flex items-center gap-2`}><span style={{color}}>{icon}</span> {title} Analysis</h3>
                <div className="space-y-4 flex-grow">
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <p className="text-gray-400">Intensity:</p> <p className="text-right font-bold">{intensity.toFixed(1)}%</p>
                        <p className="text-gray-400">Total Messages:</p> <p className="text-right">{data.total_matching_messages?.toLocaleString()}</p>
                        <p className="text-gray-400">Top Sender:</p> <p className="text-right">{data.top_senders?.[0]?.user || 'N/A'} ({data.top_senders?.[0]?.count || 0})</p>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-semibold text-gray-300 text-sm">Most Used Words:</h4>
                        <div className="flex flex-wrap gap-2">
                            {data.most_used_words?.slice(0,5).map(w =>
                                <div key={w.word} className="bg-gray-700/80 text-gray-300 text-xs font-medium px-2.5 py-1 rounded-full">{w.word} <span className="text-gray-400">({w.count})</span></div>
                            )}
                        </div>
                    </div>
                    <div className="mt-4 space-y-2">
                        <h4 className="font-semibold text-gray-300 text-sm">Example Messages:</h4>
                        <Excerpt msg={data.top_messages?.[0]} />
                        <Excerpt msg={data.top_messages?.[1]} />
                    </div>
                </div>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-200">Relationship Score DNA</h3>
                        <InfoPopup text="A composite score based on communication balance, consistency, responsiveness, and engagement." />
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" barSize={12} data={relationshipScores} startAngle={90} endAngle={-270}>
                            <PolarGrid gridType="polygons" polarRadius={[20, 40, 60, 80]} stroke="rgba(255,255,255,0.1)" />
                            <RadialBar minAngle={15} background clockWise dataKey="value" cornerRadius={10}>
                                {relationshipScores.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                            </RadialBar>
                            <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '14px' }} />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                        </RadialBarChart>
                    </ResponsiveContainer>
                </Card>
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-200">Response Dynamics</h3>
                        <InfoPopup text="Compares key response time metrics between users, measured in minutes." />
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={responseMetrics}>
                            <PolarGrid stroke="#4a5568" />
                            <PolarAngleAxis dataKey="subject" stroke="#9ca3af" fontSize={14} tick={{fill: '#e5e7eb'}}/>
                            <PolarRadiusAxis angle={30} domain={[0, 'auto']} stroke="none" axisLine={false} tick={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Radar name={user1Name} dataKey={user1Name} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                            <Radar name={user2Name} dataKey={user2Name} stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                            <Legend wrapperStyle={{fontSize: '14px'}}/>
                        </RadarChart>
                    </ResponsiveContainer>
                </Card>
            </div>

            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-100">Keyword-Based Tone Analysis</h2>
                    <InfoPopup text="This analysis identifies messages containing specific keywords related to each tone. It provides a high-level overview but may not capture all nuanced expressions." />
                </div>
                <div className="flex flex-wrap gap-6 justify-center">
                    <ToneCard title="Happy" icon="😊" data={result.happy_tone_analysis} color="#facc15" />
                    <ToneCard title="Romantic" icon="💖" data={result.romance_tone_analysis} color="#f472b6" />
                    <ToneCard title="Argument" icon="⚖️" data={result.argument_analysis} color="#fb923c" />
                    <ToneCard title="Sad" icon="💧" data={result.sad_tone_analysis} color="#60a5fa" />
                    <ToneCard title="Sexual Tone" icon="🌶️" data={result.sexual_tone_analysis} color="#ef4444" />
                </div>
            </Card>

        </div>
    );
};
