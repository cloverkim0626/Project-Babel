import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ObserversLog } from '../components/ObserversLog';
import { VocabReviewModal } from '../components/VocabReviewModal';
import { useAuth } from '../hooks/useAuth';
import { useGameEngine } from '../hooks/useGameEngine';
import { Zap, Clock, Trophy, CheckCircle, BookOpen, AlertTriangle, ArrowRight, Anchor, Activity, Droplets, Wind } from 'lucide-react';
import { clsx } from 'clsx';

// Type definitions
interface CompletedQuest {
    id: string;
    title: string;
    code: string;
    completedAt: string;
    score: number;
    words: { word: string; meaning: string; example?: string }[];
}

const MOCK_COMPLETED_QUESTS: CompletedQuest[] = [
    {
        id: 'cq-1',
        title: '2024 Sep Mock - Set A',
        code: 'M-24-09A',
        completedAt: '2 days ago',
        score: 85,
        words: [
            { word: 'elaborate', meaning: '정교한, 상세한' },
            { word: 'phenomenon', meaning: '현상' },
            { word: 'substantial', meaning: '상당한, 실질적인' },
        ]
    },
    {
        id: 'cq-2',
        title: 'Vocabulary Day 1-5',
        code: 'V-01-05',
        completedAt: '5 days ago',
        score: 92,
        words: [
            { word: 'ambiguous', meaning: '모호한' },
            { word: 'contemporary', meaning: '현대의' },
        ]
    }
];

