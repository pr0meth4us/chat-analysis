import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Smile } from 'lucide-react';

export function EmojiAnalysisCard({ analysis }: { analysis: any }) {
    if (!analysis || !analysis.emoji_analysis) return null;

    const { user_emoji_analysis, total_emojis_used } = analysis.emoji_analysis;
    const users = Object.keys(user_emoji_analysis);

    return (
        <Card className="glass">
            <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center space-x-2">
                        <Smile className="h-5 w-5" />
                        <span>Emoji Analysis</span>
                    </div>
                    <Badge variant="secondary">{total_emojis_used} Total</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {users.map(user => (
                    <div key={user}>
                        <h3 className="font-semibold mb-2 capitalize">{user}</h3>
                        <div className="flex flex-wrap gap-2">
                            {user_emoji_analysis[user].top_10_emojis.slice(0, 5).map((item: {emoji: string, count: number}) => (
                                <div key={item.emoji} className="flex items-center space-x-2 bg-muted p-2 rounded-lg">
                                    <span className="text-xl">{item.emoji}</span>
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