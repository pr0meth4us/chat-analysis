import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Clock } from 'lucide-react';

export function TemporalPatternsCard({ patterns }: { patterns: any }) {
    if (!patterns) return null;

    const hourlyData = Object.entries(patterns.hourly_distribution || {}).map(([hour, count]) => ({
        hour: `${hour.padStart(2, '0')}:00`,
        messages: count,
    }));

    return (
        <Card className="glass">
            <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                    <Clock className="h-5 w-5" />
                    <span>Temporal Patterns</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-80 w-full mb-4">
                    <ResponsiveContainer>
                        <BarChart data={hourlyData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="hour" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                cursor={{ fill: 'hsla(var(--primary), 0.1)' }}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: '0.5rem'
                                }}
                            />
                            <Bar dataKey="messages" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                        <p className="text-lg font-bold">{patterns.most_active_day}</p>
                        <p className="text-sm text-muted-foreground">Most Active Day</p>
                    </div>
                    <div>
                        <p className="text-lg font-bold">{patterns.peak_hour}:00</p>
                        <p className="text-sm text-muted-foreground">Peak Hour</p>
                    </div>
                    <div>
                        <p className="text-lg font-bold">{patterns.night_owl_percentage.toFixed(1)}%</p>
                        <p className="text-sm text-muted-foreground">Night Owl Activity</p>
                    </div>
                    <div>
                        <p className="text-lg font-bold">{patterns.weekend_activity_percentage.toFixed(1)}%</p>
                        <p className="text-sm text-muted-foreground">Weekend Activity</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}