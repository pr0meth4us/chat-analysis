import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Type } from 'lucide-react';

export function WordAnalysisCard({ analysis }: { analysis: any }) {
    if (!analysis || !analysis.word_analysis) return null;

    const { user_word_analysis, overall_word_counts } = analysis.word_analysis;
    const users = Object.keys(user_word_analysis);

    return (
        <Card className="glass">
            <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center space-x-2">
                        <Type className="h-5 w-5" />
                        <span>Word Analysis</span>
                    </div>
                    <Badge variant="secondary">{overall_word_counts.total_words.toLocaleString()} Total</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {users.map(user => (
                    <div key={user}>
                        <h3 className="font-semibold mb-2 capitalize">{user}</h3>
                        <div className="flex flex-wrap gap-2">
                            {user_word_analysis[user].top_20_words.slice(0, 7).map((item: {word: string, count: number}) => (
                                <div key={item.word} className="flex items-center space-x-2 bg-muted p-2 rounded-lg text-sm">
                                    <span className="font-medium">{item.word}</span>
                                    <Badge variant="outline">{item.count}</Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}