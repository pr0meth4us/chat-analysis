import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Heart, Scale, Zap, Users } from 'lucide-react';

export function RelationshipMetricsCard({ analysis }: { analysis: any }) {
    if (!analysis || !analysis.relationship_metrics) return null;

    const { relationship_score, relationship_intensity, score_components } = analysis.relationship_metrics;

    return (
        <Card className="glass">
            <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center space-x-2">
                        <Heart className="h-5 w-5" />
                        <span>Relationship Score</span>
                    </div>
                    <span className="font-mono text-base">{relationship_score.toFixed(2)} / 100</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-center">
                    <p className="text-2xl font-bold">{relationship_intensity}</p>
                    <p className="text-sm text-muted-foreground">Intensity Level</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                        <Scale className="h-4 w-4 text-muted-foreground" />
                        <span>Balance: {score_components.balance_score.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Zap className="h-4 w-4 text-muted-foreground" />
                        <span>Responsiveness: {score_components.responsiveness_score.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>Engagement: {score_components.engagement_score.toFixed(2)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}