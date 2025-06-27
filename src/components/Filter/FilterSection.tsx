'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Trash2, Filter, RefreshCw, CheckCircle, UserPlus, UserCheck, UserX, UserCircle } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/custom/Button';
import { Card } from '@/components/ui/custom/Card';
import { Badge } from '@/components/ui/custom/Badge';
import { Input } from '@/components/ui/custom/Input';

type Assignment = 'group1' | 'group2' | 'remove' | 'unassigned';

function SenderRow({ name, assignment, onAssign, groupNames }: { name: string; assignment: Assignment; onAssign: (newAssignment: Assignment) => void; groupNames: { group1: string; group2: string; }}) {
    const badge_map: Record<Assignment, React.ReactNode> = {
        group1: <Badge variant="success">Assigned to: {groupNames.group1}</Badge>,
        group2: <Badge variant="info">Assigned to: {groupNames.group2}</Badge>,
        remove: <Badge variant="destructive">Removed</Badge>,
        unassigned: null,
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-between p-2 rounded-lg bg-background hover:bg-muted/50"
        >
            <span className="text-sm font-medium truncate">{name}</span>
            <div className="flex items-center space-x-2">
                {badge_map[assignment]}
                {assignment === 'unassigned' ? (
                    <>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-green-500 hover:bg-green-500/10" onClick={() => onAssign('group1')} title={`Assign to ${groupNames.group1}`}><UserPlus className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-500 hover:bg-blue-500/10" onClick={() => onAssign('group2')} title={`Assign to ${groupNames.group2}`}><UserPlus className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:bg-red-500/10" onClick={() => onAssign('remove')} title="Remove"><UserX className="h-4 w-4" /></Button>
                    </>
                ) : (
                    <Button size="sm" variant="ghost" onClick={() => onAssign('unassigned')} className="text-xs">Undo</Button>
                )}
            </div>
        </motion.div>
    );
}

