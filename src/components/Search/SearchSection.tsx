'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Hash } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/custom/Card';
import { Tabs } from '@/components/ui/custom/SearchTabs';
import KeywordCount from './KeywordCount';
import FuzzySearch from './FuzzySearch';

export default function SearchSection() {
    const { state } = useAppContext();
    const [activeTab, setActiveTab] = useState('keyword');

    const tabs = [
        {
            id: 'keyword',
            label: 'Keyword Count',
            icon: Hash,
        },
        {
            id: 'fuzzy',
            label: 'Fuzzy Search',
            icon: Search,
        },
    ];

    if (!state.filteredMessages.length) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">
                    No filtered messages found. Please filter your messages first.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Search Messages</h2>
                <p className="text-muted-foreground">
                    Search and analyze your filtered messages
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Search Tools</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs
                        tabs={tabs}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        className="mb-6"
                    />

                    <div className="mt-6">
                        {activeTab === 'keyword' && <KeywordCount />}
                        {activeTab === 'fuzzy' && <FuzzySearch />}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}