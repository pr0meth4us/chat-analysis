'use client';

import { useAppContext } from '@/context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Download, RefreshCw } from 'lucide-react';

export default function ResultsDisplay() {
    const { state, dispatch } = useAppContext();
    const { analysisReport: report } = state;

    if (!report) {
        return (
            <div className="card text-center">
                <h2 className="text-2xl font-bold mb-4">No Report Found</h2>
                <p className="text-gray-600">The analysis report is not available. Please run an analysis first.</p>
            </div>
        );
    }

    const handleStartOver = () => {
        dispatch({ type: 'RESET_STATE' });
    };

    const handleDownload = (dataType: 'report' | 'processed' | 'filtered') => {
        window.open(`/api/data/${dataType}?download=true`, '_blank');
    };

    // Prepare data for charts
    const timeAnalysisData = report.time_analysis?.messages_by_hour
        ? Object.entries(report.time_analysis.messages_by_hour).map(([hour, count]) => ({ hour: `${hour}:00`, messages: count }))
        : [];

    return (
        <div className="space-y-8">
            {/* Header and Actions */}
            <div className="card flex flex-col md:flex-row justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">Analysis Report</h2>
                <div className="flex items-center space-x-2">
                    <button onClick={() => handleDownload('report')} className="btn-secondary flex items-center"><Download size={16} className="mr-2"/>Download Report</button>
                    <button onClick={handleStartOver} className="btn-primary flex items-center"><RefreshCw size={16} className="mr-2"/>Start Over</button>
                </div>
            </div>

            {/* Basic Stats */}
            <div className="card">
                <h3 className="text-xl font-bold mb-4">Overall Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-2xl font-bold text-blue-800">{report.basic_stats.total_messages}</p>
                        <p className="text-sm text-blue-600">Total Messages</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-2xl font-bold text-green-800">{report.basic_stats.unique_senders}</p>
                        <p className="text-sm text-green-600">Unique Senders</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg col-span-2">
                        <p className="text-lg font-bold text-purple-800">{new Date(report.basic_stats.date_range.start).toLocaleDateString()} - {new Date(report.basic_stats.date_range.end).toLocaleDateString()}</p>
                        <p className="text-sm text-purple-600">Date Range</p>
                    </div>
                </div>
            </div>

            {/* Time Analysis */}
            {report.time_analysis && (
                <div className="card">
                    <h3 className="text-xl font-bold mb-4">Time Analysis</h3>
                    <p className="mb-6 text-gray-600">Messages by Hour of Day</p>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={timeAnalysisData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="hour" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="messages" fill="#3b82f6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Word Analysis */}
            {report.word_analysis && (
                <div className="card grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <h4 className="font-bold text-lg mb-2">Top Words</h4>
                        <ol className="list-decimal list-inside text-gray-700">
                            {report.word_analysis.top_50_meaningful_words_overall?.slice(0, 10).map(([word, count]: [string, number]) => (
                                <li key={word}><strong>{word}:</strong> {count}</li>
                            ))}
                        </ol>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg mb-2">Top Bigrams</h4>
                        <ol className="list-decimal list-inside text-gray-700">
                            {report.word_analysis.top_20_bigrams_overall?.slice(0, 10).map(([phrase, count]: [string, number]) => (
                                <li key={phrase}><strong>{phrase}:</strong> {count}</li>
                            ))}
                        </ol>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg mb-2">Top Trigrams</h4>
                        <ol className="list-decimal list-inside text-gray-700">
                            {report.word_analysis.top_15_trigrams_overall?.slice(0, 10).map(([phrase, count]: [string, number]) => (
                                <li key={phrase}><strong>{phrase}:</strong> {count}</li>
                            ))}
                        </ol>
                    </div>
                </div>
            )}

            {/* Sentiment Analysis */}
            {report.sentiment_analysis && (
                <div className="card">
                    <h3 className="text-xl font-bold mb-4">Sentiment Analysis</h3>
                    <p>Overall Sentiment Score: <span className="font-bold">{report.sentiment_analysis.overall_sentiment.compound.toFixed(3)}</span></p>
                    {/* Add more sentiment details if available */}
                </div>
            )}
        </div>
    );
}