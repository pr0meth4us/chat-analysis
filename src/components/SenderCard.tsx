import React from "react";
import { SenderCardProps } from "@/types";
import { User } from "lucide-react";

export const SenderCard: React.FC<SenderCardProps> = ({ sender, onDragStart }) => {
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, sender)}
            className="bg-white border border-gray-200 rounded-lg p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow duration-200 text-gray-900 transform hover:-translate-y-0.5"
        >
            <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <span className="font-medium text-base truncate">{sender}</span>
            </div>
        </div>
    );
};