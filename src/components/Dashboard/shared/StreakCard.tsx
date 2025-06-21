import {Streak} from "@/types/analysis";
import {formatDate} from "@/utils/formatDate";
import React from "react";

export const StreakCard = ({ streak }: { streak: Streak }) => {
    const MessageDisplay = ({ message, label }: { message: Streak['first_message'], label: string }) => (
        <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
            <div className="mt-2 bg-gray-800 p-3 rounded-md">
                <p className="italic text-sm text-gray-200">"{message.message}"</p>
                <p className="text-xs text-gray-400 mt-2 text-right">- {message.sender}</p>
            </div>
        </div>
    );

    return (
        <div className="bg-gray-700/50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-bold text-white">{streak.length_days}-Day Streak</h4>
                <p className="text-sm text-gray-400">{formatDate(streak.start_date)} to {formatDate(streak.end_date)}</p>
            </div>
            <div className="space-y-4">
                <MessageDisplay message={streak.first_message} label="How It Started" />
                <MessageDisplay message={streak.last_message} label="How It Ended" />

                {streak.first_message_after_break && (
                    <>
                        <div className="flex items-center justify-center gap-4 my-4">
                            <div className="flex-grow border-t border-dashed border-gray-600"></div>
                            <span className="text-sm font-semibold text-red-400">{streak.first_message_after_break.days_gap} day gap</span>
                            <div className="flex-grow border-t border-dashed border-gray-600"></div>
                        </div>
                        <MessageDisplay message={streak.first_message_after_break} label="How It Resumed" />
                    </>
                )}
            </div>
        </div>
    );
};