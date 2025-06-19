import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Calendar, Users, MessageSquare } from 'lucide-react';

export function DatasetOverviewCard({ overview }: { overview: any }) {
    if (!overview) return null;

    const { date_range, total_messages, participants } = overview;
    const participantNames = participants.names.map((name: string) => name.charAt(0).toUpperCase() + name.slice(1)).join(' & ');

    return (
        <Card className="glass">
            <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                    <MessageSquare className="h-5 w-5" />
                    <span>Chat Overview</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4 text-center">
                <div>
                    <p className="text-2xl font-bold">{total_messages.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Messages</p>
                </div>
                <div>
                    <p className="text-2xl font-bold">{participantNames}</p>
                    <p className="text-sm text-muted-foreground">Participants</p>
                </div>
                <div>
                    <p className="text-2xl font-bold">{date_range.total_days}</p>
                    <p className="text-sm text-muted-foreground">Days</p>
                </div>
            </CardContent>
        </Card>
    );
}