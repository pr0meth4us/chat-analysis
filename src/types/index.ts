import { LucideIcon } from 'lucide-react';

// MetricCard Props
export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: string;
  trend?: number;
}

// IntensityBadge Props
export interface IntensityBadgeProps {
  intensity: 'EXTREMELY_HIGH' | 'HIGH' | 'MEDIUM' | string;
}

// GhostPeriodCard Props
export interface GhostPeriod {
  duration_hours: number;
  last_sender_before_ghost: string;
  who_broke_silence: string;
  last_message_before_ghost: string;
  first_message_after_ghost: string;
}

export interface GhostPeriodCardProps {
  ghost: GhostPeriod;
  index: number;
}

// WordCloudCard Props
export interface WordCloudCardProps {
  words: [string, number][];
  title: string;
}

// CollapsibleSection Props
export interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

// ChatAnalysisDashboard Props
export interface ChatAnalysisDashboardProps {
  data: AnalysisResult;
}

// SenderGroup Props
export interface SenderGroupProps {
  title: string;
  icon: LucideIcon;
  senders: string[];
  onDrop: (sender: string) => void;
  onRemove: (sender: string) => void;
  color?: 'blue' | 'green' | 'red' | 'gray';
}

// SenderCard Props
export interface SenderCardProps {
  sender: string;
  onDragStart: (e: React.DragEvent, sender: string) => void;
}

// FileUpload Props
export interface FileUploadProps {
  onFilesUploaded: (files: File[]) => void;
  isUploading: boolean;
}

// AnalysisResults Props
export interface AnalysisResultsProps {
  results: AnalysisResult | null;
}

// Message Type
export interface Message {
  sender: string;
  content: string;
  timestamp?: string;
}

// UploadResponse
export interface UploadResponse {
  message: string;
  unique_senders: string[];
  processed_messages: Message[];
}

// AnalysisResult – rough fallback
export interface AnalysisResult {
  [key: string]: any;
}
