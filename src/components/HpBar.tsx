import React from 'react';
import { clsx } from 'clsx';
import { Heart } from 'lucide-react';

interface HpBarProps {
    current: number;
    max: number;
}

export const HpBar: React.FC<HpBarProps> = ({ current, max }) => {
    const percentage = Math.min(100, Math.max(0, (current / max) * 100));
    const isCritical = percentage < 30;

    return (
        <div className="w-full max-w-md">
            <div className="flex justify-between items-end mb-1">
                <div className="flex items-center gap-2 text-babel-gold font-mono text-sm">
                    <Heart size={16} className={clsx(isCritical && "animate-pulse text-pain")} />
                    <span className="tracking-widest">HP INTEGRITY</span>
                </div>
                <span className={clsx(
                    "font-mono text-sm font-bold",
                    isCritical ? "text-pain animate-pulse" : "text-white"
                )}>
                    {current} / {max}
                </span>
            </div>

            <div className="relative h-4 bg-black/50 border border-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />

                {/* Fill Bar */}
                <div
                    className={clsx(
                        "h-full transition-all duration-500 ease-out relative",
                        isCritical ? "bg-pain shadow-[0_0_15px_rgba(239,68,68,0.6)]" : "bg-gradient-to-r from-babel-gold to-amber-500 shadow-[0_0_10px_rgba(212,175,55,0.4)]"
                    )}
                    style={{ width: `${percentage}%` }}
                >
                    {/* Glitch Overlay for Critical State */}
                    {isCritical && (
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    )}
                </div>
            </div>

            {isCritical && (
                <p className="text-[10px] text-pain font-mono mt-1 animate-pulse uppercase tracking-widest">
                    ⚠ WARNING: Soul Corrosion Imminent
                </p>
            )}
        </div>
    );
};
