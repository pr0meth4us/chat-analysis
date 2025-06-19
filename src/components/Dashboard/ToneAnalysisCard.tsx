import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Droplet } from 'lucide-react';

export function ToneAnalysisCard({ analysis }: { analysis: any }) {
    if (!analysis) return null;

    const sad = analysis.sad_tone_analysis;
    const romance = analysis.romance_tone_analysis;
    const sexual = analysis.sexual_tone_analysis;

    return (
        <Card className="glass">
            <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                    <Droplet className="h-5 w-5" />
                    <span>Tone Analysis</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4 text-center">
                <div>
                    <p className="text-2xl font-bold">{sad.sadness_intensity_percent.toFixed(2)}%</p>
                    <p className="text-sm text-muted-foreground">Sad</p>
                </div>
                <div>
                    <p className="text-2xl font-bold">{romance.romance_intensity_percent.toFixed(2)}%</p>
                    <p className="text-sm text-muted-foreground">Romantic</p>
                </div>
                <div>
                    <p className="text-2xl font-bold">{sexual.sexual_content_intensity_percent.toFixed(2)}%</p>
                    <p className="text-sm text-muted-foreground">Sexual</p>
                </div>
            </CardContent>
        </Card>
    );
}