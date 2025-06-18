'use client';

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { filterMessages, getFilteredMessages } from '@/utils/api';
import { Users, User, Trash2, Loader, X } from 'lucide-react';

// Reusable component for a draggable sender card.
const SenderCard = ({ sender, onDragStart }: { sender: string, onDragStart: (e: React.DragEvent, sender: string) => void }) => (
    <div
        draggable
        onDragStart={(e) => onDragStart(e, sender)}
        className="bg-white border border-gray-200 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
        <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="font-medium text-sm text-gray-800 truncate">{sender}</span>
        </div>
    </div>
);

// Reusable component for a drop zone, with enhanced styling and functionality.
const SenderGroup = ({
                         title,
                         icon: Icon,
                         color,
                         senders,
                         onDrop,
                         onRemoveSender,
                         itemsDraggable,
                         onDragStart,
                     }: {
    title: string;
    icon: React.ElementType;
    color: 'gray' | 'blue' | 'red';
    senders: string[];
    onDrop: () => void;
    onRemoveSender?: (sender: string) => void;
    itemsDraggable?: boolean;
    onDragStart?: (e: React.DragEvent, sender: string) => void;
}) => {
    const [isDragOver, setIsDragOver] = useState(false);

    // Enhanced color scheme for better contrast and visual feedback.
    const colorClasses = {
        blue: { base: 'border-blue-300 bg-blue-50', dragOver: 'border-blue-500 bg-blue-100 ring-2 ring-blue-500/50', text: 'text-blue-700', badge: 'bg-blue-200 text-blue-800' },
        red: { base: 'border-red-300 bg-red-50', dragOver: 'border-red-500 bg-red-100 ring-2 ring-red-500/50', text: 'text-red-700', badge: 'bg-red-200 text-red-800' },
        gray: { base: 'border-gray-300 bg-gray-100', dragOver: 'border-gray-400 bg-gray-200 ring-2 ring-gray-400/50', text: 'text-gray-700', badge: 'bg-gray-300 text-gray-800' },
    };
    const currentColors = colorClasses[color];

    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                onDrop();
            }}
            className={`border-2 border-dashed rounded-xl p-4 min-h-[300px] transition-all duration-200 flex flex-col ${isDragOver ? currentColors.dragOver : currentColors.base}`}
        >
            <div className="flex items-center gap-2 mb-4">
                <Icon className={`w-5 h-5 ${currentColors.text}`} />
                <h3 className={`font-semibold text-lg ${currentColors.text}`}>{title}</h3>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${currentColors.badge}`}>
                    {senders.length}
                </span>
            </div>
            <div className="flex-grow space-y-2">
                {senders.length > 0 ? (
                    senders.map((sender) =>
                        // Conditionally render draggable or static items
                        itemsDraggable && onDragStart ? (
                            <SenderCard key={sender} sender={sender} onDragStart={onDragStart} />
                        ) : (
                            <div key={sender} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-gray-200 shadow-sm">
                                <span className="text-sm font-medium text-gray-800 truncate">{sender}</span>
                                {onRemoveSender && (
                                    <button
                                        onClick={() => onRemoveSender(sender)}
                                        className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"
                                        title={`Move ${sender} back to Available`}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        )
                    )
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-gray-500 text-center italic">Drag senders here</p>
                    </div>
                )}
            </div>
        </div>
    );
};


export default function FilterPanel() {
    const { state, dispatch } = useAppContext();
    const [isFiltering, setIsFiltering] = useState(false);
    const [columns, setColumns] = useState({ available: [] as string[], me: [] as string[], remove: [] as string[] });
    const [draggedSender, setDraggedSender] = useState<string | null>(null);

    useEffect(() => {
        if (state.processedMessages.length > 0) {
            const uniqueSenders = Array.from(new Set(state.processedMessages.map(m => m.sender))).filter(Boolean).sort();
            setColumns({ available: uniqueSenders, me: [], remove: [] });
        }
    }, [state.processedMessages]);

    const handleDragStart = (e: React.DragEvent, sender: string) => {
        e.dataTransfer.setData('text/plain', sender);
        setDraggedSender(sender);
    };

    const handleDrop = (targetColumn: keyof typeof columns) => {
        if (!draggedSender) return;
        if (columns[targetColumn].includes(draggedSender)) return;

        const newColumns = { ...columns };
        Object.keys(newColumns).forEach(key => {
            const colKey = key as keyof typeof columns;
            newColumns[colKey] = newColumns[colKey].filter(s => s !== draggedSender);
        });
        newColumns[targetColumn] = [...newColumns[targetColumn], draggedSender].sort();

        setColumns(newColumns);
        setDraggedSender(null);
    };

    const removeSenderFromGroup = (sender: string) => {
        const newColumns = { ...columns };
        newColumns.me = newColumns.me.filter(s => s !== sender);
        newColumns.remove = newColumns.remove.filter(s => s !== sender);
        if (!newColumns.available.includes(sender)) {
            newColumns.available = [...newColumns.available, sender].sort();
        }
        setColumns(newColumns);
    };

    const handleApplyFilter = async () => {
        setIsFiltering(true);
        dispatch({ type: 'SET_ERROR', payload: null });
        try {
            const filterOptions = { me: columns.me, remove: columns.remove, other_label: 'other' };
            await filterMessages(filterOptions);
            const filtered = await getFilteredMessages();
            dispatch({ type: 'SET_FILTERED_MESSAGES', payload: filtered });
            dispatch({ type: 'SET_FILTER_OPTIONS', payload: filterOptions });
            dispatch({ type: 'SET_CURRENT_STEP', payload: 'analyze' });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Filtering failed' });
        } finally {
            setIsFiltering(false);
        }
    };

    const handleSkipFilter = () => {
        dispatch({ type: 'SET_FILTERED_MESSAGES', payload: state.processedMessages });
        dispatch({ type: 'SET_CURRENT_STEP', payload: 'analyze' });
    };

    return (
        <div className="card text-gray-900">
            <h2 className="text-2xl font-bold mb-2">Filter Senders by Dragging</h2>
            <div className="mb-6">
                <p className="text-gray-600">Drag senders from the "Available" column into the "You" or "Remove" columns to prepare your data for analysis.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SenderGroup
                    title="Available Senders"
                    icon={Users}
                    color="gray"
                    senders={columns.available}
                    onDrop={() => handleDrop('available')}
                    itemsDraggable={true}
                    onDragStart={handleDragStart}
                />
                <SenderGroup
                    title="Assigned as You"
                    icon={User}
                    color="blue"
                    senders={columns.me}
                    onDrop={() => handleDrop('me')}
                    onRemoveSender={removeSenderFromGroup}
                />
                <SenderGroup
                    title="Removed Senders"
                    icon={Trash2}
                    color="red"
                    senders={columns.remove}
                    onDrop={() => handleDrop('remove')}
                    onRemoveSender={removeSenderFromGroup}
                />
            </div>

            <div className="mt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <button onClick={handleSkipFilter} className="btn-secondary w-full md:w-auto">
                    Skip & Analyze All
                </button>
                <button onClick={handleApplyFilter} className="btn-primary w-full md:w-auto" disabled={isFiltering}>
                    {isFiltering ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : 'Apply Filter & Continue'}
                </button>
            </div>
        </div>
    );
}
