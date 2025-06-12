import React from "react";
import {AnalysisResultsProps} from "@/types";
import {BarChart3} from "lucide-react";

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ results }) => {
    if (!results) return null;

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Analysis Results</h2>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
        <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-auto max-h-96">
          {JSON.stringify(results, null, 2)}
        </pre>
            </div>
        </div>
    );
};