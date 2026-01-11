import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wind, Droplets, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';

const MissionPlay = () => {
    const navigate = useNavigate();
    // Use game engine hooks if available, or local state for this "Test Page"
    // const { levelSpecs } = useGameEngine();

    // Simulation State
    const [oxygen, setOxygen] = useState(100);
    const [depth, setDepth] = useState(1000);
    const [isPanic, setIsPanic] = useState(false);

    // Oxygen Depletion Mechanic
    useEffect(() => {
        const timer = setInterval(() => {
            setOxygen(prev => {
                const next = prev - 0.1; // Slow burn
                if (next < 20) setIsPanic(true);
                if (next <= 0) {
                    clearInterval(timer);
                    // Handle Game Over (Prototype: just alert)
                    // alert("CRITICAL FAILURE: OXYGEN DEPLETED");
                    return 0;
                }
                return next;
            });
            // Depth increases as you stay
            setDepth(prev => prev + 0.5);
        }, 100); // 10 ticks per second

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-1000">
            {/* 1. Atmospheric Layers */}
            <div className="caustic-overlay" /> {/* Standard Caustics */}

            {/* Deep Sea Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-[#082f49] to-[#020617] opacity-90 z-0" />

            {/* Floating Particles (Dust) - CSS Animation in index.css or inline */}
            <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-ping" />
                <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-cyan-400 rounded-full animate-pulse" />
            </div>

            {/* Panic Overlay (Red Vignette) */}
            <div className={clsx(
                "absolute inset-0 pointer-events-none transition-opacity duration-1000 z-10",
                isPanic ? "opacity-40 bg-radial-gradient-red" : "opacity-0"
            )} style={{ background: 'radial-gradient(circle, transparent 50%, #7f1d1d 100%)' }} />

            {/* 2. HUD (Head-Up Display) - Fixed Top */}
            <div className="fixed top-0 left-0 w-full p-4 md:p-8 flex justify-between items-start z-50">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors uppercase tracking-widest text-xs font-bold bg-black/40 backdrop-blur px-4 py-2 rounded-full border border-white/10"
                >
                    <ArrowLeft size={14} /> Abort Dive
                </button>

                <div className="flex flex-col items-end gap-4">
                    {/* Oxygen Bar */}
                    <div className="flex flex-col items-end">
                        <div className={clsx("flex items-center gap-2 text-xs font-bold tracking-widest mb-1", isPanic ? "text-red-500" : "text-cyan-400")}>
                            {isPanic && <AlertTriangle size={12} className="animate-bounce" />}
                            <Wind size={14} /> OXYGEN LEVELS
                        </div>
                        <div className="w-48 h-2 bg-slate-900/80 rounded-full border border-slate-700 overflow-hidden relative">
                            <div
                                className={clsx("absolute top-0 bottom-0 right-0 transition-all duration-300", isPanic ? "bg-red-500" : "bg-cyan-500")}
                                style={{ width: `${oxygen}%` }}
                            />
                        </div>
                        <div className="text-[10px] font-mono mt-1 text-slate-400">{oxygen.toFixed(1)}% REMAINING</div>
                    </div>

                    {/* Depth Meter */}
                    <div className="flex items-center gap-3 text-amber-500 bg-black/40 backdrop-blur px-4 py-2 rounded-lg border border-amber-900/30">
                        <Droplets size={16} />
                        <span className="text-xl font-serif font-bold tracking-widest">{depth.toFixed(0)} <span className="text-xs font-sans opacity-70">M</span></span>
                    </div>
                </div>
            </div>

            {/* 3. Main Content Area - Center Stage */}
            <div className="w-full max-w-2xl relative z-20 flex flex-col items-center">

                {/* Question / Word Display */}
                <div className="mb-16 text-center w-full">
                    <div className="text-xs md:text-sm text-cyan-500/60 uppercase tracking-[0.4em] mb-6 animate-pulse">
                        Analyzing Signal Pattern...
                    </div>

                    <h1 className="text-6xl md:text-8xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] mb-8 transition-transform hover:scale-105 duration-700 cursor-default">
                        Ephemeral
                    </h1>

                    {/* Divider */}
                    <div className="flex items-center justify-center gap-4 opacity-30 my-8">
                        <div className="h-px bg-cyan-500 w-12" />
                        <div className="w-2 h-2 rotate-45 border border-cyan-500" />
                        <div className="h-px bg-cyan-500 w-12" />
                    </div>
                </div>

                {/* Options Grid */}
                <div className="w-full grid grid-cols-1 gap-4">
                    {['단명하는, 덧없는 (Passing)', '영원불멸의 (Eternal)', '강력한, 압도적인 (Powerful)', '신비로운, 알 수 없는 (Mysterious)'].map((option, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                setOxygen(prev => Math.min(prev + 5, 100)); // Reward
                                alert("Link Established. (Correct)");
                            }}
                            className="bg-black/40 backdrop-blur-md border border-white/10 hover:border-cyan-400 hover:bg-cyan-950/30 text-slate-300 hover:text-white py-6 rounded-xl transition-all duration-300 text-lg md:text-xl font-serif tracking-wide shadow-lg group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                            <span className="relative z-10">{option}</span>
                        </button>
                    ))}
                </div>

            </div>

            {/* 4. Bottom Info */}
            <div className="fixed bottom-6 text-center z-10 opacity-40">
                <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-2">
                    Hypoxia Warning Limit: 20%
                </div>
            </div>

        </div>
    );
};

export default MissionPlay;
