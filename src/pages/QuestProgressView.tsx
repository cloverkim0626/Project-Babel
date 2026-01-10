import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, Zap, Trophy, Skull, BookOpen } from 'lucide-react';
import { clsx } from 'clsx';
import { useTimeline } from '../hooks/useTimeline';
import { useGameEngine } from '../hooks/useGameEngine';

// Mission > Set hierarchy
interface QuestSet {
    id: string;
    index: number;
    status: 'locked' | 'open' | 'passed' | 'failed' | 'corroded';
    score: number;
}

// Mock Sets - Mix of passed, open, locked for demo
const MOCK_SETS: QuestSet[] = Array.from({ length: 8 }, (_, i) => ({
    id: `set-${i}`,
    index: i + 1,
    // First 2 passed, 3rd open, rest locked for demo effect
    status: i < 2 ? 'passed' : i === 2 ? 'open' : 'locked',
    score: i < 2 ? 100 : 0
}));

export const QuestProgressView: React.FC = () => {
    // const { id } = useParams(); // Unused
    const navigate = useNavigate();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { addXp, addPoints, logError } = useGameEngine();

    // Derived UI State
    const [finalConquestAnim, setFinalConquestAnim] = useState(false);
    // Determine if conquered (Mock logic for demo)
    const isConquered = MOCK_SETS.every(s => s.status === 'passed');

    // Prevent double reward in strict mode
    const [rewardClaimed, setRewardClaimed] = useState(false);

    useEffect(() => {
        if (isConquered && !rewardClaimed) {
            const timer = setTimeout(() => {
                setFinalConquestAnim(true);
                setRewardClaimed(true);
                // AWARD REWARDS
                addXp(300); // Massive XP for continent conquest
                addPoints(100);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isConquered, rewardClaimed, addXp, addPoints]);

    // Mock Mission Metadata
    const missionName = "Week 1: The Awakening"; // Paraphrased Name

    // Use state to keep deadline stable and prevent infinite loop in useTimeline
    const [deadline] = useState(() => new Date(Date.now() + 86400000 * 2).toISOString());

    const timeline = useTimeline(deadline);

    const handleNodeClick = (set: QuestSet) => {
        if (set.status === 'locked') {
            alert("This sequence is sealed. Explain the previous grimoire first.");
            return;
        }
        // Navigate to the ACTUAL PLAY page
        navigate(`/mission/${set.id}/play`);
    };

    const handleSimulateError = () => {
        logError("Ephemeral"); // Mock Word
        alert("Mock Error Logged: 'Ephemeral' added to Ebbinghaus Vault (+1 min)");
    };

    // Character Avatar Helper - Using the Coordinator from the splash art
    const characterImage = '/assets/party_splash.jpg';

    return (
        <div className="min-h-screen bg-obsidian text-paper font-mono flex flex-col relative overflow-hidden">
            {/* Background: Library / Archive - Updated for visual impact */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-30 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-purple-950/80 via-black/60 to-black/90 pointer-events-none" />

            {/* Conquest Overlay */}
            {finalConquestAnim && (
                <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-1000">
                    <Trophy size={80} className="text-babel-gold mb-6 animate-bounce" />
                    <h1 className="text-5xl font-serif text-babel-gold font-bold mb-2 text-center text-shadow-gold">
                        ARCHIVE RESTORED
                    </h1>
                    <p className="text-stone-300 tracking-widest uppercase mb-8">All Sequences Stabilized</p>
                    <div className="text-center mb-8 animate-pulse text-babel-gold">
                        +300 XP Awarded<br />
                        +100 Points Acquired
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => navigate('/world-map')} className="px-8 py-3 bg-babel-gold text-obsidian font-bold rounded hover:scale-105 transition-transform">
                            Return to World Map
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/60 backdrop-blur z-20 sticky top-0">
                <button onClick={() => navigate('/world-map')} className="flex items-center gap-2 text-stone-400 hover:text-white transition-colors">
                    <ArrowLeft size={16} /> <span className="text-xs uppercase tracking-widest">목록으로</span>
                </button>

                <div className="text-center">
                    <h2 className="text-xl font-serif text-babel-gold flex items-center justify-center gap-2 text-shadow-sm">
                        <BookOpen size={18} />
                        {missionName}
                    </h2>
                </div>

                <div className="flex gap-4 items-center">
                    {/* Debug: Simulate Error */}
                    <button onClick={handleSimulateError} className="p-2 border border-pain/30 text-pain rounded full hover:bg-pain hover:text-white transition-colors" title="Simulate Wrong Answer">
                        <Skull size={14} />
                    </button>

                    <div className={clsx("flex items-center gap-2 text-xs border px-3 py-1 rounded", timeline.isWarning ? "border-pain text-pain animate-pulse" : "border-stone-700 text-stone-400")}>
                        <Clock size={14} />
                        <span>{timeline.timeLeft} 남음</span>
                    </div>
                </div>
            </div>

            {/* Path / Map Container */}
            <div className="flex-1 relative overflow-auto p-12 flex items-center justify-center">
                {/* Visual Path Line - Simplified S-Curve approximation for demo */}
                <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-white/5 -translate-x-1/2 hidden md:block" />

                <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24">
                    {MOCK_SETS.map((set, index) => {
                        const isEven = index % 2 === 0;
                        // Zig-zag layout
                        return (
                            <div
                                key={set.id}
                                className={clsx(
                                    "flex flex-col relative",
                                    isEven ? "md:items-end md:text-right" : "md:items-start md:text-left",
                                    // Shift down for staggered look
                                    "md:transform md:translate-y-12"
                                )}
                                onClick={() => handleNodeClick(set)}
                            >
                                {/* Character Position */}
                                {set.status === 'open' && (
                                    <div className={clsx(
                                        "absolute -top-20 z-20 w-20 h-20 animate-bounce transition-all duration-500",
                                        isEven ? "right-2" : "left-2"
                                    )}>
                                        <div className="w-full h-full rounded-full border-2 border-babel-gold shadow-[0_0_20px_rgba(212,175,55,0.6)] overflow-hidden bg-black relative">
                                            {/* Focusing on the Coordinator (Rightmost character in sprite) */}
                                            <img
                                                src={characterImage}
                                                alt="Coordinator"
                                                className="w-[400%] max-w-none h-full object-cover"
                                                style={{ objectPosition: '100% 20%' }}
                                            />
                                        </div>
                                        <div className="absolute -bottom-2 w-full text-center bg-black/80 text-[10px] text-babel-gold border border-babel-gold/50 rounded px-1 font-bold tracking-wider">
                                            COORDINATOR
                                        </div>
                                    </div>
                                )}

                                <div className={clsx(
                                    "w-full p-4 border rounded-xl backdrop-blur-md transition-all duration-300 cursor-pointer hover:scale-105 group relative overflow-hidden",
                                    set.status === 'locked' && "bg-black/40 border-white/5 text-stone-600 grayscale opacity-60",
                                    set.status === 'open' && "bg-black/60 border-babel-gold shadow-[0_0_20px_rgba(212,175,55,0.2)]",
                                    set.status === 'passed' && "bg-emerald-900/20 border-emerald-500/50 text-emerald-100"
                                )}>
                                    {/* Hover Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                                    <div className="flex items-center gap-4 mb-2">
                                        <div className={clsx(
                                            "w-8 h-8 rounded-full flex items-center justify-center border",
                                            set.status === 'open' ? "border-babel-gold bg-babel-gold text-black font-bold" : "border-white/10 bg-white/5"
                                        )}>
                                            {set.status === 'passed' ? <CheckCircle size={16} /> : set.index}
                                        </div>
                                        <div>
                                            <h4 className="font-serif font-bold text-lg">Sequence {set.index < 10 ? `0${set.index}` : set.index}</h4>
                                            <p className="text-[10px] uppercase tracking-widest opacity-70">
                                                {set.status === 'locked' ? 'Access Denied' : set.status === 'open' ? 'Ready to Start' : 'Stabilized'}
                                            </p>
                                        </div>
                                    </div>

                                    {set.status === 'open' && (
                                        <div className="mt-2 text-xs text-babel-gold flex items-center gap-1 animate-pulse">
                                            <Zap size={12} fill="currentColor" /> Click to Synchronize
                                        </div>
                                    )}
                                </div>

                                {/* Connecting Line Logic (Visual only) */}
                                {index < MOCK_SETS.length - 1 && (
                                    <div className={clsx(
                                        "absolute top-full h-12 w-0.5 bg-white/10",
                                        isEven ? "right-8" : "left-8",
                                        "hidden md:block" // Only show vertical connectors on desktop for this zigzag
                                    )} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="p-4 text-center text-[10px] text-stone-500 border-t border-white/5 bg-black/80">
                도서관의 기록을 순서대로 복원하십시오.
            </div>
        </div>
    );
};

export default QuestProgressView;
