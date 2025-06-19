'use client';

import {useEffect, useRef, useState} from 'react';
import { motion } from 'framer-motion';
import {MessageCircle, BarChart3, Search, Filter, LayoutDashboard} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { Tabs } from '@/components/ui/Tabs';
import { Card } from '@/components/ui/Card';
import ExportData from '@/components/Export/ExportData';
import UploadSection from '@/components/Upload/UploadSection';
import FilterSection from '@/components/Filter/FilterSection';
import AnalysisSection from '@/components/Analysis/AnalysisSection';
import SearchSection from '@/components/Search/SearchSection';
import TaskProgress from '@/components/Tasks/TaskProgress';
import {TaskStatus} from "@/types";
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { state } = useAppContext();
  const [activeTab, setActiveTab] = useState('upload');
  const router = useRouter();
  const prevTasksRef = useRef<TaskStatus[]>([]);

  // Effect for automatic tab switching
  useEffect(() => {
    const completedProcessingTask = state.tasks.find(currentTask => {
      const prevTask = prevTasksRef.current.find(t => t.task_id === currentTask.task_id);
      return prevTask && (prevTask.status === 'running' || prevTask.status === 'pending') && currentTask.status === 'completed';
    });

    // Check if the task message indicates it was a file processing task
    if (completedProcessingTask && completedProcessingTask.message?.includes('Processing complete') && activeTab === 'upload') {
      setActiveTab('filter');
    }

    prevTasksRef.current = state.tasks;
  }, [state.tasks, activeTab]);

  const tabs = [
    {
      id: 'upload',
      label: 'Upload',
      icon: MessageCircle,
      disabled: false,
    },
    {
      id: 'filter',
      label: 'Filter',
      icon: Filter,
      disabled: !state.processedMessages.length,
    },
    {
      id: 'analyze',
      label: 'Analyze',
      icon: BarChart3,
      disabled: !state.filteredMessages.length,
    },
    {
      id: 'search',
      label: 'Search',
      icon: Search,
      disabled: !state.filteredMessages.length,
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      disabled: !state.analysisResult,
    }
  ];

  const handleTabChange = (tabId: string) => {
    if (tabId === 'dashboard') {
      router.push('/dashboard');
    } else {
      setActiveTab(tabId);
    }
  };


  return (
      <div className="min-h-screen p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
              initial={{opacity: 0, y: -20}}
              animate={{opacity: 1, y: 0}}
              className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold gradient-text mb-2">
              Message Analyzer
            </h1>
            <p className="text-muted-foreground text-lg">
              Analyze and explore your message data with powerful insights
            </p>
          </motion.div>

          {/* Task Progress */}
          <TaskProgress/>

          {/* Main Content */}
          <motion.div
              initial={{opacity: 0, y: 20}}
              animate={{opacity: 1, y: 0}}
              transition={{delay: 0.2}}
          >
            <Card className="glass p-6">
              <Tabs
                  tabs={tabs}
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
              />
              <div className="mt-6">
                {activeTab === 'upload' && <UploadSection/>}
                {activeTab === 'filter' && <FilterSection/>}
                {activeTab === 'analyze' && <AnalysisSection/>}
                {activeTab === 'search' && <SearchSection/>}
              </div>
            </Card>
          </motion.div>
          <motion.div
              initial={{opacity: 0, y: 20}}
              animate={{opacity: 1, y: 0}}
              transition={{delay: 0.5}}
          >
            <ExportData/>
          </motion.div>


          {/* Stats Cards */}
          <motion.div
              initial={{opacity: 0, y: 20}}
              animate={{opacity: 1, y: 0}}
              transition={{delay: 0.4}}
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