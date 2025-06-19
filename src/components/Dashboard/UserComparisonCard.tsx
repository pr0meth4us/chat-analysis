import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Users } from 'lucide-react';

export function UserComparisonCard({ analysis }: { analysis: any }) {
    if (!analysis || !analysis.user_behavior) return null;

    const users = Object.keys(analysis.user_behavior);
    const user1 = users[0];
    const user2 = users[1];

    const data = {
        messages: [analysis.user_behavior[user1].message_counts.total_messages, analysis.user_behavior[user2].message_counts.total_messages],
        words: [analysis.user_behavior[user1].message_stats.avg_message_length_words.toFixed(2), analysis.user_behavior[user2].message_stats.avg_message_length_words.toFixed(2)],
        questions: [analysis.user_behavior[user1].content_style.question_asking_rate_percent.toFixed(2), analysis.user_behavior[user2].content_style.question_asking_rate_percent.toFixed(2)],
        emojis: [analysis.user_behavior[user1].content_style.emoji_usage_rate_percent.toFixed(2), analysis.user_behavior[user2].content_style.emoji_usage_rate_percent.toFixed(2)],
    };

    return (
        <Card className="glass">
            <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                    <Users className="h-5 w-5" />
                    <span>User Comparison</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="font-semibold">Metric</div>
                    <div className="font-semibold capitalize">{user1}</div>
                    <div className="font-semibold capitalize">{user2}</div>

                    <div>Messages</div>
                    <div>{data.messages[0]}</div>
                    <div>{data.messages[1]}</div>

                    <div>Avg Words/Msg</div>
                    <div>{data.words[0]}</div>
                    <div>{data.words[1]}</div>

                    <div>Question %</div>
                    <div>{data.questions[0]}%</div>
                    <div>{data.questions[1]}%</div>

                    <div>Emoji %</div>
                    <div>{data.emojis[0]}%</div>
                    <div>{data.emojis[1]}%</div>
                </div>
            </CardContent>
        </Card>
    );
}