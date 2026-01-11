import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HpBar } from '../components/HpBar';
import { ObserversLog } from '../components/ObserversLog';
import { VocabReviewModal } from '../components/VocabReviewModal';
import { useAuth } from '../hooks/useAuth';
import { useGameEngine } from '../hooks/useGameEngine';
import { Shield, UserCog, Zap, Clock, Trophy, CheckCircle, BookOpen } from 'lucide-react';

// Mock completed quests data
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
        completedAt: '2일 전',
        score: 85,
        words: [
            { word: 'elaborate', meaning: '정교한, 상세한', example: 'The architect created an elaborate design.' },
            { word: 'phenomenon', meaning: '현상', example: 'This is a natural phenomenon.' },
            { word: 'substantial', meaning: '상당한, 실질적인', example: 'There was a substantial increase in sales.' },
            { word: 'inherent', meaning: '내재하는, 고유의', example: 'Risk is inherent in any investment.' },
            { word: 'profound', meaning: '심오한, 깊은', example: 'The book had a profound impact on me.' },
        ]
    },
    {
        id: 'cq-2',
        title: 'Vocabulary Day 1-5',
        code: 'V-01-05',
        completedAt: '5일 전',
        score: 92,
        words: [
            { word: 'ambiguous', meaning: '모호한', example: 'The statement was ambiguous.' },
            { word: 'contemporary', meaning: '현대의, 동시대의', example: 'Contemporary art is often abstract.' },
            { word: 'facilitate', meaning: '용이하게 하다', example: 'The software facilitates communication.' },
        ]
    }
];

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { role, user, loading } = useAuth();
    const { levelSpecs, points } = useGameEngine();

    // Mock Data State (HP is now derived from engine maxHp, but current HP is local for now)
    const [currentHp, setCurrentHp] = useState(levelSpecs.maxHp);
    const [reviewModal, setReviewModal] = useState<CompletedQuest | null>(null);

    // Sync current HP if max changes (Level Up)
    React.useEffect(() => {
        setCurrentHp(prev => Math.min(prev + 10, levelSpecs.maxHp));
    }, [levelSpecs.maxHp]);

    // Note: Auth loading is now handled by RoleGuard in App.tsx
    if (loading) return null; // RoleGuard handles the loading spinner
    if (!user) return null; // RoleGuard handles redirection

    const { level } = levelSpecs;

    // Character Image Mapping
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const getCharacterImage = (_cls: string) => {
        // ... (keep existing mapping logic or simplify)
        if (role === 'master') return '/assets/master_architect.png'; // Placeholder for master
        // Map class names to assets
        return '/assets/character_base.png'; // Default
    };

    // Dev Controls
    const simulateDamage = () => setCurrentHp(prev => Math.max(0, prev - 10));
    const simulateHeal = () => setCurrentHp(prev => Math.min(levelSpecs.maxHp, prev + 10));

    // XP Progress
    const xpPercent = (levelSpecs.xp / levelSpecs.nextLevelXp) * 100;

    return (
        <div className="min-h-screen bg-obsidian text-paper font-mono p-4 md:p-8 overflow-x-hidden relative">
            {/* Background Texture & Ambience */}
            <div className="absolute inset-0 bg-[#0a0a0a]" />
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]" />
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none" />

            {/* Top Bar */}
            <header className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-white/10 pb-6">
                <div className="flex items-center gap-4">
                    {/* User Profile */}
                    <div className="relative group cursor-pointer">
                        <div className="w-20 h-20 rounded-xl border-2 border-babel-gold p-1 bg-black overflow-hidden relative shadow-[0_0_15px_rgba(212,175,55,0.3)] group-hover:shadow-[0_0_25px_rgba(212,175,55,0.6)] transition-all duration-500">
                            <img
                                src={getCharacterImage(user.classType)}
                                alt="Character"
                                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                            />
                            {/* Scanline Effect */}
                            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-20 pointer-events-none" />
                        </div>
                        <div className="absolute -bottom-3 -right-3 bg-black border border-babel-gold text-babel-gold text-xs px-2 py-0.5 rounded font-bold tracking-widest shadow-lg">
                            Lv.{level}
                        </div>
                    </div>

                    <div>
                        <h1 className="text-3xl font-serif text-white flex items-center gap-2 tracking-wide text-shadow-glow">
                            {user.nickname}
                            {role === 'master' && <Shield size={18} className="text-purple-500 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" />}
                        </h1>
                        <div className="flex items-center gap-3 text-xs text-stone-400 uppercase tracking-widest mt-1">
                            <span className="text-babel-gold font-bold">{user.classType}</span>
                            <span className="w-1 h-1 bg-stone-600 rounded-full" />
                            <span>프로젝트 : 바벨</span>
                            {role === 'master' && (
                                <button onClick={() => navigate('/admin')} className="ml-2 text-purple-400 hover:text-purple-300 transition-colors border border-purple-500/30 px-2 py-0.5 rounded flex items-center gap-1 hover:bg-purple-500/10">
                                    [관리자 패널]
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto">
                    {/* Stats & Currency */}
                    <div className="hidden md:block text-right">
                        <div className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">보유 자산 (Assets)</div>
                        <div className="text-2xl font-bold text-babel-gold flex items-center justify-end gap-3 text-shadow-sm">
                            {(points || 0).toLocaleString()} <span className="text-sm font-normal text-stone-400 mt-1">Pts</span>
                            <button
                                onClick={() => {
                                    const amt = prompt("환급할 포인트를 입력하세요:");
                                    if (amt) alert(`Refund request for ${amt} pts sent (Mock)`);
                                }}
                                className="text-[10px] bg-babel-gold/5 hover:bg-babel-gold/20 border border-babel-gold/30 text-babel-gold px-3 py-1.5 rounded transition-all hover:shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                            >
                                [환급 신청]
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Stats & Status */}
                <div className="space-y-6">
                    {/* Status Card */}
                    <div className="border border-white/10 bg-black/60 backdrop-blur-md rounded-xl p-6 relative overflow-hidden shadow-2xl">
                        {/* Decorative Corner */}
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-babel-gold/10 to-transparent pt-2 pr-2 flex justify-end items-start rounded-tr-xl">
                            <div className="w-2 h-2 bg-babel-gold rounded-full animate-pulse" />
                        </div>

                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-babel-gold font-serif text-lg flex items-center gap-2 border-b border-babel-gold/30 pb-1 pr-4">
                                <UserCog size={18} /> 상태창 (Status)
                            </h3>
                            <HpBar current={currentHp} max={levelSpecs.maxHp} />
                        </div>

                        <div className="flex items-end justify-between mb-2">
                            <div className="text-white font-bold text-lg">{user.classType}</div>
                            <div className="text-stone-400 text-xs font-mono mb-1">필요 경험치</div>
                        </div>

                        {/* XP Bar */}
                        <div className="relative w-full h-4 bg-stone-900 rounded-full overflow-hidden border border-white/5 box-border">
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:10px_10px]" />
                            <div
                                className="h-full bg-gradient-to-r from-blue-900 via-blue-600 to-blue-400 transition-all duration-700 ease-out relative"
                                style={{ width: `${xpPercent}%` }}
                            >
                                <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-white/50 shadow-[0_0_10px_white]" />
                            </div>
                        </div>

                        <div className="flex justify-between text-[10px] text-stone-500 mt-2 font-mono">
                            <span className="text-blue-400 font-bold">{(levelSpecs?.xp || 0).toLocaleString()} XP</span>
                            <span>NEXT: {(levelSpecs?.nextLevelXp || 0).toLocaleString()} XP</span>
                        </div>

                        {role === 'master' && (
                            <div className="mt-4 p-2 bg-purple-900/20 border border-purple-500/30 rounded text-center text-xs text-purple-300">
                                <Shield size={12} className="inline mr-1" /> 마스터 권한 승인됨
                            </div>
                        )}
                    </div>

                    <ObserversLog stats={{
                        accuracy: 85,
                        speed: 70,
                        persistence: 60,
                        knowledge: 75,
                        planning: 50,
                        trust: 90
                    }} />
                </div>

                {/* Center Column: Active Quests */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-stone-400 text-xs uppercase tracking-widest pl-1 mb-2">현재 수행 가능한 임무</h3>

                    {/* Quest Card */}
                    <div
                        className="group relative border border-white/10 bg-black/40 hover:bg-black/60 hover:border-babel-gold/50 rounded-xl p-6 pr-32 transition-all duration-300 cursor-pointer overflow-hidden"
                        onClick={() => navigate('/world-map')}
                    >
                        {/* Hover Glow */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-babel-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-xl -z-10" />

                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-xl font-serif text-white group-hover:text-babel-gold transition-colors flex items-center gap-2">
                                <Zap size={20} className="text-babel-gold/80" />
                                일일 퀘스트: 알파 세트 01
                            </h3>
                            <span className="text-xs font-mono text-stone-500">Code: A-01</span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-stone-400 font-mono mb-4">
                            <span className="flex items-center gap-1.5 bg-red-900/10 px-2 py-1 rounded text-red-400 border border-red-900/30">
                                <Clock size={12} /> 24시간 남음
                            </span>
                            <span className="flex items-center gap-1.5 bg-blue-900/10 px-2 py-1 rounded text-blue-400 border border-blue-900/30">
                                <Trophy size={12} /> 보상: 지식 +5
                            </span>
                        </div>

                        <p className="text-stone-400 text-sm leading-relaxed max-w-xl">
                            20개의 단어 파편이 발견되었습니다. 데이터가 부식되기 전에 회수하십시오.
                            <br /><span className="text-xs text-stone-600">권장 레벨: Lv.1 이상</span>
                        </p>

                        {/* Action Button Area */}
                        <div className="absolute top-0 right-0 bottom-0 w-24 border-l border-white/5 bg-white/5 group-hover:bg-babel-gold/10 transition-colors flex flex-col items-center justify-center gap-2">
                            <span className="text-[10px] uppercase text-stone-500 tracking-widest group-hover:text-babel-gold transition-colors">Status</span>
                            <div className="px-3 py-1 bg-babel-gold text-black text-xs font-bold rounded shadow-[0_0_10px_rgba(212,175,55,0.4)]">
                                준비됨
                            </div>
                        </div>
                    </div>

                    {/* Completed Quests Section */}
                    <h3 className="text-stone-400 text-xs uppercase tracking-widest pl-1 mb-2 mt-8">완료된 임무 (Completed)</h3>

                    <div className="space-y-3">
                        {MOCK_COMPLETED_QUESTS.map(quest => (
                            <div
                                key={quest.id}
                                className="group relative border border-white/10 bg-black/30 rounded-xl p-4 pr-28 transition-all duration-300 hover:border-emerald-500/30"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-emerald-900/30 rounded-lg border border-emerald-500/30">
                                        <CheckCircle size={16} className="text-emerald-400" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="text-sm font-bold text-white">{quest.title}</h4>
                                            <span className="text-[10px] font-mono text-stone-600">{quest.code}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] text-stone-500">
                                            <span>완료: {quest.completedAt}</span>
                                            <span className="text-emerald-400 font-bold">득점: {quest.score}%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Review Button */}
                                <div className="absolute top-0 right-0 bottom-0 w-24 border-l border-white/5 bg-white/5 hover:bg-babel-gold/10 transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer rounded-r-xl"
                                    onClick={() => setReviewModal(quest)}
                                >
                                    <BookOpen size={16} className="text-stone-400 group-hover:text-babel-gold transition-colors" />
                                    <span className="text-[10px] uppercase text-stone-500 tracking-widest group-hover:text-babel-gold transition-colors">Review</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Footer / System Info */}
            <footer className="relative z-10 mt-12 border-t border-white/5 pt-6 flex justify-between items-center text-[10px] text-stone-600 font-mono">
                <div>SYSTEM STATUS: NORMAL</div>
                <div>PROJECT BABEL ver 0.5.0</div>
            </footer>

            {/* Dev Controls Overlay (Optional) */}
            <div className="fixed bottom-8 right-8 flex flex-col gap-2 z-50 opacity-20 hover:opacity-100 transition-opacity">
                <div className="text-[10px] text-stone-500 text-right mb-1">DEV TOOLS</div>
                <div className="flex gap-2">
                    <button onClick={simulateDamage} className="px-3 py-2 bg-red-950 border border-red-800 text-red-400 text-xs rounded hover:bg-red-900 transition-colors shadow-lg">
                        -10 HP (피격)
                    </button>
                    <button onClick={simulateHeal} className="px-3 py-2 bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs rounded hover:bg-emerald-900 transition-colors shadow-lg">
                        +10 HP (회복)
                    </button>
                </div>
            </div>

            {/* Vocab Review Modal */}
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
