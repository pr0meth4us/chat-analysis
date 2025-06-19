import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Zap } from 'lucide-react';

export function UnbrokenStreaksCard({ analysis }: { analysis: any }) {
    if (!analysis || !analysis.unbroken_streaks) return null;

    const { longest_consecutive_days, streak_start_date, streak_end_date, total_active_days } = analysis.unbroken_streaks;

    return (
        <Card className="glass">
            <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                    <Zap className="h-5 w-5" />
                    <span>Unbroken Streaks</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-center">
                    <p className="text-4xl font-bold">{longest_consecutive_days}</p>
                    <p className="text-sm text-muted-foreground">Longest Streak (days)</p>
                </div>
                <div className="text-sm text-muted-foreground">
                    <p><strong>From:</strong> {new Date(streak_start_date).toLocaleDateString()}</p>
                    <p><strong>To:</strong> {new Date(streak_end_date).toLocaleDateString()}</p>
                    <p><strong>Total Active Days:</strong> {total_active_days}</p>
                </div>
            </CardContent>
        </Card>
    );
}