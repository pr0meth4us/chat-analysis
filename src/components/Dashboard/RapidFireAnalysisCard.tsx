import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Flame } from 'lucide-react';

export function RapidFireAnalysisCard({ analysis }: { analysis: any }) {
    if (!analysis || !analysis.rapid_fire_analysis) return null;

    const { top_10_sessions } = analysis.rapid_fire_analysis;

    return (
        <Card className="glass">
            <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                    <Flame className="h-5 w-5" />
                    <span>Rapid Fire Sessions</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2">
                    {top_10_sessions.slice(0, 5).map((session: any, index: number) => (
                        <li key={index} className="text-sm p-2 bg-muted rounded-lg">
                            <div className="flex justify-between font-semibold">
                                <span>{session.total_messages} messages in {session.duration_minutes.toFixed(2)} mins</span>
                                <span>{session.messages_per_minute.toFixed(2)} msg/min</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {new Date(session.start_time).toLocaleString()}
                            </div>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}
