'use client';

import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, CartesianGrid, XAxis, YAxis, Bar } from 'recharts';
import { AnalysisResult } from '@/types/analysis';
import { Card } from '../layout/Card';
import {CustomTooltip} from "@/components/Dashboard/shared/CustomTooltip";

interface HeadToHeadTabProps {
    result: AnalysisResult;
    processedData: any;
}

export const HeadToHeadTab: React.FC<HeadToHeadTabProps> = ({ result, processedData }) => {
    const { user1Name, user2Name } = processedData;
    const balance = result.relationship_metrics?.underlying_metrics.communication_balance_percent;
    const balanceData = balance ? Object.entries(balance).map(([name, value])=>({name, value})) : [];

    return(
        <div className="space-y-6">
            <Card>
                <h3 className="text-lg font-semibold mb-4 text-gray-200 text-center">Communication Balance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="text-center font-semibold mb-2">By Messages Sent</h4>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie data={balanceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                                    <Cell key={`cell-0`} fill="#3b82f6" />
                                    <Cell key={`cell-1`} fill="#8b5cf6" />
                                </Pie>
                                <Tooltip content={<CustomTooltip/>}/>
                                <Legend wrapperStyle={{fontSize: '14px'}}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div>
                        <h4 className="text-center font-semibold mb-2">Conversation Starters</h4>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={result.icebreaker_analysis?.conversation_starter_counts} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#4a5568"/>
                                <XAxis type="number" stroke="#9ca3af" tick={{fill: '#e5e7eb'}}/>
                                <YAxis type="category" dataKey="user" width={80} stroke="#9ca3af" tick={{fill: '#e5e7eb'}}/>
                                <Tooltip content={<CustomTooltip/>}/>
                                <Legend wrapperStyle={{fontSize: '14px'}}/>
                                <Bar dataKey="count" name="Conversations Started" fill="#22c55e" radius={[0, 4, 4, 0]}/>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </Card>

            <Card>
                <h3 className="text-lg font-semibold mb-4 text-gray-200 text-center">Hourly Activity Comparison (by User)</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={processedData.userHourlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4a5568"/>
                        <XAxis dataKey="hour" stroke="#9ca3af" fontSize={10} tick={{fill: '#e5e7eb'}}/>
                        <YAxis stroke="#9ca3af" fontSize={12} tick={{fill: '#e5e7eb'}}/>
                        <Tooltip content={<CustomTooltip/>}/>
                        <Legend wrapperStyle={{fontSize: '14px'}}/>
                        <Bar dataKey={user1Name} fill="#3b82f6" name={user1Name} radius={[4, 4, 0, 0]}/>
                        <Bar dataKey={user2Name} fill="#8b5cf6" name={user2Name} radius={[4, 4, 0, 0]}/>
                    </BarChart>
                </ResponsiveContainer>
            </Card>
        </div>
    );
};
