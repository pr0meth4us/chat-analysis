import { useEffect, useRef } from 'react';

export function usePolling(
    callback: () => void,
    interval: number,
    isActive: boolean
) {
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isActive) {
            intervalRef.current = setInterval(callback, interval);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [callback, interval, isActive]);
}