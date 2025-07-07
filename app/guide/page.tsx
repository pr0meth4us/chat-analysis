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
    Target,
    Download,
    Play,
    Eye
} from 'lucide-react';
import Link from 'next/link';
import { FaFacebook, FaTelegram, FaDiscord } from 'react-icons/fa';
import { JsonCodeBlock } from '@/components/ui/custom/JsonCodeBlock';

const FeatureCard: React.FC<{
    title: string;
    description: string;
    icon: React.ReactNode;
    isExpanded: boolean;
    onToggle: () => void;
    details: string[];
}> = ({ title, description, icon, isExpanded, onToggle, details }) => (
    <Card className="glass overflow-hidden hover:shadow-lg transition-all duration-300">
        <CardHeader
            className="cursor-pointer bg-slate-900/20 hover:bg-slate-900/30 transition-colors"
            onClick={onToggle}
        >
            <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-3">
                    {icon}
                    <span>{title}</span>
                </div>
                {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
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
                        variants={{ open: { opacity: 1, height: 'auto' }, collapsed: { opacity: 0, height: 0 } }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="pt-4 mt-4 border-t border-slate-700/50">
                            <ul className="space-y-2 text-sm text-slate-300">
                                {details.map((detail, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                                        <div dangerouslySetInnerHTML={{ __html: detail }} />
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
            <h3 className="text-lg font-semibold mb-2 text-foreground">{step}. {title}</h3>
            <p className="text-muted-foreground">{description}</p>
        </div>
    </motion.div>
);

export default function GuidePage() {
    const [isNavigating, setIsNavigating] = useState(false);
    const [expandedState, setExpandedState] = useState<Record<string, boolean>>({});

    const toggleExpansion = (key: string) => {
        setExpandedState(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const analysisFeatures = [
        { key: 'temporal', title: 'Temporal Analysis', description: 'Understand when and how often you communicate.', icon: <Clock className="h-6 w-6 text-primary" />, details: ['Daily and hourly messaging patterns with interactive heatmaps.', 'Conversation streaks and consistency tracking.', 'Ghost periods to identify long silences in your conversations.', 'Peak activity hours and communication rhythms.'] },
        { key: 'content', title: 'Content & Language', description: 'Dive deep into what you actually talk about.', icon: <MessageCircle className="h-6 w-6 text-primary" />, details: ['Word frequency analysis and common phrases (n-grams).', 'Emoji usage patterns and emotional expressions.', 'Question patterns - who asks what and how often.', 'Attachment analysis to see what files are shared.'] },
        { key: 'sentiment', title: 'Sentiment & Emotion', description: 'Discover the emotional tone of your conversations.', icon: <Heart className="h-6 w-6 text-primary" />, details: ['Lexicon-based sentiment scoring (positive/negative).', 'Advanced ML emotion detection (joy, anger, sadness, etc.).', 'Emotional trajectory over time to see how moods change.', 'Sentiment balance between participants.'] },
        { key: 'interaction', title: 'Interaction Patterns', description: 'Analyze how you communicate with each other.', icon: <Users className="h-6 w-6 text-primary" />, details: ['Conversation starter analysis - who initiates discussions.', 'Response time patterns and communication dynamics.', 'Rapid-fire exchange detection for quick back-and-forths.', 'Turn-taking balance and conversation flow.'] },
        { key: 'thematic', title: 'Thematic Analysis', description: 'Identify recurring themes and conversation topics.', icon: <Lightbulb className="h-6 w-6 text-primary" />, details: ['Argument detection and conflict patterns.', 'Romance and affection indicators.', 'Happiness and celebration moments.', 'Automated topic modeling to discover hidden themes.'] },
        { key: 'overview', title: 'Dataset Overview', description: 'Get a high-level statistical summary of your data.', icon: <FileText className="h-6 w-6 text-primary" />, details: ['Total message and reaction counts.', 'Date range and total days of communication.', 'Breakdown of messages by chat platform.', 'Key milestones like the very first and last messages.'] },
        { key: 'relationship', title: 'Relationship Score', description: 'Get a comprehensive view of your communication health.', icon: <TrendingUp className="h-6 w-6 text-primary" />, details: ['Overall relationship score (0-100) based on multiple factors.', 'Communication balance and mutual engagement.', 'Consistency and reliability metrics.', 'Responsiveness and attention indicators.'] }
    ];

    const exportInstructions = [
        {
            key: 'meta',
            title: 'Facebook & Instagram',
            // @ts-ignore
            icon: <FaFacebook className="h-6 w-6 text-primary" />,
            description: "Meta allows you to download your information, including messages, from a central hub.",
            details: ["Go to the Meta 'Download Your Information' page: <a href='https://www.facebook.com/dyi' target='_blank' rel='noopener noreferrer' class='text-blue-400 hover:underline'>facebook.com/dyi</a>.", "Select a date range and ensure the format is set to <strong>JSON</strong> and media quality is set to low for a smaller file size.", "Deselect all categories except for <strong>'Messages'</strong>.", "Submit your request. Meta will notify you when your file is ready to download."]
        },
        {
            key: 'telegram',
            title: 'Telegram',
            // @ts-ignore
            icon: <FaTelegram className="h-6 w-6 text-primary" />,
            description: "Telegram chat history can be exported using their official Desktop application.",
            details: ["Download and install the <strong>Telegram Desktop</strong> app for your PC or Mac.", "Open the specific chat you want to export.", "Click the three dots (<strong>...</strong>) in the top-right corner, then select <strong>'Export chat history'</strong>.", "Choose the data types you want (photos, videos, etc.), ensure the format is <strong>HTML ('Machine-readable')</strong>, and start the export."]
        },
        {
            key: 'discord',
            title: 'Discord',
            // @ts-ignore
            icon: <FaDiscord className="h-6 w-6 text-primary" />,
            description: "Discord allows you to request a copy of all your data, including messages.",
            details: ["Go to User Settings > <strong>Privacy & Safety</strong>.", "Scroll to the bottom and click the <strong>'Request all of my data'</strong> button.", "You will receive an email with a link to download your data package within 30 days.", "Your messages will be located in the `messages` folder inside the downloaded ZIP file."]
        },
    ];

    const jsonSample = [
        { "sender": "Alex", "message": "Hey, are we still on for tonight?", "timestamp": "2024-10-26 18:30:00" },
        { "sender": "Ben", "message": "Yeah, absolutely! Looking forward to it.", "timestamp": "2024-10-26 18:31:15", "source": "WhatsApp" }
    ];

    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-grow">
                <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8">
                    <AppHeader statusText="Learn how to unlock insights from your conversations"/>

                    <motion.div initial={{opacity: 0, y: -10}} animate={{opacity: 1, y: 0}} className="mb-8">
                        <Link href="/" passHref>
                            <Button variant="outline" icon={ArrowLeft} loading={isNavigating}
                                    onClick={() => setIsNavigating(true)}>
                                {isNavigating ? 'Loading...' : 'Back to Analyzer'}
                            </Button>
                        </Link>
                    </motion.div>

                    <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}}
                                className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4"><span
                            className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Chat Analyzer Guide</span>
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">Transform your conversations into
                            meaningful insights. Discover patterns, emotions, and relationships hidden in your chat
                            history.</p>
                    </motion.div>

                    <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.1}}
                                className="mb-16">
                        <Card className="glass overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-primary/10 to-blue-400/10"><CardTitle
                                className="flex items-center gap-3 text-2xl"><Zap className="h-7 w-7 text-primary"/>Quick
                                Start Guide</CardTitle></CardHeader>
                            <CardContent className="pt-8">
                                <div className="grid gap-8 md:gap-12"><WorkflowStep step={1} title="Upload Your Data"
                                                                                    description="Start by uploading your chat history files directly into your browser. Chat Analyzer supports JSON, HTML exports, and ZIP archives from popular platforms."
                                                                                    icon={FileUp}
                                                                                    delay={0}/><WorkflowStep step={2}
                                                                                                             title="Filter Participants"
                                                                                                             description="Group participants into 'Me' and 'Other' categories, or remove bots and unwanted senders for cleaner analysis."
                                                                                                             icon={Filter}
                                                                                                             delay={0.1}/><WorkflowStep
                                    step={3} title="Run Analysis"
                                    description="Select your desired analysis modules and let Chat Analyzer's AI process your conversations to extract meaningful insights."
                                    icon={BrainCircuit} delay={0.2}/><WorkflowStep step={4} title="Explore Results"
                                                                                   description="Dive into your interactive dashboard, search for keywords, and discover the stories your conversations tell."
                                                                                   icon={BarChart3} delay={0.3}/></div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.2}}
                                className="mb-16">
                        <div className="text-center mb-8"><h2 className="text-3xl font-bold mb-4">How to Export Your
                            Chat Data</h2><p className="text-muted-foreground max-w-2xl mx-auto">Follow these guides to
                            download your chat history from popular platforms.</p></div>
                        <div className="grid gap-6">
                            {exportInstructions.map((feature, index) => (
                                <motion.div key={feature.key} initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}}
                                            transition={{delay: 0.3 + index * 0.1}}>
                                    <FeatureCard
                                        title={feature.title}
                                        description={feature.description}
                                        icon={feature.icon}
                                        details={feature.details}
                                        isExpanded={!!expandedState[feature.key]}
                                        onToggle={() => toggleExpansion(feature.key)}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.3}}
                                className="mb-16">
                        <div className="text-center mb-8"><h2 className="text-3xl font-bold mb-4">Analysis Features</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">Explore the powerful analysis
                                capabilities that transform your raw chat data into actionable insights.</p></div>
                        <div className="grid gap-6 md:grid-cols-2">
                            {analysisFeatures.map((feature, index) => (
                                <motion.div key={feature.key} initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}}
                                            transition={{delay: 0.4 + index * 0.1}}>
                                    <FeatureCard
                                        title={feature.title}
                                        description={feature.description}
                                        icon={feature.icon}
                                        details={feature.details}
                                        isExpanded={!!expandedState[feature.key]}
                                        onToggle={() => toggleExpansion(feature.key)}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.4}}
                                className="mb-16">
                        <Card className="glass overflow-hidden">
                            <CardHeader className="bg-slate-900/20"><CardTitle
                                className="flex items-center gap-3 text-2xl"><FileText
                                className="h-7 w-7 text-primary"/>Supported Data Formats</CardTitle></CardHeader>
                            <CardContent className="pt-6">
                                <div className="grid gap-8 md:grid-cols-2">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-3 text-primary">Standard JSON
                                            Format</h3>
                                        <p className="text-muted-foreground mb-4">For best results, provide a JSON array
                                            with message objects containing sender, message, and timestamp fields.</p>
                                        <div className="bg-slate-900/50 rounded-lg border border-slate-700">
                                            <JsonCodeBlock data={jsonSample}/>
                                        </div>
                                        <div className="mt-6">
                                            <p className="text-muted-foreground mb-3">
                                                Want to try Chat Analyzer without your own data? Download the sample
                                                file to get started right away.
                                            </p>
                                            <a href="/sample-data/processed_messages.json"
                                               download="processed_messages.json">
                                                <Button variant="outline" icon={Download}>
                                                    Download Sample JSON
                                                </Button>
                                            </a>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold mb-3 text-primary">Other Supported
                                            Formats</h3>
                                        <div className="space-y-4">
                                            <div className="p-4 bg-slate-900/30 rounded-lg border border-slate-700"><h4
                                                className="font-semibold mb-2">HTML Exports</h4><p
                                                className="text-sm text-muted-foreground">Official exports from
                                                Telegram, Instagram, Facebook Messenger, and other platforms.</p></div>
                                            <div className="p-4 bg-slate-900/30 rounded-lg border border-slate-700"><h4
                                                className="font-semibold mb-2">ZIP Archives</h4><p
                                                className="text-sm text-muted-foreground">Upload multiple files at once
                                                - Chat Analyzer will extract and process everything automatically.</p>
                                            </div>
                                            <div className="p-4 bg-slate-900/30 rounded-lg border border-slate-700"><h4
                                                className="font-semibold mb-2">Flexible Timestamps</h4><p
                                                className="text-sm text-muted-foreground">Chat Analyzer's parser handles
                                                dozens of timestamp formats automatically.</p></div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                    <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.05}}
                                className="mb-16">
                        <Card
                            className="glass overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-blue-400/5">
                            <CardHeader className="bg-gradient-to-r from-primary/10 to-blue-400/10">
                                <CardTitle className="flex items-center gap-3 text-2xl">
                                    <Eye className="h-7 w-7 text-primary"/>
                                    Try the Demo
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                                        See Chat Analyzer in action with our interactive demo. Explore a fully populated
                                        dashboard with synthesized conversation data to understand what insights await
                                        your own chat history.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                        <Link href="/demo" passHref>
                                            <Button size="lg" icon={Play} className="w-full sm:w-auto">
                                                View Interactive Demo
                                            </Button>
                                        </Link>
                                        <a href="/sample-data/mock-analysis-report.json"
                                           download="mock-analysis-report.json">
                                            <Button variant="outline" size="lg" icon={Download}
                                                    className="w-full sm:w-auto">
                                                Download Mock Data
                                            </Button>
                                        </a>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}