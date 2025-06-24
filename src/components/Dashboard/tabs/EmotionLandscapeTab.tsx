'use client';

import React from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { AnalysisResult } from '@/types/analysis';
import { Card } from '../layout/Card';
import { InfoPopup } from '../layout/InfoPopup';
import { CustomTooltip } from "@/components/Dashboard/shared/CustomTooltip";
import { formatDate } from "@/utils/formatDate";

interface EmotionLandscapeTabProps {
    result: AnalysisResult;
    processedData: any;
}

// EmotionRadar component remains the same
const EmotionRadar = ({ data, title }: { data: any[], title: string }) => (
    <Card>
        <h3 className="text-lg font-semibold mb-4 text-gray-200 text-center">{title}</h3>
        <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                <PolarGrid stroke="#4a5568" />
                <PolarAngleAxis dataKey="emotion" stroke="#9ca3af" fontSize={12} tick={{ fill: '#e5e7eb' }} />
                <PolarRadiusAxis angle={30} domain={[0, 1]} tick={false} axisLine={false} />
                <Radar name="Score" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Tooltip content={<CustomTooltip />} />
            </RadarChart>
        </ResponsiveContainer>
    </Card>
);

// EmotionMessages component remains the same
const EmotionMessages = ({ emotion, messages }: { emotion: string, messages: { message: string, sender: string, score: number, datetime: string }[] }) => (
    <div>
        <h4 className="font-bold text-xl capitalize text-center mb-4 text-blue-300">{emotion}</h4>
        <div className="space-y-3 pr-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {messages?.map((msg, i) => (
                <div key={i} className="bg-gray-800/60 p-3 rounded-lg text-sm">
                    <p className="italic">"{msg.message}"</p>
                    <p className="text-xs text-gray-400 mt-2 text-right">
                        - {msg.sender} on {formatDate(msg.datetime)} (Score: {msg.score.toFixed(3)})
                    </p>
                </div>
            ))}
        </div>
    </div>
);


export const EmotionLandscapeTab: React.FC<EmotionLandscapeTabProps> = ({ result, processedData }) => {
    const { user1Name, user2Name, emotionSummary, user1Emotion, user2Emotion } = processedData;

    // --- CHANGED: Prepare the list of emotions to display dynamically ---
    const topEmotionsData = result.emotion_analysis?.top_messages_per_emotion || {};
    const emotionsToShow = Object.keys(topEmotionsData);

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-100">Emotion Landscape</h2>
                    <InfoPopup text={result.emotion_analysis?.note || "Emotion scores are generated using an ML model to classify text. Scores range from 0 to 1, indicating the likelihood of a given emotion."} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <EmotionRadar data={emotionSummary} title="Overall Emotion Scores" />
                    <EmotionRadar data={user1Emotion} title={`${user1Name}'s Emotion Profile`} />
                    <EmotionRadar data={user2Emotion} title={`${user2Name}'s Emotion Profile`} />
                </div>
            </Card>
            <Card>
                <h3 className="text-lg font-semibold mb-4 text-gray-200">Top Messages by Emotion</h3>
                {/* --- CHANGED: Dynamically render EmotionMessages for each emotion --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {emotionsToShow.map((emotion) => (
                        <EmotionMessages
                            key={emotion}
                            emotion={emotion}
                            messages={topEmotionsData[emotion] || []}
                        />
                    ))}
                </div>
            </Card>
        </div>
    );
};