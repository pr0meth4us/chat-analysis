'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Hash, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/custom/Button';
import { Card } from '@/components/ui/custom/Card';
import { Badge } from '@/components/ui/custom/Badge';
import { useApi } from '@/hooks/useApi';
import { api } from '@/utils/api';
import { KeywordCountResult } from '@/types';

export default function KeywordCount() {
    const [keyword, setKeyword] = useState('');
    const { data: result, loading, error, execute } = useApi<KeywordCountResult>();

    const handleSearch = async () => {
        if (!keyword.trim()) return;

        try {
            await execute(() => api.countKeyword(keyword.trim()));
        } catch (error) {
            console.error('Keyword search failed:', error);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="space-y-6">
            {/* Search Input */}
            <div className="flex space-x-2">
                <div className="flex-1 relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Enter keyword to count..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
                <Button
                    onClick={handleSearch}
                    disabled={!keyword.trim() || loading}
                    loading={loading}
                    icon={Search}
                >
                    Count
                </Button>
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
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="p-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary">
                                    {result.total_matches}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Total Matches
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary">
                                    {result.message_count}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Messages Searched
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary">
                                    {result.message_count > 0
                                        ? ((result.total_matches / result.message_count) * 100).toFixed(1)
                                        : 0}%
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Match Rate
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Keyword Breakdown */}
                    {Object.keys(result.counts).length > 0 && (
                        <Card className="p-4">
                            <div className="flex items-center space-x-2 mb-4">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                <h3 className="font-semibold">Keyword Breakdown</h3>
                            </div>

                            <div className="space-y-2">
                                {Object.entries(result.counts)
                                    .sort(([,a], [,b]) => b - a)
                                    .map(([keyword, count]) => (
                                        <div key={keyword} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                                            <span className="font-medium">{keyword}</span>
                                            <Badge variant="secondary">{count}</Badge>
                                        </div>
                                    ))}
                            </div>
                        </Card>
                    )}

                    {/* No Results */}
                    {result.total_matches === 0 && (
                        <Card className="p-6">
                            <div className="text-center">
                                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="font-semibold mb-2">No matches found</h3>
                                <p className="text-sm text-muted-foreground">
                                    The keyword "{keyword}" was not found in any of your messages.
                                </p>
                            </div>
                        </Card>
                    )}
                </motion.div>
            )}
        </div>
    );
}