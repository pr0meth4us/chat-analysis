// app/page.tsx
'use client';

import { useEffect, useRef, useState, FC } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, BarChart3, Search, Filter, LayoutDashboard } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { Tabs } from '@/components/ui/custom/BreadCrumbTabs';
import { Card } from '@/components/ui/custom/Card';
import { AppHeader } from '@/components/layout/AppHeader'; // New Header
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
  useEffect(() => {
    if (!autoSwitchEnabled) return;

    const recentlyCompletedTasks = state.tasks.filter(currentTask => {
      const prevTask = prevTasksRef.current.find(t => t.task_id === currentTask.task_id);
      return prevTask &&
          (prevTask.status === 'running' || prevTask.status === 'pending') &&
          currentTask.status === 'completed';
    });

    prevTasksRef.current = [...state.tasks];

    if (recentlyCompletedTasks.length > 0) {
      if (activeTab === 'upload' && state.processedMessages.length > 0) {
        setActiveTab('filter');
      } else if (activeTab === 'filter' && state.filteredMessages.length > 0) {
        setActiveTab('analyze');
      }
    }

    if (activeTab === 'upload' && state.processedMessages.length > 0 && !state.tasks.some(t => t.status === 'running' || t.status === 'pending')) {
      setActiveTab('filter');
    } else if (activeTab === 'filter' && state.filteredMessages.length > 0 && !state.tasks.some(t => t.status === 'running' || t.status === 'pending')) {
      setActiveTab('analyze');
    }

  }, [state.tasks, state.processedMessages.length, state.filteredMessages.length, state.analysisResult, activeTab, autoSwitchEnabled]);

  const tabs = [
    { id: 'upload', label: '1. Upload', icon: MessageCircle, disabled: false },
    { id: 'filter', label: '2. Filter', icon: Filter, disabled: state.processedMessages.length === 0 },
    { id: 'analyze', label: '3. Analyze', icon: BarChart3, disabled: state.filteredMessages.length === 0 },
    { id: 'search', label: '4. Search', icon: Search, disabled: state.filteredMessages.length === 0 },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, disabled: !state.analysisResult }
  ];

  const handleTabChange = (tabId: string) => {
    if (tabId === 'dashboard') {
      router.push('/dashboard');
    } else {
      setActiveTab(tabId);
      setAutoSwitchEnabled(false);
      setTimeout(() => setAutoSwitchEnabled(true), 5000);
    }
  };

  const getCurrentStepStatus = () => {
    const hasRunningTasks = state.tasks.some(t => t.status === 'running' || t.status === 'pending');
    if (hasRunningTasks) return "Processing...";
    if (state.analysisResult) return "Analysis complete! Go to Dashboard.";
    if (state.filteredMessages.length > 0) return "Ready for analysis or search.";
    if (state.processedMessages.length > 0) return "Ready for filtering.";
    return "Upload your data to begin.";
  };

  return (
      <div className="min-h-screen p-4 sm:p-6 md:p-8">
        <div className="max-w-6xl mx-auto">

          <AppHeader statusText={getCurrentStepStatus()} />

          <TaskProgress />

          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
          >
            <Card className="glass p-6">
              <Tabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange}/>
              <div className="mt-8 min-h-[20rem]">
                {activeTab === 'upload' && <UploadSection />}
                {activeTab === 'filter' && <FilterSection />}
                {activeTab === 'analyze' && <AnalysisSection />}
                {activeTab === 'search' && <SearchSection />}
              </div>
            </Card>
          </motion.div>

          {/* Export Data Section remains, as it's a useful utility */}
          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6"
          >
            <ExportData />
          </motion.div>

          {/* Summary stats remain at the bottom */}
          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6"
          >
            <Card className="glass p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{state.processedMessages.length.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Processed Messages</div>
              </div>
            </Card>
            <Card className="glass p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{state.filteredMessages.length.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Filtered Messages</div>
              </div>
            </Card>
            <Card className="glass p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{state.senders.length}</div>
                <div className="text-sm text-muted-foreground">Unique Senders</div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
  );
}