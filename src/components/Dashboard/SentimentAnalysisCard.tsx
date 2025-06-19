import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function SentimentAnalysisCard({ analysis }: { analysis: any }) {
    if (!analysis || !analysis.sentiment_analysis) return null;

    const { positive_message_count, negative_message_count, neutral_message_count, overall_average_sentiment, user_average_sentiment } = analysis.sentiment_analysis;
    const users = Object.keys(user_average_sentiment);

    const getSentimentColor = (score: number) => {
        if (score > 0.05) return 'text-green-400';
        if (score < -0.05) return 'text-red-400';
        return 'text-yellow-400';
    };

    return (
        <Card className="glass">
            <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                    <span>Sentiment Analysis</span>
                    <span className={`font-mono text-base ${getSentimentColor(overall_average_sentiment)}`}>
                        Avg: {overall_average_sentiment.toFixed(4)}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center mb-6">
                    <div className="p-3 rounded-lg bg-green-500/10">
                        <TrendingUp className="h-6 w-6 text-green-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{positive_message_count}</p>
                        <p className="text-sm text-muted-foreground">Positive</p>
                    </div>
                    <div className="p-3 rounded-lg bg-yellow-500/10">
                        <Minus className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{neutral_message_count}</p>
                        <p className="text-sm text-muted-foreground">Neutral</p>
                    </div>
                    <div className="p-3 rounded-lg bg-red-500/10">
                        <TrendingDown className="h-6 w-6 text-red-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{negative_message_count}</p>
                        <p className="text-sm text-muted-foreground">Negative</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                    {users.map(user => (
                        <div key={user}>
                            <p className={`text-lg font-bold ${getSentimentColor(user_average_sentiment[user].mean)}`}>{user_average_sentiment[user].mean.toFixed(4)}</p>
                            <p className="text-sm text-muted-foreground capitalize">{user}'s Avg</p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}