// src/components/layout/Footer.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Github } from 'lucide-react';

export const Footer: React.FC = () => {
    return (
        <footer className="mt-24 py-8 bg-background/20 border-t border-border/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 text-muted-foreground">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-foreground">Message Analyzer</h3>
                        <p className="text-sm">
                            A personal project by Nick S. designed for insightful, private, and ephemeral analysis of chat data.
                        </p>
                        <p className="text-xs pt-2">
                            © 2025 Nick S. All Rights Reserved.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-semibold text-foreground">Navigate</h4>
                        <ul className="space-y-1 text-sm">
                            <li><Link href="/" className="hover:text-primary transition-colors">Analyzer</Link></li>
                            <li><Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
                            <li><Link href="/guide" className="hover:text-primary transition-colors">User Guide</Link></li>
                        </ul>
                    </div>

                    {/* Right Section: Connect */}
                    <div className="space-y-2">
                        <h4 className="font-semibold text-foreground">Connect</h4>
                        <ul className="space-y-1 text-sm">
                            <li>
                                <a
                                    href="https://github.com/nicksng"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 hover:text-primary transition-colors"
                                >
                                    <Github className="h-4 w-4" />
                                    GitHub
                                </a>
                            </li>
                        </ul>
                        <p className="text-xs pt-2">
                            Built with <span className="font-semibold text-foreground">Next.js</span> & <span className="font-semibold text-foreground">Flask</span>.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};