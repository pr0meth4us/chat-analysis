import React from "react";
import {SenderCardProps} from "@/types";
import {User} from "lucide-react";

export const SenderCard: React.FC<SenderCardProps> = ({ sender, onDragStart }) => {
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, sender)}
            className="bg-white border border-gray-200 rounded-lg p-3 cursor-move hover:shadow-md transition-shadow"
        >
            <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-900">{sender}</span>
            </div>
        </div>
    );
};