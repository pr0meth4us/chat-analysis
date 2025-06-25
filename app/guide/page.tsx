'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/shadcn/card';
import { Button } from '@/components/ui/custom/Button';
import { AppHeader } from '@/components/layout/AppHeader';
import {
    FileUp,
    Filter,
    BarChart3,
    BrainCircuit,
    Clock,
    MessageCircle,
    Heart,
    TrendingUp,
    Users,
    Lightbulb,
    ArrowLeft,
    ChevronDown,
    ChevronUp,
    FileText,
    Zap,
    Target
} from 'lucide-react';
import Link from 'next/link';

const FeatureCard: React.FC<{
    title: string;
    description: string;
    icon: React.ElementType;
    isExpanded: boolean;
    onToggle: () => void;
    details: string[];
}> = ({ title, description, icon: Icon, isExpanded, onToggle, details }) => (
    <Card className="glass overflow-hidden hover:shadow-lg transition-all duration-300">
        <CardHeader
            className="cursor-pointer bg-slate-900/20 hover:bg-slate-900/30 transition-colors"
            onClick={onToggle}
        >
            <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-3">
                    <Icon className="h-6 w-6 text-primary" />
                    <span>{title}</span>
                </div>
                {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
            </CardTitle>
        </CardHeader>

        <CardContent className="pt-4">
            <p className="text-muted-foreground mb-3">{description}</p>

            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.section
                        key="content"
                        initial="collapsed"
                        animate="open"
                        exit="collapsed"
                        variants={{
                            open: { opacity: 1, height: 'auto' },
                            collapsed: { opacity: 0, height: 0 }
                        }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="pt-4 mt-4 border-t border-slate-700/50">
                            <ul className="space-y-2 text-sm text-slate-300">
                                {details.map((detail, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                                        {detail}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </motion.section>
                )}
            </AnimatePresence>
        </CardContent>
    </Card>
);


const WorkflowStep: React.FC<{
    step: number;
    title: string;
    description: string;
    icon: React.ElementType;
    delay: number;
}> = ({ step, title, description, icon: Icon, delay }) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay }}
        className="flex gap-4 items-start"
    >
        <div className="flex-shrink-0 w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center border-2 border-primary/30">
            <Icon className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2 text-foreground">
                {step}. {title}
            </h3>
            <p className="text-muted-foreground">{description}</p>
        </div>
    </motion.div>
);

