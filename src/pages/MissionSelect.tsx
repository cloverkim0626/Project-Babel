import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Star, Lock, BookOpen } from 'lucide-react';
import { clsx } from 'clsx';

// Mock Data for Missions (Weeks)
const MISSIONS = [
    { id: 'week-1', title: 'Week 1: The Awakening', sub: 'Basic Setup & Installation', locked: false, stars: 3, total: 3 },
    { id: 'week-2', title: 'Week 2: First Contact', sub: 'Variable & Data Types', locked: false, stars: 1, total: 3 },
    { id: 'week-3', title: 'Week 3: The Logic Gate', sub: 'Control Flow', locked: true, stars: 0, total: 3 },
    { id: 'week-4', title: 'Week 4: Loop Paradox', sub: 'Iteration & Arrays', locked: true, stars: 0, total: 3 },
];

const MissionSelect: React.FC = () => {
    const navigate = useNavigate();
    const { continentId } = useParams();

    return (
        <div className="min-h-screen bg-obsidian text-paper font-mono relative overflow-hidden flex flex-col">
            {/* Background */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-20 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent pointer-events-none" />

            {/* Header */}
            <div className="p-6 md:p-8 z-10 flex items-center justify-between border-b border-white/10 backdrop-blur-sm">
                <button onClick={() => navigate('/world-map')} className="flex items-center gap-2 text-stone-400 hover:text-white transition-colors group">
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="uppercase tracking-widest text-sm">Return to Orbit</span>
                </button>
                <div className="text-right">
                    <h1 className="text-3xl font-serif font-bold text-babel-gold text-shadow-glow">MISSION SELECT</h1>
                    <p className="text-stone-500 text-xs uppercase tracking-[0.2em]">{continentId || 'Unknown Sector'}</p>
                </div>
            </div>

            {/* List Container */}
            <div className="flex-1 overflow-auto p-6 md:p-12 z-10 flex justify-center">
                <div className="w-full max-w-4xl space-y-4">
                    {MISSIONS.map((mission, idx) => (
                        <div
                            key={mission.id}
                            onClick={() => !mission.locked && navigate(`/quest-progress/${mission.id}`)}
                            className={clsx(
                                "relative w-full p-6 md:p-8 rounded-xl border flex items-center gap-6 transition-all duration-300 group overflow-hidden",
                                mission.locked
                                    ? "bg-black/40 border-white/5 opacity-50 cursor-not-allowed grayscale"
                                    : "bg-black/60 border-white/10 hover:border-babel-gold hover:bg-black/80 cursor-pointer hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(212,175,55,0.1)]"
                            )}
                        >
                            {/* Hover Highlight */}
                            {!mission.locked && (
                                <div className="absolute inset-0 bg-gradient-to-r from-babel-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            )}

                            {/* Index Number */}
                            <div className={clsx(
                                "text-4xl font-black font-serif opacity-20",
                                mission.locked ? "text-stone-600" : "text-white group-hover:text-babel-gold transition-colors"
                            )}>
                                {String(idx + 1).padStart(2, '0')}
                            </div>

                            {/* Content */}
                            <div className="flex-1 z-10">
                                <h3 className={clsx(
                                    "text-xl font-bold mb-1",
                                    mission.locked ? "text-stone-500" : "text-stone-200 group-hover:text-white"
                                )}>
                                    {mission.title}
                                </h3>
                                <div className="flex items-center gap-4 text-xs uppercase tracking-wider opacity-60">
                                    <span className="flex items-center gap-1"><BookOpen size={12} /> {mission.sub}</span>
                                    {!mission.locked && (
                                        <span className="flex items-center gap-1"><Calendar size={12} /> Available until D-2</span>
                                    )}
                                </div>
                            </div>

                            {/* Status/Action */}
                            <div className="z-10 text-right">
                                {mission.locked ? (
                                    <Lock className="text-stone-600" />
                                ) : (
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="flex text-babel-gold">
                                            {Array.from({ length: mission.total }).map((_, i) => (
                                                <Star key={i} size={14} fill={i < mission.stars ? "currentColor" : "none"} className={i >= mission.stars ? "opacity-30" : ""} />
                                            ))}
                                        </div>
                                        <div className="text-[10px] text-babel-gold border border-babel-gold/30 px-2 py-0.5 rounded uppercase">
                                            Enter Simulation
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MissionSelect;
