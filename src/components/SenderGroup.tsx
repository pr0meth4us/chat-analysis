import React, { useState } from "react";
import { SenderGroupProps } from "@/types";
import { Trash2, X } from "lucide-react"; // Changed Trash2 to X for sender removal

export const SenderGroup: React.FC<SenderGroupProps> = ({
    title,
    icon: Icon,
    senders,
    onDrop,
    onRemove,
    color = "gray"
}) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const colorClasses = {
        blue: {
            base: 'border-blue-300 bg-blue-50',
            dragOver: 'border-blue-500 bg-blue-100 ring-2 ring-blue-500'
        },
        green: {
            base: 'border-green-300 bg-green-50',
            dragOver: 'border-green-500 bg-green-100 ring-2 ring-green-500'
        },
        red: {
            base: 'border-red-300 bg-red-50',
            dragOver: 'border-red-500 bg-red-100 ring-2 ring-red-500'
        },
        gray: {
            base: 'border-gray-300 bg-gray-50',
            dragOver: 'border-gray-500 bg-gray-100 ring-2 ring-gray-500'
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        const sender = e.dataTransfer.getData('text/plain');
        if (sender) onDrop(sender);
    };

    const currentColors = colorClasses[color];

    return (
        <div
            className={`border-2 border-dashed rounded-xl p-5 min-h-40 transition-all duration-200 flex flex-col ${
                isDragOver ? currentColors.dragOver : currentColors.base
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="flex items-center gap-3 mb-4">
                <Icon className={`w-5 h-5 text-${color}-600`} />
                <h3 className="font-semibold text-lg text-gray-900">{title}</h3>
                {senders.length > 0 && (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colorClasses[color].base.replace('border-', 'bg-').replace('-50', '-200')} text-${color}-800`}>
                        {senders.length}
                    </span>
                )}
            </div>

            <div className="flex-grow space-y-2">
                {senders.length > 0 ? (
                    senders.map((sender) => (
                        <div
                            key={sender}
                            className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm"
                        >
                            <span className="text-sm font-medium text-gray-800 truncate">{sender}</span>
                            <button
                                onClick={() => onRemove(sender)}
                                className="text-gray-400 hover:text-red-500 transition-colors duration-200 p-1 rounded-full hover:bg-red-50"
                                title={`Remove ${sender}`}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-gray-500 text-center py-6 italic">
                        Drag senders here to assign them to "{title}"
                    </p>
                )}
            </div>
        </div>
    );
};