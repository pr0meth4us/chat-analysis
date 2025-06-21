'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Download, BarChart3, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/custom/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/custom/Card';
import { Badge } from '@/components/ui/custom/Badge';
import { ANALYSIS_MODULES } from '@/types';
import Link from 'next/link';

export default function AnalysisSection() {
    const { state, actions } = useAppContext();
    const [selectedModules, setSelectedModules] = useState<string[]>(
        ANALYSIS_MODULES.filter(m => m.enabled).map(m => m.key)
    );
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const toggleModule = (moduleKey: string) => {
        setSelectedModules(prev =>
            prev.includes(moduleKey)
                ? prev.filter(k => k !== moduleKey)
                : [...prev, moduleKey]
        );
    };

    const handleStartAnalysis = async () => {
        setIsAnalyzing(true);
        try {
            await actions.startAnalysis(selectedModules);
        } catch(error) {
            console.error("Analysis failed to start:", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const downloadReport = () => {
        if (state.analysisResult) {
            const blob = new Blob([JSON.stringify(state.analysisResult, null, 2)], {
                type: 'application/json',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'analysis-report.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    if (!state.filteredMessages.length) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">
                    No filtered messages found. Please filter your messages first.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Analysis Configuration</h2>
                <p className="text-muted-foreground">
                    Select analysis modules to run on your {state.filteredMessages.length} filtered messages
                </p>
                {state.analysisResult && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="text-green-700 dark:text-green-300 text-sm font-medium">
                            ✅ Analysis completed! You can now explore your data in the Search tab or view the full Dashboard.
                        </p>
                    </div>
                )}
            </div>

            {/* Module Selection Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <BarChart3 className="h-5 w-5" />
                        <span>Analysis Modules</span>
                        <Badge variant="secondary">
                            {selectedModules.length}/{ANALYSIS_MODULES.length}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {ANALYSIS_MODULES.map((module) => {
                            const isSelected = selectedModules.includes(module.key);
                            const isRecommended = module.enabled;

                            return (
                                <motion.div
                                    key={module.key}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => toggleModule(module.key)}
                                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                                        isSelected
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border hover:border-primary/50'
                                    }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center space-x-2">
                                            {isSelected ? (
                                                <Eye className="h-4 w-4 text-primary" />
                                            ) : (
                                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                                            )}
                                            <h3 className="font-medium text-sm">{module.name}</h3>
                                        </div>
                                        {isRecommended && (
                                            <Badge variant="outline" className="text-xs">
                                                Recommended
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {module.description}
                                    </p>
                                </motion.div>
                            );
                        })}
                    </div>

                    <div className="flex justify-between items-center mt-6">
                        <div className="space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedModules(ANALYSIS_MODULES.map(m => m.key))}
                            >
                                Select All
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedModules([])}
                            >
                                Clear All
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedModules(
                                    ANALYSIS_MODULES.filter(m => m.enabled).map(m => m.key)
                                )}
                            >
                                Recommended Only
                            </Button>
                        </div>

                        <Button
                            onClick={handleStartAnalysis}
                            disabled={selectedModules.length === 0 || isAnalyzing}
                            loading={isAnalyzing}
                            icon={Play}
                        >
                            {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {state.analysisResult && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center space-x-2">
                                    <BarChart3 className="h-5 w-5" />
                                    <span>Analysis Complete</span>
                                </CardTitle>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={downloadReport}
                                    icon={Download}
                                >
                                    Download Report
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center p-6 rounded-lg bg-muted/30">
                                <h4 className="font-medium text-lg mb-2">Report Generated!</h4>
                                <p className="text-sm text-muted-foreground mb-4">
                                    A report with {Object.keys(state.analysisResult).length} modules has been created. View the full interactive report on the dashboard.
                                </p>
                                <Link href="/dashboard">
                                    <Button icon={ExternalLink}>
                                        View Full Dashboard
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </div>
    );
}
