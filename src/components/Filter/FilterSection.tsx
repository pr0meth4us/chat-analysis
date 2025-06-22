'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Trash2, X, Filter, RefreshCw, CheckCircle } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/custom/Button';
import { Card } from '@/components/ui/custom/Card';
import { Badge } from '@/components/ui/custom/Badge';

export default function FilterSection() {
    const { state, actions } = useAppContext();
    const [meUsers, setMeUsers] = useState<string[]>([]);
    const [removeUsers, setRemoveUsers] = useState<string[]>([]);
    const [otherLabel, setOtherLabel] = useState('other');

    const isFilterTaskActive = useMemo(() => {
        return state.tasks.some(
            (task) => task.name === 'filter' && (task.status === 'pending' || task.status === 'running')
        );
    }, [state.tasks]);

    const hasFilteredMessages = useMemo(() => state.filteredMessages.length > 0, [state.filteredMessages]);
    const hasProcessedMessages = useMemo(() => state.processedMessages.length > 0, [state.processedMessages]);

    // Effect to reset local state if the underlying filtered data is cleared
    useEffect(() => {
        if (!hasFilteredMessages && !isFilterTaskActive) {
            resetLocalFilterState();
        }
    }, [hasFilteredMessages, isFilterTaskActive]);


    const availableSenders = state.senders.filter(
        sender => !meUsers.includes(sender) && !removeUsers.includes(sender)
    );

    const addToMe = (sender: string) => setMeUsers([...meUsers, sender]);
    const addToRemove = (sender: string) => setRemoveUsers([...removeUsers, sender]);
    const removeFromMe = (sender: string) => setMeUsers(meUsers.filter(u => u !== sender));
    const removeFromRemove = (sender: string) => setRemoveUsers(removeUsers.filter(u => u !== sender));

    const handleFilter = async () => {
        try {
            await actions.filterMessages({
                me: meUsers,
                remove: removeUsers,
                other_label: otherLabel,
            });
        } catch(error) {
            console.error("Failed to apply filters:", error);
        }
    };

    const resetLocalFilterState = () => {
        setMeUsers([]);
        setRemoveUsers([]);
        setOtherLabel('other');
    };

    if (!hasProcessedMessages) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">
                    No processed messages found. Please upload and process your data first.
                </p>
            </div>
        );
    }

    if (hasFilteredMessages) {
        return (
            <div className="space-y-6 text-center">
                 <Card className="p-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="flex flex-col items-center space-y-4">
                        <CheckCircle className="h-12 w-12 text-green-500" />
                        <div>
                            <h3 className="text-xl font-bold text-green-700 dark:text-green-300">
                                Filtering Complete
                            </h3>
                            <p className="text-muted-foreground mt-2">
                               {state.filteredMessages.length.toLocaleString()} messages remain after filtering.
                            </p>
                        </div>
                        <Button
                            variant="destructive"
                            className="mt-4"
                            icon={RefreshCw}
                            onClick={actions.clearFiltered}
                            loading={state.isLoading}
                        >
                            Clear Filter & Re-Filter
                        </Button>
                    </div>
                 </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Filter Messages</h2>
                <p className="text-muted-foreground">
                    Organize {state.senders.length} senders into groups for better analysis.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-4 flex flex-col">
                    <div className="flex items-center space-x-2 mb-4">
                        <User className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">Available Senders</h3>
                        <Badge variant="secondary">{availableSenders.length}</Badge>
                    </div>
                    <div className="space-y-2 flex-1 overflow-y-auto">
                        {availableSenders.map(sender => (
                            <motion.div key={sender} layout className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                                <span className="text-sm truncate flex-1">{sender}</span>
                                <div className="flex space-x-1 ml-2">
                                    <Button size="sm" variant="outline" onClick={() => addToMe(sender)} className="h-6 px-2 text-xs">Me</Button>
                                    <Button size="sm" variant="outline" onClick={() => addToRemove(sender)} className="h-6 px-2 text-xs"><Trash2 className="h-3 w-3" /></Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </Card>

                <Card className="p-4 flex flex-col">
                     <div className="flex items-center space-x-2 mb-4">
                        <div className="h-3 w-3 rounded-full bg-green-500" />
                        <h3 className="font-semibold">Me</h3>
                        <Badge variant="success">{meUsers.length}</Badge>
                    </div>
                    <div className="space-y-2 flex-1 overflow-y-auto">
                        {meUsers.map(sender => (
                             <motion.div key={sender} layout className="flex items-center justify-between p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                                <span className="text-sm truncate flex-1">{sender}</span>
                                <Button size="sm" variant="ghost" onClick={() => removeFromMe(sender)} className="h-6 w-6 p-0 text-green-500"><X className="h-3 w-3" /></Button>
                            </motion.div>
                        ))}
                    </div>
                </Card>

                <Card className="p-4 flex flex-col">
                     <div className="flex items-center space-x-2 mb-4">
                        <Trash2 className="h-4 w-4 text-red-500" />
                        <h3 className="font-semibold">Remove</h3>
                        <Badge variant="destructive">{removeUsers.length}</Badge>
                    </div>
                     <div className="space-y-2 flex-1 overflow-y-auto">
                        {removeUsers.map(sender => (
                            <motion.div key={sender} layout className="flex items-center justify-between p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                                <span className="text-sm truncate flex-1 line-through opacity-75">{sender}</span>
                                <Button size="sm" variant="ghost" onClick={() => removeFromRemove(sender)} className="h-6 w-6 p-0 text-red-500"><X className="h-3 w-3" /></Button>
                            </motion.div>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="flex justify-center space-x-4 pt-4">
                <Button variant="outline" onClick={resetLocalFilterState} disabled={isFilterTaskActive}>Reset Selections</Button>
                <Button
                    onClick={handleFilter}
                    disabled={isFilterTaskActive || (meUsers.length === 0 && removeUsers.length === 0)}
                    loading={isFilterTaskActive}
                    icon={Filter}
                    size="lg"
                >
                    {isFilterTaskActive ? 'Filtering...' : 'Apply Filter'}
                </Button>
            </div>
        </div>
    );
}
