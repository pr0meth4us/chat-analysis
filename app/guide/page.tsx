'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/custom/Card';
import { CodeBlock } from '@/components/ui/custom/CodeBlock';
import { FileUp, Filter, BarChart, Search, BrainCircuit, HeartHandshake, Eye, Info } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/custom/Button';

const Section: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5 }}
    >
        <Card className="glass-effect overflow-hidden">
            <CardHeader className="bg-slate-900/30">
                <CardTitle className="flex items-center gap-3 text-2xl text-primary">
                    <Icon className="h-7 w-7" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 text-slate-300 prose prose-invert prose-sm md:prose-base max-w-none prose-p:leading-relaxed prose-a:text-primary hover:prose-a:text-primary/80 prose-code:bg-slate-800 prose-code:rounded prose-code:px-1.5 prose-code:py-1 prose-code:font-mono">
                {children}
            </CardContent>
        </Card>
    </motion.div>
);

export default function GuidePage() {
    const genericJsonSample = `[
  {
    "sender": "Alex",
    "message": "Hey, are we still on for tonight?",
    "timestamp": "2024-10-26 18:30:00"
  },
  {
    "sender": "Ben",
    "message": "Yeah, absolutely! Looking forward to it.",
    "timestamp": "2024-10-26 18:31:15",
    "source": "WhatsApp"
  }
]`;

    return (
        <div className="min-h-screen p-4 sm:p-6 md:p-8">
            <div className="max-w-4xl mx-auto space-y-12">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-5xl font-bold gradient-text mb-3">
                        User Guide & Methodology
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Your comprehensive guide to understanding and using the Chat Analyzer. Unlock the stories hidden in your conversations.
                    </p>
                    <Link href="/" className="mt-6 inline-block">
                        <Button variant="outline">Back to App</Button>
                    </Link>
                </motion.div>

                <Section title="The Workflow: A Step-by-Step Guide" icon={BrainCircuit}>
                    <p>
                        This tool transforms your raw chat logs into an interactive dashboard in a few simple steps. Here's the recommended workflow:
                    </p>
                    <ol className="list-decimal space-y-4 pl-5">
                        <li>
                            <strong>Upload Data:</strong> Start at the <strong className="text-primary">Upload</strong> tab. Drag and drop your chat history file(s) (`.json`, `.html`, or a `.zip` archive). The app will parse them, standardize timestamps, and remove duplicates.
                        </li>
                        <li>
                            <strong>Filter Senders:</strong> Go to the <strong className="text-primary">Filter</strong> tab. Here, you'll see a list of all participants. Group them into "Me" (for your messages) and "Other", or remove senders (like bots) from the analysis entirely. This step is crucial for accurate head-to-head metrics.
                        </li>
                        <li>
                            <strong>Analyze:</strong> On the <strong className="text-primary">Analyze</strong> tab, select the analysis modules you're interested in and click "Start Analysis". The backend will process your filtered data.
                        </li>
                        <li>
                            <strong>Explore:</strong> Once the analysis is complete, dive into the results! The <strong className="text-primary">Search</strong> tab allows you to count keywords or find specific messages. For the full picture, head to the <strong className="text-primary">Dashboard</strong> for a rich, interactive visualization of your chat's DNA.
                        </li>
                    </ol>
                </Section>

                <Section title="Supported Data Formats" icon={FileUp}>
                    <p>
                        The analyzer is designed to be flexible. You can upload chat history files from various sources. The parser will attempt to automatically identify the platform.
                    </p>
                    <h4 className="font-semibold text-xl mt-4">Standard JSON Format</h4>
                    <p>
                        For best results, provide a JSON file that is an array of message objects. Each object should have three key fields: <code>sender</code>, <code>message</code>, and <code>timestamp</code>. An optional <code>source</code> key can be added.
                    </p>
                    <CodeBlock>{genericJsonSample}</CodeBlock>
                    <h4 className="font-semibold text-xl mt-4">Other Formats</h4>
                    <ul className="list-disc pl-5">
                        <li><strong>HTML Exports:</strong> Official data exports from platforms like Telegram, Instagram, and Facebook Messenger are supported. The parser looks for common class names and structures.</li>
                        <li><strong>ZIP Archives:</strong> You can upload a `.zip` file containing multiple `.json` or `.html` files. The app will extract and process all of them.</li>
                    </ul>
                    <blockquote className="border-l-4 border-primary pl-4 italic text-slate-400 mt-4">
                        <strong>Note:</strong> The timestamp parser is very robust and can handle dozens of formats (e.g., "Oct 26, 2024, 6:30 PM", "2024-10-26T18:30:00Z", etc.).
                    </blockquote>
                </Section>

                <Section title="Interpreting the Analysis" icon={Eye}>
                    <p>
                        The dashboard is where your data comes to life. Here's how to interpret some of the key metrics:
                    </p>
                    <div className="space-y-6 mt-6">
                        <div>
                            <h4 className="font-semibold text-xl flex items-center gap-2"><HeartHandshake className="text-primary"/> Relationship DNA</h4>
                            <p>This tab provides a high-level score for the "health" of the conversation.</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li><strong>Relationship Score:</strong> A composite score from 0-100 based on four pillars. A score above 70 suggests a highly engaged, balanced, and consistent relationship.</li>
                                <li><strong>Balance Score:</strong> How evenly is the conversation distributed? A score of 100 means everyone contributes an equal number of messages.</li>
                                <li><strong>Consistency Score:</strong> How regular is the communication? A high score means you chat consistently day-to-day, rather than in short, intense bursts followed by long silences.</li>
                                <li><strong>Responsiveness Score:</strong> How quickly do participants reply to each other? This score is higher when the median response time is low.</li>
                                <li><strong>Engagement Score:</strong> A measure of raw activity (messages per day). A higher score means more frequent communication.</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-xl flex items-center gap-2"><BarChart className="text-primary"/> Temporal Patterns</h4>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li><strong>Contribution Calendar:</strong> This GitHub-style heatmap shows your daily messaging frequency. Darker squares mean more messages on that day. It's great for spotting patterns over a year.</li>
                                <li><strong>Streaks:</strong> Identifies the longest periods of <em>consecutive</em> daily messaging. See what topics started, ended, and resumed these streaks.</li>
                                <li><strong>Ghosting:</strong> Finds significant gaps in conversation (e.g., >12 hours of silence) and shows who eventually broke the silence and with what message.</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-xl flex items-center gap-2"><Info className="text-primary"/> About The Project</h4>
                            <p>
                                This Chat Analyzer was built by Nick S. as a personal project to explore the intersection of data analysis, web development, and human communication. It leverages a Python/Flask backend for heavy lifting and a Next.js/React frontend for a dynamic user experience.
                            </p>
                            <p className="mt-2">
                                The goal is to provide a powerful, private, and insightful way for anyone to explore the stories and patterns hidden within their digital conversations. All processing is done ephemerally in your browser's session and on the server, and no data is permanently stored or reviewed.
                            </p>
                        </div>
                    </div>
                </Section>

            </div>
        </div>
    );
}