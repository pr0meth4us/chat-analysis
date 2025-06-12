import React, {useState} from "react";
import {SenderGroupProps} from "@/types";
import {Trash2} from "lucide-react";

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
        blue: 'border-blue-200 bg-blue-50',
        green: 'border-green-200 bg-green-50',
        red: 'border-red-200 bg-red-50',
        gray: 'border-gray-200 bg-gray-50'
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

    return (
        <div
            className={`border-2 border-dashed rounded-lg p-4 min-h-32 transition-all duration-200 ${
                isDragOver ? colorClasses[color] : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-gray-600" />
                <h3 className="font-medium text-gray-900">{title}</h3>
                {senders.length > 0 && (
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
            {senders.length}
          </span>
                )}
            </div>

            <div className="space-y-2">
                {senders.map((sender) => (
                    <div
                        key={sender}
                        className="flex items-center justify-between bg-white p-2 rounded border"
                    >
                        <span className="text-sm text-gray-700">{sender}</span>
                        <button
                            onClick={() => onRemove(sender)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>
                ))}
                {senders.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">
                        Drag senders here
                    </p>
                )}
            </div>
        </div>
    );
};