export default function GuidePage() {
    const [isNavigating, setIsNavigating] = useState(false);
    const [expandedFeatures, setExpandedFeatures] = useState<Record<string, boolean>>({});

    const toggleFeature = (featureKey: string) => {
        setExpandedFeatures(prev => ({
            ...prev,
            [featureKey]: !prev[featureKey]
        }));
    };

    const analysisFeatures = [
        { key: 'temporal', title: 'Temporal Analysis', description: 'Understand when and how often you communicate', icon: Clock, details: ['Daily and hourly messaging patterns with interactive heatmaps', 'Conversation streaks and consistency tracking', 'Ghost periods - identify long silences in your conversations', 'Peak activity hours and communication rhythms'] },
        { key: 'content', title: 'Content & Language', description: 'Dive deep into what you actually talk about', icon: MessageCircle, details: ['Word frequency analysis and common phrases (n-grams)', 'Emoji usage patterns and emotional expressions', 'Link sharing habits and external content references', 'Question patterns - who asks what and how often'] },
        { key: 'sentiment', title: 'Sentiment & Emotion', description: 'Discover the emotional tone of your conversations', icon: Heart, details: ['Lexicon-based sentiment scoring (positive/negative)', 'Advanced ML emotion detection (joy, anger, sadness, fear, surprise)', 'Emotional trajectory over time', 'Sentiment balance between participants'] },
        { key: 'interaction', title: 'Interaction Patterns', description: 'Analyze how you communicate with each other', icon: Users, details: ['Conversation starter analysis - who initiates discussions', 'Response time patterns and communication dynamics', 'Rapid-fire exchange detection', 'Turn-taking balance and conversation flow'] },
        { key: 'thematic', title: 'Thematic Analysis', description: 'Identify recurring themes and conversation topics', icon: Lightbulb, details: ['Argument detection and conflict patterns', 'Romance and affection indicators', 'Happiness and celebration moments', 'Custom keyword-based theme detection'] },
        { key: 'relationship', title: 'Relationship Score', description: 'Get a comprehensive view of your communication health', icon: TrendingUp, details: ['Overall relationship score (0-100) based on multiple factors', 'Conversation balance and mutual engagement', 'Consistency and reliability metrics', 'Responsiveness and attention indicators'] }
    ];

    const jsonSample = `[
  { "sender": "Alex", "message": "Hey, are we still on for tonight?", "timestamp": "2024-10-26 18:30:00" },
  { "sender": "Ben", "message": "Yeah, absolutely! Looking forward to it.", "timestamp": "2024-10-26 18:31:15", "source": "WhatsApp" }
]`;

    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-grow">
                <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8">
                    <AppHeader statusText="Learn how to unlock insights from your conversations" />

                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                        <Link href="/" passHref>
                            <Button variant="outline" icon={ArrowLeft} loading={isNavigating} onClick={() => setIsNavigating(true)}>
                                {isNavigating ? 'Loading...' : 'Back to Analyzer'}
                            </Button>
                        </Link>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4"><span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Chat Analyzer Guide</span></h1>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">Transform your conversations into meaningful insights. Discover patterns, emotions, and relationships hidden in your chat history.</p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-16">
                        <Card className="glass overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-primary/10 to-blue-400/10"><CardTitle className="flex items-center gap-3 text-2xl"><Zap className="h-7 w-7 text-primary" />Quick Start Guide</CardTitle></CardHeader>
                            <CardContent className="pt-8"><div className="grid gap-8 md:gap-12"><WorkflowStep step={1} title="Upload Your Data" description="Start by uploading your chat history files. We support JSON, HTML exports, and ZIP archives from popular platforms." icon={FileUp} delay={0} /><WorkflowStep step={2} title="Filter Participants" description="Group participants into 'Me' and 'Other' categories, or remove bots and unwanted senders for cleaner analysis." icon={Filter} delay={0.1} /><WorkflowStep step={3} title="Run Analysis" description="Select your desired analysis modules and let our AI process your conversations to extract meaningful insights." icon={BrainCircuit} delay={0.2} /><WorkflowStep step={4} title="Explore Results" description="Dive into your interactive dashboard, search for keywords, and discover the stories your conversations tell." icon={BarChart3} delay={0.3} /></div></CardContent>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-16">
                        <div className="text-center mb-8"><h2 className="text-3xl font-bold mb-4">Analysis Features</h2><p className="text-muted-foreground max-w-2xl mx-auto">Explore the powerful analysis capabilities that transform your raw chat data into actionable insights.</p></div>
                        <div className="grid gap-6 md:grid-cols-2">
                            {analysisFeatures.map((feature, index) => (
                                <motion.div key={feature.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + index * 0.1 }}>
                                    <FeatureCard
                                        title={feature.title}
                                        description={feature.description}
                                        icon={feature.icon}
                                        details={feature.details}
                                        isExpanded={!!expandedFeatures[feature.key]}
                                        onToggle={() => toggleFeature(feature.key)}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-16">
                        <Card className="glass overflow-hidden"><CardHeader className="bg-slate-900/20"><CardTitle className="flex items-center gap-3 text-2xl"><FileText className="h-7 w-7 text-primary" />Supported Data Formats</CardTitle></CardHeader><CardContent className="pt-6"><div className="grid gap-6 md:grid-cols-2"><div><h3 className="text-lg font-semibold mb-3 text-primary">Standard JSON Format</h3><p className="text-muted-foreground mb-4">For best results, provide a JSON array with message objects containing sender, message, and timestamp fields.</p><div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700"><pre className="text-sm text-slate-300 overflow-x-auto"><code>{jsonSample}</code></pre></div></div><div><h3 className="text-lg font-semibold mb-3 text-primary">Other Supported Formats</h3><div className="space-y-4"><div className="p-4 bg-slate-900/30 rounded-lg border border-slate-700"><h4 className="font-semibold mb-2">HTML Exports</h4><p className="text-sm text-muted-foreground">Official exports from Telegram, Instagram, Facebook Messenger, and other platforms.</p></div><div className="p-4 bg-slate-900/30 rounded-lg border border-slate-700"><h4 className="font-semibold mb-2">ZIP Archives</h4><p className="text-sm text-muted-foreground">Upload multiple files at once - we'll extract and process everything automatically.</p></div><div className="p-4 bg-slate-900/30 rounded-lg border border-slate-700"><h4 className="font-semibold mb-2">Flexible Timestamps</h4><p className="text-sm text-muted-foreground">Our parser handles dozens of timestamp formats automatically.</p></div></div></div></div></CardContent></Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mb-8">
                        <Card className="glass overflow-hidden"><CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10"><CardTitle className="flex items-center gap-3 text-2xl"><Target className="h-7 w-7 text-primary" />About Chat Analyzer</CardTitle></CardHeader><CardContent className="pt-6"><div className="prose prose-invert max-w-none"><p className="text-muted-foreground leading-relaxed mb-4">Chat Analyzer is a powerful tool designed to help you understand your digital conversations better. Whether you're analyzing personal relationships, team communication patterns, or just curious about your messaging habits, our platform provides deep insights through advanced natural language processing and machine learning techniques.</p><p className="text-muted-foreground leading-relaxed">All analysis happens locally and securely. Your data remains private and is never stored permanently on our servers. We believe in empowering users with insights while maintaining complete privacy and control over their personal communications.</p></div></CardContent></Card>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}