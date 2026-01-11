import React, { useState, useMemo } from 'react';
import {
    Users,
    Search,
    CheckCircle,
    Clock,
    AlertTriangle,
    Coins,
    FileBarChart,
    X,
    ChevronLeft,
    ChevronRight,
    BarChart3
} from 'lucide-react';
import { clsx } from 'clsx';

// Enhanced Student Interface
interface StudentData {
    id: string;
    name: string;
    level: number;
    incompleteCount: number; // 미완과제 누적
    avgScoreRate: number; // 평균 득점률 (등급 계산용)
    weeklyAssignment: {
        projectName: string;
        passCount: number;
        totalSequences: number;
        scoreRate: number;
    };
    pendingRefund: {
        amount: number;
        requestedAt: string;
    } | null;
    stats: {
        accuracy: number;
        speed: number;
        persistence: number;
        knowledge: number;
    };
    incompleteSequences: { missionName: string; setIndex: number; dueDate: string }[];
}

// Grade calculation helper
const calculateGrade = (scoreRate: number): { grade: string; color: string } => {
    if (scoreRate >= 95) return { grade: 'A+', color: 'text-emerald-400' };
    if (scoreRate >= 90) return { grade: 'A', color: 'text-emerald-400' };
    if (scoreRate >= 85) return { grade: 'B+', color: 'text-blue-400' };
    if (scoreRate >= 80) return { grade: 'B', color: 'text-blue-400' };
    if (scoreRate >= 75) return { grade: 'C+', color: 'text-yellow-400' };
    if (scoreRate >= 70) return { grade: 'C', color: 'text-yellow-400' };
    if (scoreRate >= 60) return { grade: 'D', color: 'text-orange-400' };
    if (scoreRate >= 50) return { grade: 'D-', color: 'text-orange-400' };
    return { grade: 'F', color: 'text-red-400' };
};

// Mock Data
const MOCK_STUDENTS: StudentData[] = [
    {
        id: 's1', name: '김민준', level: 3,
        incompleteCount: 2, avgScoreRate: 85,
        weeklyAssignment: { projectName: '9월 모의고사 A', passCount: 4, totalSequences: 5, scoreRate: 85 },
        pendingRefund: { amount: 5000, requestedAt: '2026-01-10' },
        stats: { accuracy: 78, speed: 65, persistence: 82, knowledge: 71 },
        incompleteSequences: [
            { missionName: '9월 모의고사 A', setIndex: 5, dueDate: '1/15' },
            { missionName: 'Voca Day 3', setIndex: 2, dueDate: '1/12' }
        ]
    },
    {
        id: 's2', name: '이서연', level: 4,
        incompleteCount: 5, avgScoreRate: 72,
        weeklyAssignment: { projectName: '9월 모의고사 A', passCount: 2, totalSequences: 5, scoreRate: 72 },
        pendingRefund: null,
        stats: { accuracy: 68, speed: 72, persistence: 55, knowledge: 65 },
        incompleteSequences: [
            { missionName: '9월 모의고사 A', setIndex: 3, dueDate: '1/10' },
            { missionName: '9월 모의고사 A', setIndex: 4, dueDate: '1/12' },
            { missionName: '9월 모의고사 A', setIndex: 5, dueDate: '1/15' },
            { missionName: 'Voca Day 1', setIndex: 1, dueDate: '1/8' },
            { missionName: 'Voca Day 2', setIndex: 3, dueDate: '1/11' }
        ]
    },
    {
        id: 's3', name: '박지훈', level: 2,
        incompleteCount: 0, avgScoreRate: 95,
        weeklyAssignment: { projectName: 'Voca Day 1-5', passCount: 5, totalSequences: 5, scoreRate: 95 },
        pendingRefund: null,
        stats: { accuracy: 92, speed: 88, persistence: 95, knowledge: 90 },
        incompleteSequences: []
    },
    {
        id: 's4', name: '최예은', level: 5,
        incompleteCount: 0, avgScoreRate: 98,
        weeklyAssignment: { projectName: '9월 모의고사 A', passCount: 5, totalSequences: 5, scoreRate: 100 },
        pendingRefund: { amount: 10000, requestedAt: '2026-01-08' },
        stats: { accuracy: 96, speed: 91, persistence: 99, knowledge: 95 },
        incompleteSequences: []
    },
    {
        id: 's5', name: '정하윤', level: 1,
        incompleteCount: 8, avgScoreRate: 45,
        weeklyAssignment: { projectName: 'Voca Day 1-5', passCount: 1, totalSequences: 5, scoreRate: 60 },
        pendingRefund: null,
        stats: { accuracy: 42, speed: 55, persistence: 30, knowledge: 38 },
        incompleteSequences: [
            { missionName: 'Voca Day 1', setIndex: 2, dueDate: '1/5' },
            { missionName: 'Voca Day 1', setIndex: 3, dueDate: '1/6' },
            { missionName: 'Voca Day 2', setIndex: 1, dueDate: '1/7' },
            { missionName: 'Voca Day 2', setIndex: 2, dueDate: '1/8' },
            { missionName: 'Voca Day 3', setIndex: 1, dueDate: '1/9' },
            { missionName: 'Voca Day 3', setIndex: 2, dueDate: '1/10' },
            { missionName: 'Voca Day 4', setIndex: 1, dueDate: '1/11' },
            { missionName: 'Voca Day 5', setIndex: 1, dueDate: '1/12' }
        ]
    },
];

