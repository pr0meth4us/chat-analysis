'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play, Download, BarChart3, Eye, EyeOff, ExternalLink, RefreshCw } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/custom/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/custom/Card';
import { Badge } from '@/components/ui/custom/Badge';
import { ANALYSIS_MODULES } from '@/types';
import Link from 'next/link';

export default function AnalysisSection() {
    const { state, actions } = useAppContext();

    // Set initial state based on modules marked as 'enabled' in the config.
    const [selectedModules, setSelectedModules] = useState<string[]>(
        () => {
            const recommended = ANALYSIS_MODULES
                .filter(m => m.enabled)
                .map(m => m.key);

            // Automatically include dependencies for recommended modules.
            const fullSelection = new Set(recommended);
            recommended.forEach(key => {
                const module = ANALYSIS_MODULES.find(m => m.key === key);
                module?.deps?.forEach(dep => fullSelection.add(dep));
            });
            return Array.from(fullSelection);
        }
    );

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);

    const isAnalysisTaskActive = useMemo(() => {
        return state.tasks.some(
            (task) =>
                task.name?.toLowerCase().includes('analysis') &&
                (task.status === 'pending' || task.status === 'running')
        );
    }, [state.tasks]);

    // MODIFIED: Enhanced toggle logic to handle dependencies.
    const toggleModule = (moduleKey: string) => {
        setSelectedModules(prev => {
            const newSelected = new Set(prev);
            const isAdding = !newSelected.has(moduleKey);

            if (isAdding) {
                // Add the module and its dependencies.
                const moduleToAdd = ANALYSIS_MODULES.find(m => m.key === moduleKey);
                newSelected.add(moduleKey);
                moduleToAdd?.deps?.forEach(dep => newSelected.add(dep));
            } else {
                // Remove the module and any modules that depend on it.
                newSelected.delete(moduleKey);
                ANALYSIS_MODULES.forEach(mod => {
                    if (mod.deps?.includes(moduleKey) && newSelected.has(mod.key)) {
                        newSelected.delete(mod.key);
                    }
                });
            }
            return Array.from(newSelected);
        });
    };

    const handleStartAnalysis = async () => {
        setIsSubmitting(true);
        try {
            await actions.startAnalysis(selectedModules);
        } catch (error) {
            console.error("Analysis failed to start:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const downloadReport = () => {
        if (state.analysisResult) {
            const blob = new Blob([JSON.stringify(state.analysisResult, null, 2)], { type: 'application/json' });
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

    const filteredMessages = state.filteredData?.messages || [];

    if (filteredMessages.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">
                    No filtered messages found. Please filter your messages first.
                </p>
            </div>
        );
    }

    const isLoading = isSubmitting || isAnalysisTaskActive;

    return (
        <div className="space-y-6">
            {!state.analysisResult ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <BarChart3 className="h-5 w-5" />
                            <span>Analysis Configuration</span>
                            <Badge variant="secondary">
                                {selectedModules.length}/{ANALYSIS_MODULES.length}
                            </Badge>
                        </CardTitle>
                        <p className="text-sm text-muted-foreground pt-1">
                            Select modules to run on your {filteredMessages.length.toLocaleString()} filtered messages.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {ANALYSIS_MODULES.map((module) => {
                                const isSelected = selectedModules.includes(module.key);
                                // Check if all dependencies are met for this module.
                                const dependencies = module.deps || [];
                                const areDepsMet = dependencies.every(dep => selectedModules.includes(dep));
                                const isDisabled = !areDepsMet;

                                return (
                                    <motion.div
                                        key={module.key}
                                        whileHover={{ scale: isDisabled ? 1 : 1.02 }}
                                        whileTap={{ scale: isDisabled ? 1 : 0.98 }}
                                        onClick={() => !isDisabled && toggleModule(module.key)}
                                        className={`p-4 rounded-lg border transition-all duration-200 ${
                                            isSelected ? 'border-primary bg-primary/5' : 'border-border'
                                        } ${
                                            isDisabled
                                                ? 'opacity-60 cursor-not-allowed bg-muted/30 hover:border-border'
                                                : 'cursor-pointer hover:border-primary/50'
                                        }`}
                                        title={isDisabled ? `Requires: ${dependencies.join(', ')}` : module.description}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center space-x-2">
                                                {isSelected ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                                                <h3 className="font-medium text-sm">{module.name}</h3>
                                            </div>
                                            {module.enabled && <Badge variant="outline" className="text-xs">Recommended</Badge>}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {module.description}
                                            {isDisabled && (
                                                <span className="block font-semibold text-amber-500 mt-1">
                                                    Requires '{ANALYSIS_MODULES.find(m => m.key === dependencies[0])?.name || dependencies[0]}'
                                                </span>
                                            )}
                                        </p>
                                    </motion.div>
                                );
                            })}
                        </div>
                        <div className="flex justify-between items-center mt-6">
                            <div className="space-x-2">
                                <Button variant="outline" size="sm" onClick={() => setSelectedModules(ANALYSIS_MODULES.map(m => m.key))}>Select All</Button>
                                <Button variant="outline" size="sm" onClick={() => setSelectedModules([])}>Clear All</Button>
                                <Button variant="outline" size="sm" onClick={() => setSelectedModules(ANALYSIS_MODULES.filter(m => m.enabled).map(m => m.key))}>Recommended</Button>
                            </div>
                            <Button onClick={handleStartAnalysis} disabled={selectedModules.length === 0 || isLoading} loading={isLoading} icon={Play} size="lg">
                                {isLoading ? 'Analyzing...' : 'Start Analysis'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <BarChart3 className="h-5 w-5 text-green-500" />
                                <span>Analysis Complete</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center p-6 rounded-lg bg-muted/30">
                                <h4 className="font-medium text-lg mb-2">
                                    Report Generated!
                                </h4>
                                <p className="text-sm text-muted-foreground mb-4">
                                    A report with {Object.keys(state.analysisResult || {}).length} modules has been created.
                                </p>
                                <div className="flex justify-center items-center gap-4">
                                    <Button icon={Download} variant="outline" onClick={downloadReport}>Download Report</Button>
                                    <Link href="/dashboard" passHref>
                                        <Button icon={ExternalLink} loading={isNavigating} onClick={() => setIsNavigating(true)}>
                                            {isNavigating ? 'Loading...' : 'View Full Dashboard'}
                                        </Button>
                                    </Link>
                                </div>
                                <div className="mt-6 border-t pt-4">
                                    <Button variant="link" size="sm" className="text-muted-foreground" icon={RefreshCw} onClick={actions.clearAnalysis} loading={isLoading}>
                                        Clear Report & Re-run Analysis
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </div>
    );
}
