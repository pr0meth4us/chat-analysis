'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, BarChart3, Search, Filter, LayoutDashboard, Trash2 } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { Tabs } from '@/components/ui/BreadCrumbTabs';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button'; // Make sure this import is correct
import ExportData from '@/components/Export/ExportData';
import UploadSection from '@/components/Upload/UploadSection';
import FilterSection from '@/components/Filter/FilterSection';
import AnalysisSection from '@/components/Analysis/AnalysisSection';
import SearchSection from '@/components/Search/SearchSection';
import TaskProgress from '@/components/Tasks/TaskProgress';
import { TaskStatus } from "@/types";
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { state, actions } = useAppContext(); // Destructure actions from context
  const [activeTab, setActiveTab] = useState('upload');
  const router = useRouter();
  const prevTasksRef = useRef<TaskStatus[]>([]);

  // Effect for automatic tab switching based on task completion
  useEffect(() => {
    const completedTask = state.tasks.find(currentTask => {
      const prevTask = prevTasksRef.current.find(t => t.task_id === currentTask.task_id);
      return prevTask && (prevTask.status === 'running' || prevTask.status === 'pending') && currentTask.status === 'completed';
    });

    if (completedTask) {
      console.log(`Task '${completedTask.name}' just completed, evaluating tab switch.`);
      if (completedTask.name === 'process' && activeTab === 'upload') {
        console.log("Switching to filter tab.");
        setActiveTab('filter');
      }
    }
    prevTasksRef.current = state.tasks;
  }, [state.tasks, activeTab]);

  const tabs = [
    { id: 'upload', label: 'Upload', icon: MessageCircle, disabled: false },
    { id: 'filter', label: 'Filter', icon: Filter, disabled: !state.processedMessages.length },
    { id: 'analyze', label: 'Analyze', icon: BarChart3, disabled: !state.filteredMessages.length },
    { id: 'search', label: 'Search', icon: Search, disabled: !state.filteredMessages.length },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, disabled: !state.analysisResult }
  ];

  const handleTabChange = (tabId: string) => {
    if (tabId === 'dashboard') {
      router.push('/dashboard');
    } else {
      setActiveTab(tabId);
    }
  };

  const handleClearSession = () => {
    if (window.confirm('Are you sure you want to clear all data for this session? This action cannot be undone.')) {
      actions.clearSession();
      setActiveTab('upload'); // Reset to the first tab
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* --- NEW HEADER SECTION --- */}
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
          </div>
          <Button
            variant="destructive"
            onClick={handleClearSession}
            icon={Trash2}
          >
            Clear Session
          </Button>
        </motion.div>
        {/* --- END NEW HEADER SECTION --- */}

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