const MOCK_INCOMPLETE_TASKS = [
    {
        id: 'inc-1',
        title: '9월 모의고사 A - Seq 3',
        code: 'sept-mock-03',
        dueDate: '오늘 마감',
        isOverdue: false,
        missionId: 'mock-mission-A'
    },
    {
        id: 'inc-2',
        title: 'Voca Day 1 - Seq 2',
        code: 'voca-d1-s2',
        dueDate: '기한 만료',
        isOverdue: true,
        missionId: 'voca-day-1'
    }
];

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { role, user, loading } = useAuth();
    const { levelSpecs, points } = useGameEngine();

    const [currentHp, setCurrentHp] = useState(levelSpecs.maxHp);
    const [reviewModal, setReviewModal] = useState<CompletedQuest | null>(null);

    React.useEffect(() => {
        setCurrentHp(prev => Math.min(prev + 10, levelSpecs.maxHp));
    }, [levelSpecs.maxHp]);

    if (loading || !user) return null;

    const { level } = levelSpecs || { level: 1 };
    const oxygenPercent = (currentHp / (levelSpecs?.maxHp || 100)) * 100;
    const depthPercent = ((levelSpecs?.xp || 0) / (levelSpecs?.nextLevelXp || 100)) * 100;

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 p-6 md:p-10 overflow-x-hidden relative font-sans">
            <div className="caustic-overlay" />

            {/* Top Navigation / Status Bar */}
            <header className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 border-b border-white/5 pb-6">
                <div className="flex items-center gap-6">
                    {/* Character Avatar (Diver Helmet) */}
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-full border-2 border-cyan-500/30 p-1 bg-slate-900/80 relative shadow-[0_0_30px_rgba(34,211,238,0.2)] overflow-hidden">
                            <div className="absolute inset-0 bg-cyan-500/10 animate-pulse z-0" />
                            <img
                                src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user?.nickname || 'diver'}`}
                                alt="Diver"
                                className="w-full h-full object-cover rounded-full opacity-90 relative z-10 hover:scale-110 transition-transform duration-500 bg-black"
                            />
                        </div>
                        <div className="absolute -bottom-2 -right-1 w-8 h-8 bg-cyan-950 text-cyan-400 font-bold font-serif flex items-center justify-center rounded-full border border-cyan-500 shadow-lg z-20">
                            {level || 1}
                        </div>
                    </div>

                    <div>
                        <h1 className="text-4xl text-cinematic tracking-widest mb-1 text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400">
                            {user.nickname}
                        </h1>
                        <div className="flex items-center gap-3">
                            <span className="text-xs uppercase tracking-[0.3em] text-cyan-500 font-bold border border-cyan-500/30 px-2 py-0.5 rounded bg-cyan-950/20">
                                {user.classType} Class
                            </span>
                            <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 uppercase tracking-widest animate-pulse">
                                <Activity size={10} /> 생명 유지 장치 가동 (Online)
                            </span>
                        </div>
                    </div>
                </div>

                {/* Oxygen & Depth Gauge */}
                <div className="flex items-center gap-8 bg-slate-900/40 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/10 shadow-2xl">
                    <div className="text-right">
                        <div className="text-[9px] text-cyan-500/70 uppercase tracking-[0.2em] mb-1.5 flex items-center justify-end gap-1">
                            <Wind size={10} /> 산소 보존력 (Oxygen)
                        </div>
                        <div className="w-48 h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50 relative">
                            {/* Animated Bubbles in Bar */}
                            <div className="absolute inset-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 animate-[slide_20s_linear_infinite]" />
                            <div
                                className="h-full bg-gradient-to-r from-cyan-900 via-cyan-500 to-white transition-all duration-1000 relative"
                                style={{ width: `${oxygenPercent || 100}%` }}
                            >
                                <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 blur-[2px]" />
                            </div>
                        </div>
                        <div className="text-[10px] text-right mt-1 font-mono text-cyan-300">
                            {currentHp} / {levelSpecs?.maxHp || 100} PSI
                        </div>
                    </div>

                    <div className="w-px h-10 bg-white/10" />

                    <div className="text-right">
                        <div className="text-[9px] text-amber-500/70 uppercase tracking-[0.2em] mb-1 flex items-center justify-end gap-1">
                            <Droplets size={10} /> 심해 탐사도 (Depth)
                        </div>
                        <div className="text-3xl font-[Cinzel] text-amber-500 flex items-center justify-end gap-1 leading-none text-shadow-gold">
                            {(points || 0).toLocaleString()} <span className="text-[10px] font-sans text-amber-500/50 tracking-widest mt-2">M</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Panel: Status & Radar (4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Radar Chart Container */}
                    <div className="abyss-glass p-6 relative group hover:border-cyan-500/30 transition-colors">
                        <div className="absolute top-4 left-4 flex items-center gap-2 text-cyan-500/50">
                            <Anchor size={14} />
                            <span className="text-[10px] uppercase tracking-[0.2em]">다이버 능력치 (Metrics)</span>
                        </div>
                        <div className="mt-4 filter drop-shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                            <ObserversLog stats={{
                                accuracy: 78, speed: 65, persistence: 82,
                                knowledge: 71, planning: 50, trust: 90
                            }} />
                        </div>
                    </div>

                    {/* XP / Depth Progress */}
                    <div className="abyss-glass p-6 space-y-4">
                        <h3 className="text-sm font-serif text-slate-300 flex items-center gap-2 border-b border-white/5 pb-2">
                            항법 시스템 (Navigation)
                        </h3>

                        <div>
                            <div className="flex justify-between text-[10px] text-slate-400 mb-1 uppercase tracking-wider">
                                <span>현재 수심</span>
                                <span>목표 수심</span>
                            </div>
                            <div className="relative w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                <div
                                    className="absolute h-full bg-gradient-to-r from-amber-800 to-amber-500"
                                    style={{ width: `${depthPercent}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[10px] text-amber-500 mt-1 font-mono">
                                <span>{(levelSpecs?.xp || 0).toLocaleString()} M</span>
                                <span>{(levelSpecs?.nextLevelXp || 0).toLocaleString()} M</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center/Right Panel: Missions (8 cols) */}
                <div className="lg:col-span-8 space-y-8">

                    {/* Critical Alerts */}
                    {MOCK_INCOMPLETE_TASKS.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-red-500 tracking-[0.2em] uppercase flex items-center gap-2 pl-1 animate-pulse">
                                <AlertTriangle size={14} /> 선체 파손 경고 (Critical Hull Breach)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {MOCK_INCOMPLETE_TASKS.map(task => (
                                    <div
                                        key={task.id}
                                        onClick={() => {
                                            if (confirm(`'${task.title}' 미완료 구역 복구를 시도하시겠습니까?`)) {
                                                navigate(`/mission/${task.missionId}/play`);
                                            }
                                        }}
                                        className="abyss-glass p-4 border-l-2 border-l-red-500 hover:bg-red-950/20 cursor-pointer group transition-all"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-red-400 font-bold text-sm group-hover:text-red-300">{task.title}</span>
                                            <span className={clsx("text-[9px] px-2 py-0.5 rounded font-bold uppercase", task.isOverdue ? "bg-red-500/20 text-red-500" : "bg-amber-500/20 text-amber-500")}>
                                                {task.dueDate}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-mono">
                                            ERR_CODE: {task.code}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Active Mission */}
                    <div>
                        <h3 className="text-xs font-bold text-cyan-500 tracking-[0.2em] uppercase mb-4 pl-1">
                            현재 탐사 좌표 (Dive Coordinate)
                        </h3>
                        <div
                            className="group relative abyss-glass p-8 overflow-hidden cursor-pointer hover:border-cyan-400/50 transition-all duration-500"
                            onClick={() => navigate('/world-map')}
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                                <Zap size={100} />
                            </div>

                            <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-6">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-[Cinzel] text-white group-hover:text-cyan-400 transition-colors mb-2 text-shadow">
                                        Alpha Sector: 01
                                    </h2>
                                    <p className="text-slate-400 text-sm max-w-lg leading-relaxed font-light">
                                        "이 구역에서 20개의 기억 파편이 탐지되었습니다. 부식이 진행되기 전에 회수하십시오."
                                    </p>

                                    <div className="flex gap-4 mt-6">
                                        <div className="flex items-center gap-2 text-xs text-amber-500 font-mono bg-amber-950/20 px-3 py-1.5 rounded border border-amber-900/50">
                                            <Clock size={12} /> 24시간 남음
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono bg-cyan-950/20 px-3 py-1.5 rounded border border-cyan-900/50">
                                            <Trophy size={12} /> 보상: 수심 +5 M
                                        </div>
                                    </div>
                                </div>

                                <button className="abyss-btn px-8 py-3 text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.3)] group-hover:shadow-[0_0_40px_rgba(34,211,238,0.5)]">
                                    잠수 개시 <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Completed */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 tracking-[0.2em] uppercase mb-4 pl-1">
                            탐사 기록 (Dive Log)
                        </h3>
                        <div className="space-y-3">
                            {MOCK_COMPLETED_QUESTS.map(quest => (
                                <div
                                    key={quest.id}
                                    className="abyss-glass p-4 flex items-center justify-between hover:bg-slate-800/50 cursor-pointer group transition-all"
                                    onClick={() => setReviewModal(quest)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full border border-emerald-500/30 bg-emerald-950/20 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                                            <CheckCircle size={18} />
                                        </div>
                                        <div>
                                            <div className="text-slate-200 font-bold group-hover:text-emerald-400 transition-colors">{quest.title}</div>
                                            <div className="text-[10px] text-slate-500 font-mono">{quest.code} • {quest.completedAt}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-[Cinzel] text-emerald-500">{quest.score}</div>
                                        <div className="text-[9px] text-slate-500 uppercase tracking-widest flex items-center gap-1 justify-end group-hover:text-emerald-400">
                                            <BookOpen size={10} /> 기록 열람
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </main>

            {/* Dev Tools (Hidden/Subtle) */}
            <div className="fixed bottom-4 right-4 flex gap-2 opacity-0 hover:opacity-100 transition-opacity z-50">
                <button onClick={() => setCurrentHp(h => Math.max(0, h - 10))} className="px-2 py-1 bg-red-900/50 text-xs rounded text-red-200">-10 O2</button>
                <button onClick={() => setCurrentHp(h => Math.min(levelSpecs.maxHp, h + 10))} className="px-2 py-1 bg-emerald-900/50 text-xs rounded text-emerald-200">+10 O2</button>
            </div>

            <VocabReviewModal
                isOpen={reviewModal !== null}
                onClose={() => setReviewModal(null)}
                questTitle={reviewModal?.title || ''}
                words={reviewModal?.words || []}
            />
        </div>
    );
};

export default Dashboard;
