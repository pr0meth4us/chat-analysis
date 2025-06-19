import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Moon } from 'lucide-react';

export function GhostPeriodsCard({ analysis }: { analysis: any }) {
    if (!analysis || !analysis.ghost_periods) return null;

    const { longest_ghost_period_hours, who_breaks_silence_most } = analysis.ghost_periods;
    const silenceBreaker = who_breaks_silence_most.sort((a:any, b:any) => b.count - a.count)[0];


    return (
        <Card className="glass">
            <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                    <Moon className="h-5 w-5" />
                    <span>Ghosting Periods</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-center">
                <div>
                    <p className="text-lg font-bold">{(longest_ghost_period_hours / 24).toFixed(1)} days</p>
                    <p className="text-sm text-muted-foreground">Longest Silence</p>
                </div>
                <div>
                    <p className="text-lg font-bold capitalize">{silenceBreaker.user}</p>
                    <p className="text-sm text-muted-foreground">Usually Breaks Silence</p>
                </div>
            </CardContent>
        </Card>
    );
}