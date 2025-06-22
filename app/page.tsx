'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, BarChart3, Search, Filter, LayoutDashboard } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { Tabs } from '@/components/ui/custom/BreadCrumbTabs';
import { Card } from '@/components/ui/custom/Card';
import { AppHeader } from '@/components/layout/AppHeader';
import ExportData from '@/components/Export/ExportData';
import UploadSection from '@/components/Upload/UploadSection';
import FilterSection from '@/components/Filter/FilterSection';
import AnalysisSection from '@/components/Analysis/AnalysisSection';
import SearchSection from '@/components/Search/SearchSection';
import TaskProgress from '@/components/Tasks/TaskProgress';
import { useRouter } from 'next/navigation';
import { Footer } from '@/components/layout/Footer';

export default function HomePage() {
  const { state } = useAppContext();
  const [activeTab, setActiveTab] = useState('upload');
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  // Use refs to track the previous state of the data counts.
  const prevProcessedCount = useRef(state.processedMessages.length);
  const prevFilteredCount = useRef(state.filteredMessages.length);

  // --- AUTO-SWITCH LOGIC (DEBUG MODE) ---
  useEffect(() => {
    const newProcessedCount = state.processedMessages.length;
    const newFilteredCount = state.filteredMessages.length;
    const shouldSwitchToFilter = prevProcessedCount.current === 0 && newProcessedCount > 0 && activeTab === 'upload';
    if (shouldSwitchToFilter) {
      setActiveTab('filter');
    }
    const shouldSwitchToAnalyze = prevFilteredCount.current === 0 && newFilteredCount > 0 && activeTab === 'filter';

    if (shouldSwitchToAnalyze) {
      setActiveTab('analyze');
    }

    if (prevProcessedCount.current !== newProcessedCount) {
      prevProcessedCount.current = newProcessedCount;
    }
    if (prevFilteredCount.current !== newFilteredCount) {
      prevFilteredCount.current = newFilteredCount;
    }

  }, [state.processedMessages.length, state.filteredMessages.length, activeTab]);

  const tabs = [
    { id: 'upload', label: '1. Upload', icon: MessageCircle, disabled: false },
    { id: 'filter', label: '2. Filter', icon: Filter, disabled: state.processedMessages.length === 0 },
    { id: 'analyze', label: '3. Analyze', icon: BarChart3, disabled: state.filteredMessages.length === 0 },
    { id: 'search', label: '4. Search', icon: Search, disabled: state.filteredMessages.length === 0 },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, disabled: !state.analysisResult, loading: isNavigating }
  ];

  const handleTabChange = (tabId: string) => {
    if (tabId === 'dashboard') {
      setIsNavigating(true);
      router.push('/dashboard');
    } else {
      setActiveTab(tabId);
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
      <div className="min-h-screen flex flex-col">
        <main className="flex-grow p-4 sm:p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            <AppHeader statusText={getCurrentStepStatus()} />
            <TaskProgress />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
              <Card className="glass p-6">
                <Tabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />
                <div className="mt-8 min-h-[20rem]">
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
                transition={{ delay: 0.3 }}
                className="mt-6"
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
        </main>
      </div>
  );
}