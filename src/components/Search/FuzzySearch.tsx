'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MessageCircle, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/custom/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/custom/Card';
import { Badge } from '@/components/ui/custom/Badge';
import { useApi } from '@/hooks/useApi';
import { api } from '@/utils/api';
import { SearchResult } from '@/types';

export default function FuzzySearch() {
    const [query, setQuery] = useState('');
    const [cutoff, setCutoff] = useState(75);
    const { data: result, loading, error, execute } = useApi<SearchResult>();

    const handleSearch = async () => {
        if (!query.trim()) return;

        try {
            await execute(() => api.fuzzySearch(query.trim(), cutoff));
        } catch (error) {
            console.error('Fuzzy search failed:', error);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const formatDate = (timestamp: string) => {
        try {
            return new Date(timestamp).toLocaleString();
        } catch {
            return timestamp;
        }
    };

    return (
        <div className="space-y-6">
            {/* Search Controls */}
            <div className="space-y-4">
                <div className="flex space-x-2">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Enter search query..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                    <Button
                        onClick={handleSearch}
                        disabled={!query.trim() || loading}
                        loading={loading}
                        icon={Search}
                    >
                        Search
                    </Button>
                </div>

                {/* Similarity Cutoff */}
                <div className="flex items-center space-x-4">
                    <label className="text-sm font-medium">Similarity Cutoff:</label>
                    <input
                        type="range"
                        min="50"
                        max="100"
                        step="5"
                        value={cutoff}
                        onChange={(e) => setCutoff(Number(e.target.value))}
                        className="w-32"
                    />
                    <Badge variant="outline">{cutoff}%</Badge>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <Card className="p-4 border-destructive">
                    <div className="flex items-center space-x-2">
                        <div className="h-4 w-4 rounded-full bg-destructive" />
                        <p className="text-sm text-destructive">
                            {error}
                        </p>
                    </div>
                </Card>
            )}

            {/* Results */}
            {result && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    {/* Search Summary */}
                    <Card className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary">
                                    {result.match_count}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Matches Found
                                </div>
                            </div>

                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary">
                                    {result.total_messages_searched}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Messages Searched
                                </div>
                            </div>

                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary">
                                    {result.similarity_cutoff || cutoff}%
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Similarity Cutoff
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Search Results */}
                    {result.matches.length > 0 ? (
                        <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                                <MessageCircle className="h-5 w-5 text-primary" />
                                <h3 className="font-semibold">Search Results</h3>
                                <Badge variant="secondary">{result.matches.length}</Badge>
                            </div>

                            {result.matches.map((message, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Card className="p-4 hover:bg-accent/5 transition-colors">
                                        <div className="space-y-3">
                                            {/* Message Header */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium text-sm">
                            {message.sender}
                          </span>
                                                </div>

                                                {message.timestamp && (
                                                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                                        <Calendar className="h-3 w-3" />
                                                        <span>{formatDate(message.timestamp)}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Message Content */}
                                            <div className="pl-6">
                                                <p className="text-sm leading-relaxed">
                                                    {message.message}
                                                </p>
                                            </div>

                                            {/* Additional Data */}
                                            {Object.keys(message).length > 3 && (
                                                <details className="pl-6">
                                                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                                        Show additional data
                                                    </summary>
                                                    <div className="mt-2 p-2 rounded bg-muted/50 text-xs">
                            <pre className="whitespace-pre-wrap">
                              {JSON.stringify(
                                  Object.fromEntries(
                                      Object.entries(message).filter(
                                          ([key]) => !['sender', 'message', 'timestamp'].includes(key)
                                      )
                                  ),
                                  null,
                                  2
                              )}
                            </pre>
                                                    </div>
                                                </details>
                                            )}
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <Card className="p-6">
                            <div className="text-center">
                                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="font-semibold mb-2">No matches found</h3>
                                <p className="text-sm text-muted-foreground">
                                    No messages matched your search query "{result.query}" with {cutoff}% similarity.
                                    Try lowering the similarity cutoff or using different keywords.
                                </p>
                            </div>
                        </Card>
                    )}
                </motion.div>
            )}
        </div>
    );
}