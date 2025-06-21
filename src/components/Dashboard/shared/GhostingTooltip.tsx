import React from 'react';
import { GhostPeriod } from '@/types/analysis';

export const GhostingTooltip = ({ period }: { period: GhostPeriod }) => (
    <div className="bg-gray-900 border border-yellow-500 p-4 rounded-lg shadow-2xl z-10 w-80">
        <h4 className="font-bold mb-3 text-white">Silence Details</h4>
        <div className="space-y-3 text-sm">
            <div>
                <p className="text-xs text-gray-400">Last Message Before Silence (by {period.last_sender_before_ghost})</p>
                <p className="italic bg-gray-800 p-2 rounded mt-1">"{period.last_message_before_ghost}"</p>
            </div>
            <div>
                <p className="text-xs text-green-400">Silence Broken By {period.who_broke_silence}</p>
                <p className="italic bg-gray-800 p-2 rounded mt-1">"{period.first_message_after_ghost}"</p>
            </div>
        </div>
    </div>
);
