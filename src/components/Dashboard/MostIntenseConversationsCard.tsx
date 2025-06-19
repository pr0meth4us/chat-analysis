import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { BarChart2 } from 'lucide-react';

export function MostIntenseConversationsCard({ analysis }: { analysis: any }) {
    if (!analysis || !analysis.conversation_patterns) return null;

    const { most_intense_conversations } = analysis.conversation_patterns;

    return (
        <Card className="glass">
            <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                    <BarChart2 className="h-5 w-5" />
                    <span>Most Intense Conversations</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2">
                    {most_intense_conversations.slice(0, 5).map((convo: any, index: number) => (
                        <li key={index} className="text-sm p-2 bg-muted rounded-lg">
                            <div className="flex justify-between font-semibold">
                                <span>Intensity: {convo.intensity_score.toFixed(2)}</span>
                                <span>{convo.message_count} messages</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {new Date(convo.start_time).toLocaleString()}
                            </div>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}