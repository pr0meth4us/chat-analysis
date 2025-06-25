'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '../layout/Card';
import { InfoPopup } from '../layout/InfoPopup';
import { formatDate } from '@/utils/formatDate';

interface ContributionsCalendarProps {
    data: { date: string; count: number }[];
    initialYear: string;
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const ContributionsCalendar: React.FC<ContributionsCalendarProps> = ({ data, initialYear }) => {
    const availableYears = useMemo(() => {
        const yearsSet = new Set(data.map(item => new Date(item.date + 'T00:00:00Z').getUTCFullYear().toString()));
        return Array.from(yearsSet).sort((a, b) => parseInt(b) - parseInt(a)); // Sort descending
    }, [data]);
    
    const [selectedYear, setSelectedYear] = useState(initialYear || (availableYears.length > 0 ? availableYears[0] : new Date().getFullYear().toString()));
    const [tooltip, setTooltip] = useState<{ content: string; x: number; y: number } | null>(null);

    const { weeks, monthLabels, totalContributions } = useMemo(() => {
        const filteredData = data.filter(item => new Date(item.date + 'T00:00:00Z').getUTCFullYear().toString() === selectedYear);
        const weeks = Array.from({ length: 53 }, () => Array(7).fill({ count: null, date: null }));
        const monthLabels: { label: string; weekIndex: number }[] = [];
        let lastMonth = -1;

        filteredData.forEach(item => {
            const date = new Date(item.date + 'T00:00:00Z');
            if (isNaN(date.getTime())) return;
            const dayOfWeek = date.getUTCDay(); // Sunday = 0, Saturday = 6
            const firstDayOfYear = new Date(selectedYear + '-01-01T00:00:00Z');
            const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
            const weekIndex = Math.floor((pastDaysOfYear + firstDayOfYear.getUTCDay()) / 7);
            
            const currentMonth = date.getUTCMonth();
            if (currentMonth !== lastMonth) {
                monthLabels.push({ label: monthNames[currentMonth], weekIndex: weekIndex });
                lastMonth = currentMonth;
            }

            if (weekIndex >= 0 && weekIndex < 53) {
                weeks[weekIndex][dayOfWeek] = { count: item.count, date: item.date };
            }
        });
        
        const totalContributions = filteredData.reduce((sum, item) => sum + item.count, 0);

        return { weeks, monthLabels, totalContributions };
    }, [data, selectedYear]);

    const maxCount = Math.max(...data.map(d => d.count), 1);
    
    const getColor = (count: number | null) => {
        if (count === null) return 'bg-gray-800';
        if (count === 0) return 'bg-gray-700';
        const intensity = Math.min(count / (maxCount * 0.75), 1);
        if (intensity < 0.25) return 'bg-green-900';
        if (intensity < 0.5) return 'bg-green-700';
        if (intensity < 0.75) return 'bg-green-500';
        return 'bg-green-400';
    };

    const handleMouseEnter = (day: { count: number | null, date: string | null }, e: React.MouseEvent) => {
        if (day.date && day.count !== null) {
            const rect = e.currentTarget.getBoundingClientRect();
            setTooltip({
                content: `${day.count} contributions on ${formatDate(day.date)}`,
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
                    style={{ top: tooltip.y - 35, left: tooltip.x - 50 }}
                >
                    {tooltip.content}
                </div>
            )}
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-200">{totalContributions.toLocaleString()} contributions in {selectedYear}</h3>
                 <div className="flex items-center gap-4">
                    <InfoPopup text="This calendar shows daily message frequency, similar to a GitHub contribution graph. Darker shades indicate more messages on that day." />
                     <div className="flex items-center gap-3">
                         {availableYears.map(year => (
                             <button
                                 key={year}
                                 onClick={() => setSelectedYear(year)}
                                 className={`text-sm ${selectedYear === year ? 'text-blue-400 font-bold' : 'text-gray-400 hover:text-blue-400'}`}
                             >
                                 {year}
                             </button>
                         ))}
                     </div>
                 </div>
            </div>
            
            <div className="flex gap-3">
                <div className="flex flex-col justify-between text-xs text-gray-400 pt-6 pr-2">
                    <span>Mon</span>
                    <span>Wed</span>
                    <span>Fri</span>
                </div>

                <div className="w-full">
                    <div className="grid grid-cols-[repeat(53,minmax(0,1fr))] gap-1 mb-1">
                         {monthLabels.map(({ label, weekIndex }) => (
                            <div key={label} className="text-xs text-gray-400" style={{ gridColumnStart: weekIndex + 1 }}>
                                {label}
                            </div>
                        ))}
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
                </div>
            </div>

            <div className="flex justify-end items-center gap-2 mt-2 text-xs text-gray-400">
                <span>Less</span>
                <div className="w-3 h-3 rounded-sm bg-gray-700"></div>
                <div className="w-3 h-3 rounded-sm bg-green-900"></div>
                <div className="w-3 h-3 rounded-sm bg-green-700"></div>
                <div className="w-3 h-3 rounded-sm bg-green-500"></div>
                <div className="w-3 h-3 rounded-sm bg-green-400"></div>
                <span>More</span>
            </div>
        </Card>
    );
};