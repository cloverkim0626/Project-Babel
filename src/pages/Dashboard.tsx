import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HpBar } from '../components/HpBar';
import { ObserversLog } from '../components/ObserversLog';
import { VocabReviewModal } from '../components/VocabReviewModal';
import { useAuth } from '../hooks/useAuth';
import { useGameEngine } from '../hooks/useGameEngine';
import { Zap, Clock, Trophy, CheckCircle, BookOpen, AlertTriangle, ArrowRight, UserCog } from 'lucide-react';
import { clsx } from 'clsx';

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
        dueDate: '어제 마감',
        isOverdue: true,
        missionId: 'voca-day-1'
    }
];

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { role, user, loading } = useAuth();
    const { levelSpecs, points } = useGameEngine();

    // Mock Data State
    const [currentHp, setCurrentHp] = useState(levelSpecs.maxHp);
    const [reviewModal, setReviewModal] = useState<CompletedQuest | null>(null);

    // Sync current HP if max changes (Level Up)
    React.useEffect(() => {
        setCurrentHp(prev => Math.min(prev + 10, levelSpecs.maxHp));
    }, [levelSpecs.maxHp]);

    if (loading) return null;
    if (!user) return null;

    const { level } = levelSpecs;

    const getCharacterImage = (_cls: string) => {
        if (role === 'master') return '/assets/master_architect.png';
        return '/assets/character_base.png';
    };

    const simulateDamage = () => setCurrentHp(prev => Math.max(0, prev - 10));
    const simulateHeal = () => setCurrentHp(prev => Math.min(levelSpecs.maxHp, prev + 10));

    // XP Progress
    const xpPercent = (levelSpecs.xp / levelSpecs.nextLevelXp) * 100;

    return (
        <div className="min-h-screen bg-obsidian text-paper font-mono p-4 md:p-8 overflow-x-hidden relative">
            <div className="absolute inset-0 bg-[#0a0a0a]" />
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]" />
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none" />

            {/* Top Bar */}
            <header className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-white/10 pb-6">
                <div className="flex items-center gap-4">
                    <div className="relative group cursor-pointer">
                        <div className="w-20 h-20 rounded-xl border-2 border-babel-gold p-1 bg-black overflow-hidden relative shadow-[0_0_15px_rgba(212,175,55,0.3)] group-hover:shadow-[0_0_25px_rgba(212,175,55,0.6)] transition-all duration-500">
                            <img
                                src={getCharacterImage(user.classType)}
                                alt="Character"
                                className="w-full h-full object-cover rounded-lg opacity-80 group-hover:opacity-100 transition-opacity"
                            />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-babel-gold text-black font-bold flex items-center justify-center rounded-full border-2 border-black z-10 shadow-lg">
                            {level}
                        </div>
                    </div>

                    <div>
                        <h1 className="text-3xl font-serif text-white tracking-wide flex items-center gap-2">
                            {user.nickname}
                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-stone-400 border border-white/10">{user.classType}</span>
                        </h1>
                        <p className="text-stone-500 text-xs mt-1 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            System Online
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6 bg-black/40 px-6 py-3 rounded-xl border border-white/10 backdrop-blur-md">
                    <div className="text-right">
                        <div className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">Health Points</div>
                        <HpBar current={currentHp} max={levelSpecs.maxHp} />
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    <div className="text-right">
                        <div className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">Knowledge Points</div>
                        <div className="text-babel-gold font-bold text-xl flex items-center justify-end gap-1">
                            {points.toLocaleString()} <span className="text-xs text-babel-gold/50">KP</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Stats */}
                <div className="lg:col-span-1 space-y-6">
                    <ObserversLog stats={{
                        accuracy: 78,
                        speed: 65,
                        persistence: 82,
                        knowledge: 71,
                        planning: 50,
                        trust: 90
                    }} />

                    <div className="border border-white/10 bg-black/60 backdrop-blur-md rounded-xl p-6 relative overflow-hidden shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-babel-gold font-serif text-lg flex items-center gap-2 border-b border-babel-gold/30 pb-1 pr-4">
                                <UserCog size={18} /> 상태창 (Status)
                            </h3>
                        </div>
                        <div className="flex items-end justify-between mb-2">
                            <div className="text-white font-bold text-lg">{user.classType}</div>
                            <div className="text-stone-400 text-xs font-mono mb-1">필요 경험치</div>
                        </div>
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
                    </div>
                </div>

                {/* Center Column: Active Quests */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Incomplete Tasks Section */}
                    {MOCK_INCOMPLETE_TASKS.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-red-400 text-xs uppercase tracking-widest pl-1 mb-2 flex items-center gap-2">
                                <AlertTriangle size={12} />
                                미완료 과제 (Retake Required)
                            </h3>
                            <div className="grid gap-3">
                                {MOCK_INCOMPLETE_TASKS.map(task => (
                                    <div
                                        key={task.id}
                                        onClick={() => {
                                            if (confirm(`'${task.title}' 재시험을 시작하시겠습니까?`)) {
                                                navigate(`/mission/${task.missionId}/play`);
                                            }
                                        }}
                                        className="group flex items-center justify-between bg-red-900/10 border border-red-500/20 hover:bg-red-900/20 hover:border-red-500/40 p-4 rounded-xl cursor-pointer transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                                <Zap size={18} />
                                            </div>
                                            <div>
                                                <div className="text-white font-bold group-hover:text-red-400 transition-colors">{task.title}</div>
                                                <div className="text-xs text-stone-500 font-mono">Code: {task.code}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={clsx("text-xs font-bold px-2 py-1 rounded", task.isOverdue ? "text-red-500 bg-red-900/20" : "text-amber-500 bg-amber-900/20")}>
                                                {task.dueDate}
                                            </span>
                                            <ArrowRight size={16} className="text-stone-600 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <h3 className="text-stone-400 text-xs uppercase tracking-widest pl-1 mb-2">현재 수행 가능한 임무</h3>

                    <div
                        className="group relative border border-white/10 bg-black/40 hover:bg-black/60 hover:border-babel-gold/50 rounded-xl p-6 pr-32 transition-all duration-300 cursor-pointer overflow-hidden mb-8"
                        onClick={() => navigate('/world-map')}
                    >
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

                        <div className="absolute top-0 right-0 bottom-0 w-24 border-l border-white/5 bg-white/5 group-hover:bg-babel-gold/10 transition-colors flex flex-col items-center justify-center gap-2">
                            <span className="text-[10px] uppercase text-stone-500 tracking-widest group-hover:text-babel-gold transition-colors">Status</span>
                            <div className="px-3 py-1 bg-babel-gold text-black text-xs font-bold rounded shadow-[0_0_10px_rgba(212,175,55,0.4)]">
                                준비됨
                            </div>
                        </div>
                    </div>

                    <h3 className="text-stone-400 text-xs uppercase tracking-widest pl-1 mb-2">완료된 임무 (Completed)</h3>

                    <div className="grid gap-4">
                        {MOCK_COMPLETED_QUESTS.map(quest => (
                            <div
                                key={quest.id}
                                className="group bg-black/40 border border-white/10 hover:border-emerald-500/50 p-4 rounded-xl transition-all cursor-pointer hover:bg-black/60"
                                onClick={() => setReviewModal(quest)}
                            >
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-emerald-900/20 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                                            <CheckCircle size={18} />
                                        </div>
                                        <div>
                                            <div className="text-white font-bold group-hover:text-emerald-400 transition-colors">{quest.title}</div>
                                            <div className="text-xs text-stone-500 font-mono">Code: {quest.code} • {quest.completedAt}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-emerald-400 font-bold text-lg">{quest.score}점</div>
                                        <div className="text-[10px] text-stone-500 uppercase tracking-widest flex items-center gap-1 justify-end group-hover:text-emerald-300">
                                            <BookOpen size={10} />
                                            Review
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <footer className="relative z-10 mt-12 border-t border-white/5 pt-6 flex justify-between items-center text-[10px] text-stone-600 font-mono">
                <div>SYSTEM STATUS: NORMAL</div>
                <div>PROJECT BABEL ver 0.5.0</div>
            </footer>

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
