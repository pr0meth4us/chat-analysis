'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils';

interface Tab {
  id: string;
  label: string;
  icon?: React.ElementType;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
  containerClassName?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onTabChange,
  className,
  containerClassName,
}: TabsProps) {
  return (
    <div className={cn('w-full', containerClassName)}>
      <div
        className={cn(
          'relative flex items-center justify-start border-b border-muted',
          className
        )}
      >
        <AnimatePresence>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              disabled={tab.disabled}
              className={cn(
                'relative flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                activeTab === tab.id
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {/* Render icon if it exists */}
              {tab.icon && React.createElement(tab.icon, { className: 'mr-2 h-4 w-4' })}
              {tab.label}

              {/* Animated underline for the active tab */}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="active-tab-underline"
                  className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
