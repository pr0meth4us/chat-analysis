// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProvider } from './providers';
import { Footer } from '@/components/layout/Footer';
import React from "react";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Message Analyzer',
    description: 'Analyze and explore your message data with powerful insights',
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
        <body className={inter.className}>
        <AppProvider>
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex flex-col">
                <main className="flex-grow">
                    {children}
                </main>
                <Footer />
            </div>
        </AppProvider>
        </body>
        </html>
    );
}