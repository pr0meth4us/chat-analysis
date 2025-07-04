import React, { ReactNode } from 'react';
import { Card } from './Card';

interface StatCardProps {
    title: string;
    value: ReactNode;
    subValue?: ReactNode;
    icon?: ReactNode;
    className?: string;
    isMini?: boolean;
    info?: ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
                                                      title,
                                                      value,
                                                      subValue,
                                                      icon,
                                                      className,
                                                      isMini = false,
                                                      info
                                                  }) => {
    const cardPadding = isMini ? 'p-3' : 'p-4';
    const titleSize = isMini ? 'text-xs' : 'text-sm';
    const valueSize = isMini ? 'text-xl' : 'text-2xl md:text-2xl';
    const subValueSize = 'text-xs text-gray-500 truncate mt-1';
    const iconContainerSize = isMini ? 'h-7 w-7 text-2xl' : 'h-8 w-8 text-3xl';

    return (
        <Card className={`${className} ${cardPadding} flex flex-col`}>
            <div className="flex items-start gap-4">
                {icon && (
                    <div className={`${iconContainerSize} text-blue-400 mt-1 flex-shrink-0 flex items-center justify-center`}>
                        {icon}
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center gap-2">
                        <p className={`${titleSize} text-gray-400 truncate`}>{title}</p>
                        {info}
                    </div>
                    <div className={`${valueSize} font-bold text-white break-words whitespace-normal`}>
                        {value}
                    </div>
                    {subValue && (
                        <div className={subValueSize}>
                            {subValue}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};