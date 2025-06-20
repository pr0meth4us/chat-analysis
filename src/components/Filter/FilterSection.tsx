'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Trash2, Plus, X } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/custom/Button';
import { Card } from '@/components/ui/custom/Card';
import { Badge } from '@/components/ui/custom/Badge';

export default function FilterSection() {
    const { state, actions } = useAppContext();
    const [meUsers, setMeUsers] = useState<string[]>([]);
    const [removeUsers, setRemoveUsers] = useState<string[]>([]);
    const [otherLabel, setOtherLabel] = useState('other');

    const availableSenders = state.senders.filter(
        sender => !meUsers.includes(sender) && !removeUsers.includes(sender)
    );

    const addToMe = (sender: string) => {
        setMeUsers([...meUsers, sender]);
    };

    const addToRemove = (sender: string) => {
        setRemoveUsers([...removeUsers, sender]);
    };

    const removeFromMe = (sender: string) => {
        setMeUsers(meUsers.filter(u => u !== sender));
    };

    const removeFromRemove = (sender: string) => {
        setRemoveUsers(removeUsers.filter(u => u !== sender));
    };

    const handleFilter = async () => {
        await actions.filterMessages({
            me: meUsers,
            remove: removeUsers,
            other_label: otherLabel,
        });
        resetFilter();
    };

    const resetFilter = () => {
        setMeUsers([]);
        setRemoveUsers([]);
        setOtherLabel('other');
    };

    if (!state.processedMessages.length) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">
                    No processed messages found. Please upload and process your data first.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Filter Messages</h2>
                <p className="text-muted-foreground">
                    Organize senders into groups for better analysis
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Available Senders */}
                <Card className="p-4">
                    <div className="flex items-center space-x-2 mb-4">
                        <User className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">Available Senders</h3>
                        <Badge variant="secondary">{availableSenders.length}</Badge>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {availableSenders.map(sender => (
                            <motion.div
                                key={sender}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                            >
                                <span className="text-sm truncate flex-1">{sender}</span>
                                <div className="flex space-x-1 ml-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => addToMe(sender)}
                                        className="h-6 px-2 text-xs"
                                    >
                                        Me
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => addToRemove(sender)}
                                        className="h-6 px-2 text-xs"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                        {availableSenders.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                All senders have been categorized
                            </p>
                        )}
                    </div>
                </Card>

                {/* Me Group */}
                <Card className="p-4">
                    <div className="flex items-center space-x-2 mb-4">
                        <div className="h-3 w-3 rounded-full bg-green-500" />
                        <h3 className="font-semibold">Me</h3>
                        <Badge variant="success">{meUsers.length}</Badge>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {meUsers.map(sender => (
                            <motion.div
                                key={sender}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center justify-between p-2 rounded-lg bg-green-500/10 border border-green-500/20"
                            >
                                <span className="text-sm truncate flex-1">{sender}</span>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removeFromMe(sender)}
                                    className="h-6 w-6 p-0 text-green-500 hover:text-green-700"
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </motion.div>
                        ))}
                        {meUsers.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No senders assigned to "Me"
                            </p>
                        )}
                    </div>
                </Card>

                {/* Remove Group */}
                <Card className="p-4">
                    <div className="flex items-center space-x-2 mb-4">
                        <Trash2 className="h-4 w-4 text-red-500" />
                        <h3 className="font-semibold">Remove</h3>
                        <Badge variant="destructive">{removeUsers.length}</Badge>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {removeUsers.map(sender => (
                            <motion.div
                                key={sender}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center justify-between p-2 rounded-lg bg-red-500/10 border border-red-500/20"
                            >
                                <span className="text-sm truncate flex-1 line-through opacity-75">{sender}</span>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removeFromRemove(sender)}
                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </motion.div>
                        ))}
                        {removeUsers.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No senders marked for removal
                            </p>
                        )}
                    </div>
                </Card>
            </div>

            {/* Other Label Configuration */}
            <Card className="p-4">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-primary" />
                        <span className="font-medium">Other Label:</span>
                    </div>
                    <input
                        type="text"
                        value={otherLabel}
                        onChange={(e) => setOtherLabel(e.target.value)}
                        className="px-3 py-1 rounded-md bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="other"
                    />
                    <div className="text-sm text-muted-foreground">
                        Remaining senders will be labeled as "{otherLabel}"
                    </div>
                </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
                <Button
                    variant="outline"
                    onClick={resetFilter}
                    disabled={state.isLoading}
                >
                    Reset
                </Button>
                <Button
                    onClick={handleFilter}
                    disabled={state.isLoading || (meUsers.length === 0 && removeUsers.length === 0)}
                    loading={state.isLoading}
                >
                    Apply Filter
                </Button>
            </div>

            {/* Summary */}
            {(meUsers.length > 0 || removeUsers.length > 0) && (
                <Card className="p-4 bg-muted/20">
                    <h4 className="font-semibold mb-2">Filter Summary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                            <span className="font-medium text-green-500">Me:</span>
                            <div className="text-muted-foreground">
                                {meUsers.length} sender{meUsers.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                        <div>
                            <span className="font-medium text-primary">Other:</span>
                            <div className="text-muted-foreground">
                                {availableSenders.length} sender{availableSenders.length !== 1 ? 's' : ''} → "{otherLabel}"
                            </div>
                        </div>
                        <div>
                            <span className="font-medium text-red-500">Remove:</span>
                            <div className="text-muted-foreground">
                                {removeUsers.length} sender{removeUsers.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}