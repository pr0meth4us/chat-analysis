'use client';

import { useAppContext } from '@/context/AppContext';
import FileUpload from '@/components/FileUpload';
import TaskProgress from '@/components/TaskProgress';
import FilterPanel from '@/components/FilterPanel';
import AnalysisPanel from '@/components/AnalysisPanel';
import ResultsDisplay from '@/components/ResultsDisplay';
import { MessageCircle, BarChart3, Filter, Upload } from 'lucide-react';

export default function Home() {
  const { state, dispatch } = useAppContext();

  const steps = [
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'filter', label: 'Filter', icon: Filter },
    { id: 'analyze', label: 'Analyze', icon: BarChart3 },
    { id: 'results', label: 'Results', icon: MessageCircle },
  ];

  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Chat Analyzer
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Upload your chat history and get detailed insights about your conversations
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-12">
            <div className="flex justify-center">
              <div className="flex items-center space-x-8">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const currentIndex = steps.findIndex(s => s.id === state.currentStep);
                  const isActive = state.currentStep === step.id;
                  const isCompleted = currentIndex > index;

                  return (
                      <div key={step.id} className="flex items-center">
                        <div className={`
                      flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all
                      ${isActive
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : isCompleted
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'bg-white border-gray-300 text-gray-400'
                        }
                    `}>
                          <Icon size={20} />
                        </div>
                        <span className={`ml-2 font-medium ${
                            isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                        }`}>
                      {step.label}
                    </span>
                        {index < steps.length - 1 && (
                            <div className={`w-16 h-0.5 ml-4 ${
                                isCompleted ? 'bg-green-500' : 'bg-gray-200'
                            }`} />
                        )}
                      </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Error Display */}
          {state.error && (
              <div className="mb-6 mx-auto max-w-2xl">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-red-800 font-medium">An Error Occurred</p>
                      <p className="text-red-600">{state.error}</p>
                    </div>
                    <button onClick={() => dispatch({ type: 'SET_ERROR', payload: null })} className="text-red-500 hover:text-red-700">
                      &times;
                    </button>
                  </div>
                </div>
              </div>
          )}

          {/* Main Content */}
          <div className="max-w-4xl mx-auto">
            {state.currentStep === 'upload' && (
                <div className="space-y-6">
                  <FileUpload />
                  {/* FIX: Pass the 'taskType' prop here */}
                  {state.processTask && <TaskProgress task={state.processTask} taskType="process" />}
                </div>
            )}

            {state.currentStep === 'filter' && <FilterPanel />}

            {state.currentStep === 'analyze' && (
                <div className="space-y-6">
                  <AnalysisPanel />
                  {/* FIX: Pass the 'taskType' prop here */}
                  {state.analysisTask && <TaskProgress task={state.analysisTask} taskType="analysis" />}
                </div>
            )}

            {state.currentStep === 'results' && <ResultsDisplay />}
          </div>
        </div>
      </div>
  );
}
