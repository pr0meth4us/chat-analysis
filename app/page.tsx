'use client';

import { useEffect, useRef, useState, FC, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, BarChart3, Search, Filter, LayoutDashboard, Trash2, UploadCloud } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { Tabs } from '@/components/ui/custom/BreadCrumbTabs';
import { Card } from '@/components/ui/custom/Card';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import ExportData from '@/components/Export/ExportData';
import UploadSection from '@/components/Upload/UploadSection';
import FilterSection from '@/components/Filter/FilterSection';
import AnalysisSection from '@/components/Analysis/AnalysisSection';
import SearchSection from '@/components/Search/SearchSection';
import TaskProgress from '@/components/Tasks/TaskProgress';
import { TaskStatus } from "@/types";
import { useRouter } from 'next/navigation';

// --- NEW DataRestoreSection COMPONENT ---
const DataRestoreSection: FC = () => {
  const { actions, state } = useAppContext();
  const [statusMessage, setStatusMessage] = useState('');

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>, action: (file: File) => Promise<void>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatusMessage(`Restoring ${file.name}...`);
    try {
      await action(file);
      setStatusMessage(`${file.name} restored successfully!`);
    } catch (error: any) {
      setStatusMessage(`Error restoring ${file.name}: ${error.message}`);
    }
  };

  return (
      <Card className="glass p-6">
        <h3 className="text-xl font-semibold mb-4 text-primary">Restore Previous Session</h3>
        <p className="text-muted-foreground text-sm mb-4">
          Used the app before? Upload your previously downloaded JSON files to continue where you left off.
        </p>
        <div className="space-y-4">
          <div>
            <label htmlFor="processed-file" className="text-sm font-medium">Processed Messages (.json)</label>
            <Input
                id="processed-file"
                type="file"
                accept=".json"
                onChange={(e) => handleFileChange(e, actions.insertProcessedMessages)}
                className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="filtered-file" className="text-sm font-medium">Filtered Messages (.json)</label>
            <Input
                id="filtered-file"
                type="file"
                accept=".json"
                onChange={(e) => handleFileChange(e, actions.insertFilteredMessages)}
                className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="report-file" className="text-sm font-medium">Analysis Report (.json)</label>
            <Input
                id="report-file"
                type="file"
                accept=".json"
                onChange={(e) => handleFileChange(e, actions.insertAnalysisReport)}
                className="mt-1"
            />
          </div>
        </div>
        {statusMessage && <p className="text-sm text-muted-foreground mt-4">{statusMessage}</p>}
      </Card>
  );
};
// --- END NEW COMPONENT ---


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
      const completedTaskNames = recentlyCompletedTasks.map(t => t.name || t.stage || 'unknown').join(', ');
      console.log(`Tasks completed: ${completedTaskNames}. Evaluating tab switch from '${activeTab}'.`);

      if (activeTab === 'upload' && state.processedMessages.length > 0) {
        console.log("Auto-switching from Upload to Filter tab");
        setActiveTab('filter');
        return;
      }

      if (activeTab === 'filter' && state.filteredMessages.length > 0) {
        console.log("Auto-switching from Filter to Analyze tab");
        setActiveTab('analyze');
        return;
      }

      if (activeTab === 'analyze' && state.analysisResult) {
        console.log("Analysis complete - results available on Dashboard");
        return;
      }
    }

    if (activeTab === 'upload' && state.processedMessages.length > 0 && !state.tasks.some(t => t.status === 'running' || t.status === 'pending')) {
      console.log("Data available: Auto-switching from Upload to Filter tab");
      setActiveTab('filter');
    } else if (activeTab === 'filter' && state.filteredMessages.length > 0 && !state.tasks.some(t => t.status === 'running' || t.status === 'pending')) {
      console.log("Filtered data available: Auto-switching from Filter to Analyze tab");
      setActiveTab('analyze');
    }
  }, [state.tasks, state.processedMessages.length, state.filteredMessages.length, state.analysisResult, activeTab, autoSwitchEnabled]);

  const tabs = [
    { id: 'upload', label: 'Upload', icon: MessageCircle, disabled: false, completed: state.processedMessages.length > 0 },
    { id: 'filter', label: 'Filter', icon: Filter, disabled: !state.processedMessages.length, completed: state.filteredMessages.length > 0 },
    { id: 'analyze', label: 'Analyze', icon: BarChart3, disabled: !state.filteredMessages.length, completed: !!state.analysisResult },
    { id: 'search', label: 'Search', icon: Search, disabled: !state.filteredMessages.length, completed: false },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, disabled: !state.analysisResult, completed: false }
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

  const handleClearSession = () => {
    if (window.confirm('Are you sure you want to clear all data for this session? This action cannot be undone.')) {
      actions.clearSession();
      setActiveTab('upload');
      setAutoSwitchEnabled(true);
    }
  };

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
          <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-between items-center mb-8"
          >
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">Message Analyzer</h1>
              <p className="text-muted-foreground text-lg">Analyze and explore your message data with powerful insights</p>
              <p className="text-sm text-primary font-medium mt-1">{getCurrentStepStatus()}</p>
            </div>
            <Button variant="destructive" onClick={handleClearSession}><Trash2/>Clear Session</Button>
          </motion.div>

          <TaskProgress />

          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
          >
            <Card className="glass p-6">
              <Tabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange}/>
              <div className="mt-6">
                {activeTab === 'upload' && <UploadSection />}
                {activeTab === 'filter' && <FilterSection />}
                {activeTab === 'analyze' && <AnalysisSection />}
                {activeTab === 'search' && <SearchSection />}
              </div>
            </Card>
          </motion.div>

          {/* --- RENDER THE NEW RESTORE SECTION --- */}
          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6"
          >
            <DataRestoreSection />
          </motion.div>
          {/* --- END RESTORE SECTION --- */}


          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
          >
            <ExportData />
          </motion.div>

          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6"
          >
            <Card className="glass p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{state.processedMessages.length}</div>
                <div className="text-sm text-muted-foreground">Processed Messages</div>
              </div>
            </Card>
            <Card className="glass p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{state.filteredMessages.length}</div>
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
