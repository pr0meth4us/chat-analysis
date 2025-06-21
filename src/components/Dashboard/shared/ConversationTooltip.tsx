import React from 'react';
import { Message } from '@/types';

interface ConversationTooltipProps {
    messages: Message[];
    user1: string;
    user2: string;
}

export const ConversationTooltip: React.FC<ConversationTooltipProps> = ({ messages, user1, user2 }) => (
    <div className="bg-gray-900 border border-blue-500 p-4 rounded-lg shadow-2xl z-10 w-80">
        <h4 className="font-bold mb-3 text-white">Conversation Snippet</h4>
        <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {messages.slice(0, 10).map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.sender === user1 ? 'items-start' : 'items-end'}`}>
                    <div className={`px-3 py-2 rounded-2xl max-w-[85%] ${msg.sender === user1 ? 'bg-blue-600 rounded-bl-none' : 'bg-gray-600 rounded-br-none'}`}>
                        <p className="text-sm text-white">{msg.message}</p>
                    </div>
                </div>
            ))}
            {messages.length > 10 && <p className="text-center text-xs text-gray-500 mt-2">... and more</p>}
        </div>
    </div>
);