// STAT Modal Component
const StatModal: React.FC<{
    student: StudentData;
    onClose: () => void;
}> = ({ student, onClose }) => {
    const { grade, color } = calculateGrade(student.avgScoreRate);
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-stone-900 border border-babel-gold/30 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <button onClick={onClose} className="absolute top-4 right-4 text-stone-500 hover:text-white">
                    <X size={20} />
                </button>
                <h3 className="text-xl font-serif text-babel-gold mb-4 flex items-center gap-2">
                    <BarChart3 size={20} />
                    {student.name} 학습 특성
                </h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/40 p-4 rounded-lg border border-white/10 text-center">
                            <div className="text-xs text-stone-500 mb-1">평균 득점률</div>
                            <div className={clsx("text-2xl font-bold", color)}>{student.avgScoreRate}%</div>
                        </div>
                        <div className="bg-black/40 p-4 rounded-lg border border-white/10 text-center">
                            <div className="text-xs text-stone-500 mb-1">등급</div>
                            <div className={clsx("text-2xl font-bold", color)}>{grade}</div>
                        </div>
                    </div>
                    <div className="bg-black/40 p-4 rounded-lg border border-white/10 space-y-3">
                        {[
                            { label: '정확도', key: 'accuracy', icon: '🎯' },
                            { label: '속도', key: 'speed', icon: '⚡' },
                            { label: '끈기', key: 'persistence', icon: '💪' },
                            { label: '지식', key: 'knowledge', icon: '📚' }
                        ].map(stat => (
                            <div key={stat.key} className="flex items-center gap-3">
                                <span className="text-lg">{stat.icon}</span>
                                <span className="text-xs text-stone-400 w-12">{stat.label}</span>
                                <div className="flex-1 h-2 bg-black rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-babel-gold rounded-full transition-all"
                                        style={{ width: `${student.stats[stat.key as keyof typeof student.stats]}%` }}
                                    />
                                </div>
                                <span className="text-xs text-white w-8 text-right">{student.stats[stat.key as keyof typeof student.stats]}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <button onClick={onClose} className="w-full mt-4 px-4 py-3 bg-babel-gold text-black font-bold rounded-lg hover:bg-yellow-500">닫기</button>
            </div>
        </div>
    );
};

// Incomplete Sequences Modal
const IncompleteModal: React.FC<{
    student: StudentData;
    onClose: () => void;
}> = ({ student, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-stone-900 border border-red-500/30 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <button onClick={onClose} className="absolute top-4 right-4 text-stone-500 hover:text-white">
                <X size={20} />
            </button>
            <h3 className="text-xl font-serif text-red-400 mb-4 flex items-center gap-2">
                <AlertTriangle size={20} />
                {student.name} 미완과제 목록 ({student.incompleteCount}개)
            </h3>
            <div className="max-h-64 overflow-y-auto space-y-2">
                {student.incompleteSequences.length > 0 ? student.incompleteSequences.map((seq, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-black/40 p-3 rounded-lg border border-white/10">
                        <div>
                            <div className="text-sm text-white">{seq.missionName}</div>
                            <div className="text-xs text-stone-500">시퀀스 {seq.setIndex}</div>
                        </div>
                        <div className="text-xs text-red-400">기한: {seq.dueDate}</div>
                    </div>
                )) : (
                    <div className="text-center text-stone-500 py-8">미완과제 없음</div>
                )}
            </div>
            <button onClick={onClose} className="w-full mt-4 px-4 py-3 border border-white/20 text-stone-400 rounded-lg hover:bg-white/5">닫기</button>
        </div>
    </div>
);

// Refund Modal
const RefundModal: React.FC<{ student: StudentData; onComplete: () => void; onCancel: () => void }> = ({ student, onComplete, onCancel }) => {
    const refund = student.pendingRefund;
    if (!refund) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-stone-900 border border-babel-gold/30 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <button onClick={onCancel} className="absolute top-4 right-4 text-stone-500 hover:text-white"><X size={20} /></button>
                <h3 className="text-xl font-serif text-babel-gold mb-4 flex items-center gap-2"><Coins size={20} />포인트 환급</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-black/40 p-4 rounded-lg border border-white/10"><div className="text-xs text-stone-500">환급액</div><div className="text-babel-gold font-bold text-xl">{refund.amount.toLocaleString()}원</div></div>
                    <div className="bg-black/40 p-4 rounded-lg border border-white/10"><div className="text-xs text-stone-500">신청일</div><div className="text-white">{refund.requestedAt}</div></div>
                </div>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-3 border border-white/20 text-stone-400 rounded-lg hover:bg-white/5">취소</button>
                    <button onClick={() => { alert(`${student.name} 환급 완료`); onComplete(); }} className="flex-1 py-3 bg-babel-gold text-black font-bold rounded-lg hover:bg-yellow-500">처리</button>
                </div>
            </div>
        </div>
    );
};

// Monthly Report Modal
const MonthlyReportModal: React.FC<{ student: StudentData; onClose: () => void }> = ({ student, onClose }) => {
    const [month, setMonth] = useState('2026-01');
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-stone-900 border border-babel-gold/30 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
                <button onClick={onClose} className="absolute top-4 right-4 text-stone-500 hover:text-white"><X size={20} /></button>
                <h3 className="text-xl font-serif text-babel-gold mb-4 flex items-center gap-2"><FileBarChart size={20} />월간 리포트 - {student.name}</h3>
                <div className="flex justify-center gap-4 mb-4">
                    <button onClick={() => setMonth('2025-12')} className="p-2 hover:bg-white/10 rounded-lg text-stone-400"><ChevronLeft size={20} /></button>
                    <span className="px-4 py-2 bg-black/40 rounded-lg text-white">{month === '2026-01' ? '2026년 1월' : '2025년 12월'}</span>
                    <button onClick={() => setMonth('2026-01')} className="p-2 hover:bg-white/10 rounded-lg text-stone-400"><ChevronRight size={20} /></button>
                </div>
                <div className="bg-black/40 p-8 rounded-lg border border-white/10 text-center">
                    <FileBarChart size={48} className="mx-auto mb-4 text-stone-600" />
                    <p className="text-stone-500">API 연동 예정</p>
                </div>
                <button onClick={onClose} className="w-full mt-4 px-4 py-3 bg-babel-gold text-black font-bold rounded-lg hover:bg-yellow-500">닫기</button>
            </div>
        </div>
    );
};

// Main Component
export const StudentMonitor: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'score' | 'incomplete'>('name');
    const [refundModal, setRefundModal] = useState<StudentData | null>(null);
    const [reportModal, setReportModal] = useState<StudentData | null>(null);
    const [statModal, setStatModal] = useState<StudentData | null>(null);
    const [incompleteModal, setIncompleteModal] = useState<StudentData | null>(null);

    const filteredStudents = useMemo(() => {
        let result = [...MOCK_STUDENTS];
        if (searchTerm) {
            result = result.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        result.sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name, 'ko');
            if (sortBy === 'score') return b.avgScoreRate - a.avgScoreRate;
            if (sortBy === 'incomplete') return b.incompleteCount - a.incompleteCount;
            return 0;
        });
        return result;
    }, [searchTerm, sortBy]);

    const pendingRefundCount = MOCK_STUDENTS.filter(s => s.pendingRefund).length;

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-serif text-white flex items-center gap-3">
                        <Users size={24} className="text-babel-gold" />
                        학생 DB
                    </h2>
                    <p className="text-xs text-stone-500 mt-1">학생 학습 현황 및 관리</p>
                </div>
                {pendingRefundCount > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-babel-gold/10 border border-babel-gold/30 rounded-lg text-babel-gold text-sm">
                        <Coins size={16} />환급 대기: {pendingRefundCount}건
                    </div>
                )}
            </div>

            {/* Search & Sort */}
            <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" />
                    <input type="text" placeholder="학생 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-stone-600 focus:border-babel-gold/50 focus:outline-none" />
                </div>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm">
                    <option value="name">이름순</option>
                    <option value="score">득점순</option>
                    <option value="incomplete">미완순</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-black/40 border border-white/10 rounded-xl overflow-hidden">
                <div className="grid grid-cols-12 gap-2 p-4 border-b border-white/10 bg-black/20 text-[10px] text-stone-500 uppercase tracking-widest">
                    <div className="col-span-2">학생</div>
                    <div className="col-span-1 text-center">등급</div>
                    <div className="col-span-1 text-center">미완</div>
                    <div className="col-span-2">이번주</div>
                    <div className="col-span-2 text-center">수행</div>
                    <div className="col-span-1 text-center">득점</div>
                    <div className="col-span-1 text-center">환급</div>
                    <div className="col-span-2 text-right">액션</div>
                </div>
                <div className="divide-y divide-white/5">
                    {filteredStudents.map(student => {
                        const { grade, color } = calculateGrade(student.avgScoreRate);
                        const isComplete = student.weeklyAssignment.passCount === student.weeklyAssignment.totalSequences;
                        return (
                            <div key={student.id} className={clsx("grid grid-cols-12 gap-2 p-4 items-center hover:bg-white/5", student.incompleteCount > 5 && "bg-red-900/10")}>
                                {/* Name */}
                                <div className="col-span-2 flex items-center gap-2">
                                    <div className="w-8 h-8 bg-babel-gold/20 rounded-full flex items-center justify-center text-babel-gold text-xs font-bold">{student.name[0]}</div>
                                    <div>
                                        <div className="text-white text-sm font-medium">{student.name}</div>
                                        <button onClick={() => setStatModal(student)} className="text-[10px] text-babel-gold hover:underline flex items-center gap-0.5">
                                            <BarChart3 size={10} />STAT
                                        </button>
                                    </div>
                                </div>
                                {/* Grade */}
                                <div className="col-span-1 text-center">
                                    <span className={clsx("text-lg font-bold", color)}>{grade}</span>
                                </div>
                                {/* Incomplete */}
                                <div className="col-span-1 text-center">
                                    {student.incompleteCount > 0 ? (
                                        <button onClick={() => setIncompleteModal(student)} className="inline-flex items-center gap-1 px-2 py-1 bg-red-900/30 border border-red-500/30 rounded text-red-400 text-xs font-bold hover:bg-red-900/50">
                                            <AlertTriangle size={10} />{student.incompleteCount}
                                        </button>
                                    ) : <span className="text-emerald-400 text-xs">✓</span>}
                                </div>
                                {/* Weekly */}
                                <div className="col-span-2 text-xs text-white truncate">{student.weeklyAssignment.projectName}</div>
                                {/* Progress */}
                                <div className="col-span-2 text-center">
                                    <span className={clsx("inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold", isComplete ? "bg-emerald-900/30 text-emerald-400 border border-emerald-500/30" : "bg-blue-900/30 text-blue-400 border border-blue-500/30")}>
                                        {isComplete ? <CheckCircle size={10} /> : <Clock size={10} />}{student.weeklyAssignment.passCount}/{student.weeklyAssignment.totalSequences}
                                    </span>
                                </div>
                                {/* Score */}
                                <div className="col-span-1 text-center text-sm font-bold" style={{ color: student.weeklyAssignment.scoreRate < 70 ? '#f87171' : '#4ade80' }}>{student.weeklyAssignment.scoreRate}%</div>
                                {/* Refund */}
                                <div className="col-span-1 text-center">
                                    {student.pendingRefund ? (
                                        <button onClick={() => setRefundModal(student)} className="px-2 py-1 bg-babel-gold/20 border border-babel-gold/30 rounded text-babel-gold text-[10px] font-bold animate-pulse"><Coins size={10} /></button>
                                    ) : <span className="text-stone-600 text-xs">-</span>}
                                </div>
                                {/* Actions */}
                                <div className="col-span-2 flex justify-end gap-2">
                                    <button onClick={() => setReportModal(student)} className="px-2 py-1 border border-white/10 rounded text-[10px] text-stone-400 hover:text-white hover:bg-babel-gold/10">
                                        <FileBarChart size={12} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="p-4 bg-black/30 border-t border-white/10 flex justify-between text-xs text-stone-500">
                    <span>총 {filteredStudents.length}명</span>
                    <span>위험군(F): {filteredStudents.filter(s => s.avgScoreRate < 50).length}명</span>
                </div>
            </div>

            {/* Modals */}
            {refundModal && <RefundModal student={refundModal} onComplete={() => setRefundModal(null)} onCancel={() => setRefundModal(null)} />}
            {reportModal && <MonthlyReportModal student={reportModal} onClose={() => setReportModal(null)} />}
            {statModal && <StatModal student={statModal} onClose={() => setStatModal(null)} />}
            {incompleteModal && <IncompleteModal student={incompleteModal} onClose={() => setIncompleteModal(null)} />}
        </div>
    );
};
