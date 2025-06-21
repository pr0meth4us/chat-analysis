import React, { useState } from 'react';
import { Card } from '../layout/Card';
import { InfoPopup } from '../layout/InfoPopup';
import { formatDate } from '@/utils/formatDate';

interface ContributionsCalendarProps {
    data: { date: string; count: number }[];
    year: string;
}

export const ContributionsCalendar: React.FC<ContributionsCalendarProps> = ({ data, year }) => {
    const [tooltip, setTooltip] = useState<{ content: string; x: number; y: number } | null>(null);

    const weeks = Array.from({ length: 53 }, () => Array(7).fill({ count: null, date: null }));

    data.forEach(item => {
        const date = new Date(item.date + 'T00:00:00Z');
        if (isNaN(date.getTime()) || date.getUTCFullYear().toString() !== year) return;
        const dayOfWeek = date.getUTCDay();
        const firstDayOfYear = new Date(year + '-01-01T00:00:00Z');
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        const weekIndex = Math.floor((pastDaysOfYear + firstDayOfYear.getUTCDay()) / 7);

        if (weekIndex >= 0 && weekIndex < 53) {
            weeks[weekIndex][dayOfWeek] = { count: item.count, date: item.date };
        }
    });

    const maxCount = Math.max(...data.map(d => d.count), 1);
    const getColor = (count: number | null) => {
        if (count === null) return 'bg-gray-700/50';
        if (count === 0) return 'bg-gray-700';
        const intensity = Math.min(count / (maxCount * 0.75), 1);
        if (intensity < 0.25) return 'bg-blue-900';
        if (intensity < 0.5) return 'bg-blue-700';
        if (intensity < 0.75) return 'bg-blue-500';
        return 'bg-blue-300';
    };

    const handleMouseEnter = (day: { count: number | null, date: string | null }, e: React.MouseEvent) => {
        if (day.date && day.count !== null) {
            const rect = e.currentTarget.getBoundingClientRect();
            setTooltip({
                content: `${day.count} messages on ${formatDate(day.date)}`,
                x: rect.left + window.scrollX,
                y: rect.top + window.scrollY,
            });
        }
    };
    const handleMouseLeave = () => setTooltip(null);

    return (
        <Card>
            {tooltip && (
                <div
                    className="absolute z-10 bg-gray-900 text-white text-xs px-2 py-1 rounded-md shadow-lg pointer-events-none"
                    style={{ top: tooltip.y - 30, left: tooltip.x - 30 }}
                >
                    {tooltip.content}
                </div>
            )}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-200">{data.length} active days in {year}</h3>
                <InfoPopup text="This calendar shows daily message frequency, similar to a GitHub contribution graph. Darker shades indicate more messages on that day." />
            </div>
            <div className="grid grid-cols-[repeat(53,minmax(0,1fr))] gap-1">
                {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="grid grid-rows-7 gap-1">
                        {week.map((day, dayIndex) => (
                            <div
                                key={`${weekIndex}-${dayIndex}`}
                                className={`w-full aspect-square rounded-sm ${getColor(day.count)}`}
                                onMouseEnter={(e) => handleMouseEnter(day, e)}
                                onMouseLeave={handleMouseLeave}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </Card>
    );
};
