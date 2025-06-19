import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';


export function ArgumentAnalysisCard({ analysis }: { analysis: any }) {
    if (!analysis || !analysis.argument_analysis) return null;

    const { top_instigators, most_used_argument_words, argument_intensity_percent } = analysis.argument_analysis;
    const topInstigator = top_instigators.sort((a:any, b:any) => b.count - a.count)[0];


    return (
        <Card className="glass">
            <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5" />
                        <span>Argument Analysis</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{argument_intensity_percent.toFixed(2)}% Intensity</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-center mb-4">
                    <p className="text-lg font-bold capitalize">{topInstigator.user}</p>
                    <p className="text-sm text-muted-foreground">Top Instigator</p>
                </div>
                <p className="text-sm text-muted-foreground mb-2">Most Used Argument Words</p>
                <div className="flex flex-wrap gap-2">
                    {most_used_argument_words.slice(0, 5).map((item: {word: string, count: number}) => (
                        <div key={item.word} className="flex items-center space-x-2 bg-muted p-2 rounded-lg">
                            <span className="font-medium text-sm">{item.word}</span>
                            <Badge variant="outline">{item.count}</Badge>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}