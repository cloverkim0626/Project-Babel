import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { Sparkles } from 'lucide-react';

interface TitleScreenProps {
    onStart: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart }) => {
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShowPrompt(true), 1500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div
            onClick={onStart}
            className="fixed inset-0 z-50 bg-obsidian flex flex-col items-center justify-center cursor-pointer overflow-hidden"
        >
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[url('/assets/title_background.png')] bg-cover bg-center opacity-40 scale-105 animate-pulse-slow" />

            {/* Fog/Mist Layer (CSS) */}
            <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-obsidian mx-auto" />

            {/* Main Logo Area */}
            <div className="relative z-10 flex flex-col items-center space-y-8 animate-fade-in">
                <div className="space-y-2 text-center">
                    <h2 className="text-babel-gold font-serif text-sm tracking-[0.5em] uppercase opacity-80">
                        The Library of Babel
                    </h2>
                    <h1 className="text-6xl md:text-8xl font-serif font-black text-paper tracking-tight drop-shadow-2xl">
                        PROJECT <span className="text-babel-gold">BABEL</span>
                    </h1>
                    <p className="text-stone-500 font-mono text-xs md:text-sm tracking-widest mt-4">
                        FLOOR 1: GENESIS
                    </p>
                </div>

                {/* Touch to Start Prompt */}
                <div className={clsx(
                    "transition-opacity duration-1000 mt-20 flex items-center gap-2 text-stone-300 font-serif",
                    showPrompt ? "opacity-100 animate-bounce" : "opacity-0"
                )}>
                    <Sparkles size={16} className="text-babel-gold" />
                    <span className="tracking-[0.2em] text-sm">TOUCH TO START</span>
                    <Sparkles size={16} className="text-babel-gold" />
                </div>
            </div>

            {/* Footer System Info */}
            <div className="absolute bottom-6 text-[10px] text-stone-700 font-mono tracking-widest">
                SYSTEM STATUS: ONLINE • v1.0.0
            </div>
        </div>
    );
};
