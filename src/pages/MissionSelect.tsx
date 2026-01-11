import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Lock, Activity, Droplets } from 'lucide-react';
import { clsx } from 'clsx';

// Mock Data (Weeks -> Dive Levels)
const MISSIONS = [
    { id: 'week-1', title: 'LEVEL 01: THE AWAKENING', korTitle: '제1심도: 각성 (The Awakening)', sub: '기본 설정 및 설치 (Setup)', locked: false, depth: 100 },
    { id: 'week-2', title: 'LEVEL 02: FIRST CONTACT', korTitle: '제2심도: 조우 (First Contact)', sub: '변수와 데이터 타입 (Variables)', locked: false, depth: 250 },
    { id: 'week-3', title: 'LEVEL 03: THE LOGIC GATE', korTitle: '제3심도: 논리의 문 (Logic Gate)', sub: '제어 흐름 (Control Flow)', locked: true, depth: 500 },
    { id: 'week-4', title: 'LEVEL 04: LOOP PARADOX', korTitle: '제4심도: 루프 패러독스 (Loop)', sub: '반복문과 배열 (Iteration)', locked: true, depth: 1000 },
];

const MissionSelect: React.FC = () => {
    const navigate = useNavigate();
    const { continentId } = useParams();

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 font-sans relative overflow-hidden flex flex-col">
            <div className="caustic-overlay" />

            {/* Header */}
            <div className="p-8 z-10 flex flex-col md:flex-row items-start md:items-center justify-between border-b border-white/5 backdrop-blur-md bg-[#020617]/80">
                <button onClick={() => navigate('/world-map')} className="flex items-center gap-2 text-slate-500 hover:text-cyan-400 transition-colors group mb-4 md:mb-0">
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="uppercase tracking-widest text-sm font-mono">Return to Surface</span>
                </button>
                <div className="text-right">
                    <h1 className="text-4xl md:text-5xl text-cinematic tracking-widest mb-2 text-shadow">DIVE OPERATION</h1>
                    <p className="text-cyan-500/60 text-sm uppercase tracking-[0.3em] font-mono pl-1">Target Sector: {continentId}</p>
                </div>
            </div>

            {/* Vertical Depth List */}
            <div className="flex-1 overflow-y-auto p-6 md:p-12 z-10 flex justify-center custom-scrollbar">
                <div className="w-full max-w-4xl relative">
                    {/* Depth Line */}
                    <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/50 via-cyan-900/20 to-transparent md:left-1/2 md:-ml-px hidden md:block" />

                    {MISSIONS.map((mission, idx) => (
                        <div
                            key={mission.id}
                            onClick={() => !mission.locked && navigate(`/quest-progress/${mission.id}`)}
                            className={clsx(
                                "relative mb-8 md:mb-12 last:mb-0 transition-all duration-500 group",
                                mission.locked ? "opacity-50 grayscale cursor-not-allowed" : "cursor-pointer"
                            )}
                        >
                            {/* Depth Marker */}
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 md:left-1/2 md:-translate-x-1/2 w-20 text-center z-20 hidden md:block">
                                <div className={clsx(
                                    "text-xs font-mono tracking-widest py-1.5 px-3 rounded-full border bg-[#020617]",
                                    mission.locked ? "border-slate-800 text-slate-600" : "border-cyan-500/50 text-cyan-400 group-hover:border-cyan-400 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all"
                                )}>
                                    -{mission.depth}M
                                </div>
                            </div>

                            <div className={clsx(
                                "flex flex-col md:flex-row items-center gap-8",
                                idx % 2 === 0 ? "md:flex-row-reverse" : ""
                            )}>
                                {/* Card */}
                                <div className={clsx(
                                    "w-full md:w-[calc(50%-2.5rem)] abyss-glass p-6 md:p-10 border rounded-2xl relative overflow-hidden transition-all duration-300",
                                    !mission.locked && "hover:border-cyan-400/50 hover:bg-slate-900/60 group-hover:shadow-[0_0_30px_rgba(34,211,238,0.1)]"
                                )}>
                                    {!mission.locked && (
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-cyan-500">
                                            <Activity size={100} />
                                        </div>
                                    )}

                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-6">
                                            <span className={clsx(
                                                "text-sm font-bold tracking-[0.2em] uppercase",
                                                mission.locked ? "text-slate-600" : "text-cyan-500"
                                            )}>
                                                Sequence 0{idx + 1}
                                            </span>
                                            {!mission.locked && <Droplets size={16} className="text-cyan-500 animate-bounce" />}
                                        </div>

                                        <h3 className={clsx(
                                            "text-2xl md:text-3xl font-serif font-bold mb-3 leading-tight",
                                            mission.locked ? "text-slate-500" : "text-slate-100 group-hover:text-cyan-300 transition-colors"
                                        )}>
                                            {mission.korTitle}
                                        </h3>

                                        <div className="flex items-center gap-3 text-sm text-slate-500 font-mono mt-6 border-t border-white/5 pt-4">
                                            <BookOpen size={14} />
                                            <span>{mission.sub}</span>
                                        </div>
                                    </div>

                                    {mission.locked && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                                            <Lock className="text-slate-600" size={40} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MissionSelect;
