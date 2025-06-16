"use client";

import { Task } from "@/types";
import { Loader2 } from "lucide-react";
import React from "react";

interface TaskProgressProps {
    task: Task | null;
}

export const TaskProgress: React.FC<TaskProgressProps> = ({ task }) => {
    if (!task) return null;

    const progress = task.progress || 0;
    const stage = task.stage || "Processing...";
    const message = task.message || "";

    return (
        <div className="w-full bg-slate-800 text-white p-4 rounded-xl shadow-lg border border-slate-700 my-6 transition-all duration-500 ease-in-out">
            <div className="flex items-center space-x-4">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400 flex-shrink-0" />
                <div className="flex-grow">
                    <div className="flex justify-between items-center mb-1">
                        <p className="font-semibold text-slate-200">{stage}</p>
                        <p className="text-sm font-mono text-blue-300">{progress.toFixed(0)}%</p>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2.5 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    {message && (
                        <p className="text-xs text-slate-400 mt-2 truncate">{message}</p>
                    )}
                </div>
            </div>
        </div>
    );
};