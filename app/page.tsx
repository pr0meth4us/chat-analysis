'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, BarChart3, Search, Filter, LayoutDashboard } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { Tabs } from '@/components/ui/custom/BreadCrumbTabs';
import { Card } from '@/components/ui/custom/Card';
import { AppHeader } from '@/components/layout/AppHeader';
import UploadSection from '@/components/Upload/UploadSection';
import FilterSection from '@/components/Filter/FilterSection';
import AnalysisSection from '@/components/Analysis/AnalysisSection';
import SearchSection from '@/components/Search/SearchSection';
import TaskProgress from '@/components/Tasks/TaskProgress';
import { useRouter } from 'next/navigation';
import DataExport from "@/components/Export/DataExport";

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}


export default function HomePage() {
  const { state } = useAppContext();
  const [activeTab, setActiveTab] = useState('upload');
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const prevProcessedCount = usePrevious(state.processedMessages.length);
  const prevFilteredCount = usePrevious(state.filteredMessages.length);

  useEffect(() => {
    const newProcessedCount = state.processedMessages.length;
    const newFilteredCount = state.filteredMessages.length;

    const justProcessed = (prevProcessedCount ?? 0) === 0 && newProcessedCount > 0;
    if (justProcessed && activeTab === 'upload') {
      setActiveTab('filter');
    }

    const justFiltered = (prevFilteredCount ?? 0) === 0 && newFilteredCount > 0;
    if (justFiltered && activeTab === 'filter') {
      setActiveTab('analyze');
    }
  }, [state.processedMessages.length, state.filteredMessages.length, activeTab, prevProcessedCount, prevFilteredCount]);

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
              {/* --- MODIFICATION: Component name corrected --- */}
              <DataExport />
            </motion.div>

            {/* --- MODIFICATION: The entire block of 3 cards has been removed as requested --- */}

          </div>
        </main>
      </div>
  );
}