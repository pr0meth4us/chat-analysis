'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, BarChart3, Search, Filter, LayoutDashboard, Trash2 } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { Tabs } from '@/components/ui/custom/BreadCrumbTabs';
import { Card } from '@/components/ui/custom/Card';
import { Button } from '@/components/ui/shadcn/button';
import ExportData from '@/components/Export/ExportData';
import UploadSection from '@/components/Upload/UploadSection';
import FilterSection from '@/components/Filter/FilterSection';
import AnalysisSection from '@/components/Analysis/AnalysisSection';
import SearchSection from '@/components/Search/SearchSection';
import TaskProgress from '@/components/Tasks/TaskProgress';
import { TaskStatus } from "@/types";
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { state, actions } = useAppContext();
  const [activeTab, setActiveTab] = useState('upload');
  const router = useRouter();
  const prevTasksRef = useRef<TaskStatus[]>([]);
  const [autoSwitchEnabled, setAutoSwitchEnabled] = useState(true);

  // Enhanced effect for automatic tab switching based on task completion and data availability
  useEffect(() => {
    if (!autoSwitchEnabled) return;

    // Check for recently completed tasks
    const recentlyCompletedTasks = state.tasks.filter(currentTask => {
      const prevTask = prevTasksRef.current.find(t => t.task_id === currentTask.task_id);
      return prevTask &&
          (prevTask.status === 'running' || prevTask.status === 'pending') &&
          currentTask.status === 'completed';
    });

    // Update the reference for next comparison
    prevTasksRef.current = [...state.tasks];

    // Auto-switch logic based on completed tasks and available data
    if (recentlyCompletedTasks.length > 0) {
      const completedTaskNames = recentlyCompletedTasks.map(t => t.name || t.stage || 'unknown').join(', ');
      console.log(`Tasks completed: ${completedTaskNames}. Evaluating tab switch from '${activeTab}'.`);

      // Upload -> Filter: When processing is complete and we have processed messages
      if (activeTab === 'upload' && state.processedMessages.length > 0) {
        console.log("Auto-switching from Upload to Filter tab");
        setActiveTab('filter');
        return;
      }

      // Filter -> Analyze: When filtering is complete and we have filtered messages
      if (activeTab === 'filter' && state.filteredMessages.length > 0) {
        console.log("Auto-switching from Filter to Analyze tab");
        setActiveTab('analyze');
        return;
      }

      // Analyze -> Dashboard: When analysis is complete and we have results
      if (activeTab === 'analyze' && state.analysisResult) {
        console.log("Analysis complete - results available on Dashboard");
        // Don't auto-switch to dashboard, just show notification
        // User can manually navigate when ready
        return;
      }
    }

    // Also check for data availability changes (in case tasks completed before component mounted)
    if (activeTab === 'upload' && state.processedMessages.length > 0 && !state.tasks.some(t => t.status === 'running' || t.status === 'pending')) {
      console.log("Data available: Auto-switching from Upload to Filter tab");
      setActiveTab('filter');
    } else if (activeTab === 'filter' && state.filteredMessages.length > 0 && !state.tasks.some(t => t.status === 'running' || t.status === 'pending')) {
      console.log("Filtered data available: Auto-switching from Filter to Analyze tab");
      setActiveTab('analyze');
    }
  }, [state.tasks, state.processedMessages.length, state.filteredMessages.length, state.analysisResult, activeTab, autoSwitchEnabled]);

  // Define tabs with proper enabling logic
  const tabs = [
    {
      id: 'upload',
      label: 'Upload',
      icon: MessageCircle,
      disabled: false,
      completed: state.processedMessages.length > 0
    },
    {
      id: 'filter',
      label: 'Filter',
      icon: Filter,
      disabled: !state.processedMessages.length,
      completed: state.filteredMessages.length > 0
    },
    {
      id: 'analyze',
      label: 'Analyze',
      icon: BarChart3,
      disabled: !state.filteredMessages.length,
      completed: !!state.analysisResult
    },
    {
      id: 'search',
      label: 'Search',
      icon: Search,
      disabled: !state.filteredMessages.length,
      completed: false // Search doesn't have a "completed" state
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      disabled: !state.analysisResult,
      completed: false // Dashboard is a destination, not a step
    }
  ];

  const handleTabChange = (tabId: string) => {
    if (tabId === 'dashboard') {
      router.push('/dashboard');
    } else {
      setActiveTab(tabId);
      // Disable auto-switching when user manually changes tabs
      setAutoSwitchEnabled(false);
      // Re-enable after a delay to allow for user-driven navigation
      setTimeout(() => setAutoSwitchEnabled(true), 5000);
    }
  };

  const handleClearSession = () => {
    if (window.confirm('Are you sure you want to clear all data for this session? This action cannot be undone.')) {
      actions.clearSession();
      setActiveTab('upload'); // Reset to the first tab
      setAutoSwitchEnabled(true); // Re-enable auto-switching
    }
  };

  // Get current step status for user feedback
  const getCurrentStepStatus = () => {
    const hasProcessedMessages = state.processedMessages.length > 0;
    const hasFilteredMessages = state.filteredMessages.length > 0;
    const hasAnalysisResult = !!state.analysisResult;
    const hasRunningTasks = state.tasks.some(t => t.status === 'running' || t.status === 'pending');

    if (hasRunningTasks) return "Processing...";
    if (hasAnalysisResult) return "Analysis complete - View Dashboard";
    if (hasFilteredMessages) return "Ready for analysis";
    if (hasProcessedMessages) return "Ready for filtering";
    return "Upload your data to begin";
  };

  return (
      <div className="min-h-screen p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-between items-center mb-8"
          >
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">
                Message Analyzer
              </h1>
              <p className="text-muted-foreground text-lg">
                Analyze and explore your message data with powerful insights
              </p>
              <p className="text-sm text-primary font-medium mt-1">
                {getCurrentStepStatus()}
              </p>
            </div>
            <Button
                variant="destructive"
                onClick={handleClearSession}
            >
              <Trash2/>Clear Session
            </Button>
          </motion.div>

          {/* Task Progress */}
          <TaskProgress />

          {/* Main Content */}
          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
          >
            <Card className="glass p-6">
              <Tabs
                  tabs={tabs}
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
              />
              <div className="mt-6">
                {activeTab === 'upload' && <UploadSection />}
                {activeTab === 'filter' && <FilterSection />}
                {activeTab === 'analyze' && <AnalysisSection />}
                {activeTab === 'search' && <SearchSection />}
              </div>
            </Card>
          </motion.div>

          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
          >
            <ExportData />
          </motion.div>

          {/* Stats Cards */}
          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6"
          >
            <Card className="glass p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {state.processedMessages.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Processed Messages
                </div>
              </div>
            </Card>

            <Card className="glass p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {state.filteredMessages.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Filtered Messages
                </div>
              </div>
            </Card>

            <Card className="glass p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {state.senders.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Unique Senders
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
  );
}