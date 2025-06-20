import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon?: LucideIcon;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onTabChange, className = '' }: TabsProps) {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex space-x-1 rounded-xl bg-muted p-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && onTabChange(tab.id)}
              className={`relative flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                tab.disabled
                  ? 'cursor-not-allowed opacity-50'
                  : 'cursor-pointer'
              }`}
              disabled={tab.disabled}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-background rounded-lg shadow-sm"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}

              <div className="relative flex items-center space-x-2">
                {Icon && <Icon className="h-4 w-4" />}
                <span>{tab.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}