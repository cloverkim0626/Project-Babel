import { useState, useEffect } from 'react';
import { differenceInHours, differenceInDays } from 'date-fns';

export interface TimelineStatus {
    timeLeft: string;
    isCorroded: boolean; // For the overall quest
    isWarning: boolean;
    hoursRemaining: number;
}

export const useTimeline = (deadline: string | null) => {
    const [status, setStatus] = useState<TimelineStatus>({
        timeLeft: '',
        isCorroded: false,
        isWarning: false,
        hoursRemaining: 0
    });

    useEffect(() => {
        if (!deadline) return;

        const checkTime = () => {
            const now = new Date();
            const due = new Date(deadline);
            const hours = differenceInHours(due, now);
            const days = differenceInDays(due, now);

            // Logic: Warning if < 24h (1 day) OR < 1h
            const isWarning = hours <= 24 && hours > 0;
            const isCorroded = hours <= 0;

            let timeLeft = '';
            if (isCorroded) {
                timeLeft = 'CORRODED';
            } else if (days > 0) {
                timeLeft = `${days}d ${hours % 24}h`;
            } else {
                timeLeft = `${hours}h ${Math.max(0, 60 - now.getMinutes())}m`;
            }

            setStatus({
                timeLeft,
                isCorroded,
                isWarning,
                hoursRemaining: hours
            });
        };

        checkTime();
        const interval = setInterval(checkTime, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [deadline]);

    /**
     * Checks if a specific word/item has corroded based on its last study time.
     * Default rule: Corrodes if > 24 hours since last review (for 2nd review cycle).
     */
    const checkItemCorrosion = (lastStudiedAt: string, limitHours = 24): boolean => {
        const now = new Date();
        const last = new Date(lastStudiedAt);
        const diff = differenceInHours(now, last);
        return diff >= limitHours;
    };

    return { ...status, checkItemCorrosion };
};