export default function FilterSection() {
    const { state, actions } = useAppContext();
    const [assignments, setAssignments] = useState<Record<string, Assignment>>({});
    const [groupNames, setGroupNames] = useState({ group1: 'Adam', group2: 'Eve' });

    useEffect(() => {
        const initialAssignments: Record<string, Assignment> = {};
        state.senders.forEach(sender => {
            initialAssignments[sender] = 'unassigned';
        });
        setAssignments(initialAssignments);
    }, [state.senders]);

    const handleAssign = (sender: string, newAssignment: Assignment) => {
        setAssignments(prev => ({...prev, [sender]: newAssignment}));
    };

    const { unassigned, group1, group2, remove } = useMemo(() => {
        const lists: Record<Assignment, string[]> = { unassigned: [], group1: [], group2: [], remove: [] };
        Object.entries(assignments).forEach(([sender, assignment]) => {
            lists[assignment].push(sender);
        });
        return lists;
    }, [assignments]);

    const handleApplyFilter = () => {
        actions.filterMessages({
            group_mappings: {
                [groupNames.group1]: group1,
                [groupNames.group2]: group2,
            },
            remove: remove,
            unassigned_label: 'Other',
        });
    };

    const hasFilteredMessages = !!state.filteredData && state.filteredData.messages.length > 0;
    // Updated: Now relies on state.isLoading for the filter button's loading state.
    const isFilterRunning = state.isLoading;

    if (hasFilteredMessages) {
        return (
            <div className="space-y-6 text-center">
                <Card className="p-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="flex flex-col items-center space-y-4">
                        <CheckCircle className="h-12 w-12 text-green-500" />
                        <div>
                            <h3 className="text-xl font-bold text-green-700 dark:text-green-300">Filtering Complete</h3>
                            <p className="text-muted-foreground mt-2">
                                {(state.filteredData?.messages?.length ?? 0).toLocaleString()} messages remain after filtering.
                            </p>
                        </div>
                        <Button variant="destructive" className="mt-4" icon={RefreshCw} onClick={actions.clearFiltered} loading={state.isLoading}>Clear Filter & Re-Filter</Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Filter & Group Senders</h2>
                <p className="text-muted-foreground">Assign each sender to a group or mark them for removal.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                    <div className="flex items-center space-x-2 mb-1">
                        <UserCircle className="h-5 w-5 text-green-500" />
                        <label className="text-sm font-medium">Person 1 Name</label>
                    </div>
                    <Input
                        value={groupNames.group1}
                        onChange={e => setGroupNames(prev => ({...prev, group1: e.target.value}))}
                        className="text-base font-semibold mt-1"
                    />
                </Card>
                <Card className="p-4">
                    <div className="flex items-center space-x-2 mb-1">
                        <UserCircle className="h-5 w-5 text-blue-500" />
                        <label className="text-sm font-medium">Person 2 Name</label>
                    </div>
                    <Input
                        value={groupNames.group2}
                        onChange={e => setGroupNames(prev => ({...prev, group2: e.target.value}))}
                        className="text-base font-semibold mt-1"
                    />
                </Card>
            </div>

            <Card className="p-4">
                <div className="space-y-4">
                    <div>
                        <div className="flex items-center space-x-2 p-2">
                            <Users className="h-5 w-5 text-primary"/>
                            <h3 className="font-semibold">Ready to Review ({unassigned.length})</h3>
                        </div>
                        <div className="space-y-1 pl-2 pr-2 max-h-60 overflow-y-auto">
                            <AnimatePresence>
                                {unassigned.map(sender => <SenderRow key={sender} name={sender} assignment="unassigned" onAssign={(newA) => handleAssign(sender, newA)} groupNames={groupNames} />)}
                            </AnimatePresence>
                            {unassigned.length === 0 && <p className="text-sm text-muted-foreground p-4 text-center">All senders have been categorized!</p>}
                        </div>
                    </div>

                    <hr/>

                    <div>
                        <div className="flex items-center space-x-2 p-2">
                            <UserCheck className="h-5 w-5 text-muted-foreground"/>
                            <h3 className="font-semibold">Grouped ({group1.length + group2.length})</h3>
                        </div>
                        <div className="space-y-1 pl-2 pr-2">
                            <AnimatePresence>
                                {group1.map(sender => <SenderRow key={sender} name={sender} assignment="group1" onAssign={(newA) => handleAssign(sender, newA)} groupNames={groupNames} />)}
                                {group2.map(sender => <SenderRow key={sender} name={sender} assignment="group2" onAssign={(newA) => handleAssign(sender, newA)} groupNames={groupNames} />)}
                            </AnimatePresence>
                            {group1.length === 0 && group2.length === 0 && <p className="text-sm text-muted-foreground p-2">No senders grouped yet.</p>}
                        </div>
                    </div>

                    <hr/>

                    <div>
                        <div className="flex items-center space-x-2 p-2">
                            <Trash2 className="h-5 w-5 text-destructive"/>
                            <h3 className="font-semibold">Removed ({remove.length})</h3>
                        </div>
                        <div className="space-y-1 pl-2 pr-2">
                            <AnimatePresence>
                                {remove.map(sender => <SenderRow key={sender} name={sender} assignment="remove" onAssign={(newA) => handleAssign(sender, newA)} groupNames={groupNames} />)}
                            </AnimatePresence>
                            {remove.length === 0 && <p className="text-sm text-muted-foreground p-2">No senders marked for removal.</p>}
                        </div>
                    </div>
                </div>
            </Card>

            <div className="flex justify-center pt-4">
                <Button onClick={handleApplyFilter} size="lg" icon={Filter} loading={isFilterRunning} disabled={isFilterRunning || state.senders.length === 0}>
                    {isFilterRunning ? "Filtering..." : "Apply Filter & Continue"}
                </Button>
            </div>
        </div>
    );
}