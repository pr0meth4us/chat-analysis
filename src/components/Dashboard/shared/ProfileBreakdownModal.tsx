'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users } from 'lucide-react';
import { Card } from '../layout/Card';

const getInitials = (name: string) => {
    const words = name.split(' ');
    if (words.length > 1) {
        return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

// Helper to render platform-specific icons
import {
    FaFacebookF,
    FaInstagram,
    FaTelegramPlane,
    FaDiscord,
    FaCommentAlt,
} from 'react-icons/fa';
import { FaTiktok } from 'react-icons/fa6';

const PlatformIcon = ({ platform }: { platform: string }) => {
    switch (platform.toLowerCase()) {
        case 'facebook':
            // @ts-ignore
            return <FaFacebookF className="h-4 w-4 text-blue-600" />;
        case 'instagram':
            // @ts-ignore
            return <FaInstagram className="h-4 w-4 text-pink-500" />;
        case 'telegram':
            // @ts-ignore
            return <FaTelegramPlane className="h-4 w-4 text-sky-400" />;
        case 'discord':
            // @ts-ignore
            return <FaDiscord className="h-4 w-4 text-indigo-500" />;
        case 'tiktok':
            // @ts-ignore
            return <FaTiktok className="h-4 w-4 text-gray-900" />;
        case 'imessage':
            // @ts-ignore
            return <FaCommentAlt className="h-4 w-4 text-green-500" />;
        default:
            // @ts-ignore
            return <FaCommentAlt className="h-4 w-4 text-gray-400" />;
    }
};


interface ProfileBreakdownModalProps {
    isOpen: boolean;
    onClose: () => void;
    participants: Record<string, string>;
}

export const ProfileBreakdownModal: React.FC<ProfileBreakdownModalProps> = ({ isOpen, onClose, participants }) => {
    const participantData = useMemo(() => {
        return Object.entries(participants)
            .map(([name, details]) => {
                const [platform, countStr] = (details as string).split(', ');
                return { name, platform, count: parseInt(countStr) || 0 };
            })
            .sort((a, b) => b.count - a.count);
    }, [participants]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="relative w-full max-w-lg"
                    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                >
                    <Card>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-200 flex items-center">
                                <Users className="mr-2 h-5 w-5" />
                                Sender Profile Breakdown ({participantData.length})
                            </h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-white">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="space-y-1 pr-2 overflow-y-auto" style={{ maxHeight: '60vh' }}>
                            {participantData.map(({ name, platform, count }) => (
                                <div key={name} className="flex items-center justify-between p-2.5 rounded-lg transition-colors hover:bg-gray-800/50">
                                    <div className="flex items-center gap-3 w-1/2 flex-shrink-0">
                                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center font-bold text-xs text-gray-300">
                                            {getInitials(name)}
                                        </div>
                                        <span className="font-medium text-gray-300 truncate" title={name}>{name}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm w-1/2 justify-end">
                                        <div className="flex items-center gap-1.5 text-gray-400">
                                            <PlatformIcon platform={platform} />
                                            <span>{platform}</span>
                                        </div>
                                        <span className="font-mono text-xs bg-gray-700/80 text-gray-200 px-2.5 py-1 rounded-md w-24 text-right">
                                            {count.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};