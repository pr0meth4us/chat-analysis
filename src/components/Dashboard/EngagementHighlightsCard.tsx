import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import { Flame, BarChart2, MessageCircle } from 'lucide-react';

// A helper to format the sample messages inside the tooltip
const SampleMessages = ({ messages, participants }: { messages: any[], participants: string[] }) => {
    const userColors: { [key: string]: string } = {
        [participants[0]]: 'text-sky-400',
        [participants[1]]: 'text-amber-400',
    };

    return (
        <div className="p-2 space-y-2 max-w-xs">
            <h4 className="font-bold text-sm mb-2 text-white">Message Sample</h4>
            {messages.map((msg, index) => (
                <div key={index} className="text-xs border-b border-border/20 pb-2 last:border-b-0">
                    <span className={`font-bold capitalize ${userColors[msg.sender] || 'text-gray-400'}`}>{msg.sender}</span>:
                    <p className="text-white break-words mt-1">{msg.message}</p>
                    <p className="text-gray-500 text-right text-[10px] mt-1">{new Date(msg.datetime).toLocaleTimeString()}</p>
                </div>
            ))}
        </div>
    );
};


export function EngagementHighlightsCard({ analysis }: { analysis: any }) {
    if (!analysis) return null;

    const rapidFireSessions = analysis.rapid_fire_analysis?.top_10_sessions || [];
    const intenseConversations = analysis.conversation_patterns?.most_intense_conversations || [];
    const participants = analysis.dataset_overview?.participants?.names || [];

    return (
        <Card className="glass">
            <CardHeader>
                <CardTitle className="text-lg">Engagement Highlights</CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="intense" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="intense">
                            <BarChart2 className="h-4 w-4 mr-2" /> Intense Conversations
                        </TabsTrigger>
                        <TabsTrigger value="rapid-fire">
                            <Flame className="h-4 w-4 mr-2" /> Rapid Fire
                        </TabsTrigger>
                    </TabsList>

                    {/* Intense Conversations Tab */}
                    <TabsContent value="intense" className="mt-4">
                        <p className="text-sm text-muted-foreground mb-3">Top 5 most intense chat sessions. Hover for a message sample.</p>
                        <div className="space-y-3">
                            {intenseConversations.slice(0, 5).map((convo: any) => (
                                <TooltipProvider key={convo.id} delayDuration={100}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="p-3 bg-muted rounded-lg cursor-help transition-all hover:bg-muted/80">
                                                <div className="flex justify-between items-center">
                                                    <div className="font-bold text-sm">Intensity: <span className="text-primary">{convo.intensity_score.toFixed(2)}</span></div>
                                                    <div className="text-xs text-muted-foreground flex items-center">
                                                        <MessageCircle className="h-3 w-3 mr-1" />
                                                        {convo.message_count} messages
                                                    </div>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {new Date(convo.start_time).toLocaleString()}
                                                </p>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" className="bg-background border-border">
                                            <SampleMessages messages={convo.sample_messages} participants={participants} />
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ))}
                        </div>
                    </TabsContent>

                    {/* Rapid Fire Tab */}
                    <TabsContent value="rapid-fire" className="mt-4">
                        <p className="text-sm text-muted-foreground mb-3">Top 5 fastest back-and-forth exchanges.</p>
                        <div className="space-y-3">
                            {rapidFireSessions.slice(0, 5).map((session: any, index: number) => (
                                <div key={index} className="p-3 bg-muted rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <div className="font-bold text-sm">
                                            {session.messages_per_minute.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">msg/min</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {session.total_messages} msgs in {session.duration_minutes.toFixed(1)} min
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {new Date(session.start_time).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}