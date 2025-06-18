'use client';

import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { startAnalysis } from '@/utils/api';
import { BarChart3, Loader, ChevronLeft } from 'lucide-react';

export default function AnalysisPanel() {
    const { state, dispatch } = useAppContext();
    const [isStarting, setIsStarting] = useState(false);

    // Default modules for the analysis
    const [modules, setModules] = useState<string[]>(['basic_stats', 'sender_stats', 'time_analysis', 'word_analysis']);

    const handleStartAnalysis = async () => {
        setIsStarting(true);
        dispatch({ type: 'SET_ERROR', payload: null });
        try {
            const task = await startAnalysis(modules.length > 0 ? modules : undefined);
            dispatch({ type: 'SET_ANALYSIS_TASK', payload: task });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to start analysis' });
        } finally {
            setIsStarting(false);
        }
    };

    const handleGoBack = () => {
        dispatch({ type: 'SET_CURRENT_STEP', payload: 'filter' });
    };

    const toggleModule = (module: string) => {
        setModules(prev => prev.includes(module) ? prev.filter(m => m !== module) : [...prev, module]);
    };

    return (
        // FIX: Added 'text-gray-900' to the card to ensure all text has a dark color by default.
        <div className="card text-gray-900">
            <h2 className="text-2xl font-bold mb-6">Start Analysis</h2>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-gray-800">
                    Ready to analyze <strong>{state.filteredMessages.length}</strong> messages.
                </p>
                <p className="text-sm text-gray-600">
                    Your data is now prepared. You can now start the comprehensive analysis.
                </p>
            </div>

            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Analysis Modules</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {['basic_stats', 'sender_stats', 'time_analysis', 'word_analysis', 'sentiment_analysis'].map(m => (
                        <label key={m} className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" checked={modules.includes(m)} onChange={() => toggleModule(m)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className="text-gray-700 capitalize">{m.replace(/_/g, ' ')}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="flex justify-between items-center mt-8">
                <button onClick={handleGoBack} className="btn-secondary flex items-center">
                    <ChevronLeft size={20} className="mr-1"/> Back to Filter
                </button>
                <button
                    onClick={handleStartAnalysis}
                    className="btn-primary"
                    disabled={isStarting}
                >
                    {isStarting ? (
                        <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                        <div className="flex items-center">
                            <BarChart3 size={20} className="mr-2"/>
                            Start Analysis
                        </div>
                    )}
                </button>
            </div>
        </div>
    );
}