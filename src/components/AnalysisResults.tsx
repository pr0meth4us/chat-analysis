import React from "react";
import { AnalysisResultsProps } from "@/types";
import { BarChart3, Info } from "lucide-react"; // Added Info icon

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ results }) => {
    if (!results) return null;

    return (
        <div className="w-full">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-md">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <Info className="w-5 h-5 mr-3 text-gray-500" /> Raw Analysis Data
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    Below is the full JSON output of the analysis. You can copy this data for external use.
                </p>
                <div className="bg-gray-800 text-gray-50 rounded-lg p-5 overflow-auto text-sm font-mono max-h-96 shadow-inner">
                    <pre className="whitespace-pre-wrap">
                        {JSON.stringify(results, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    );
};