import React, { useState, useMemo } from 'react';
import {
    Users,
    Search,
    ArrowUpDown,
    CheckCircle,
    Clock,
    AlertTriangle,
    Coins,
    FileBarChart,
    X,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';

// Enhanced Student Interface
interface StudentData {
    id: string;
    name: string;
    level: number;
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
    monthlyData?: {
        [month: string]: {
            weeklyProgress: number[];
            avgScore: number;
            missedWords: string[];
        };
    };
}

// Mock Data with enhanced fields
const MOCK_STUDENTS: StudentData[] = [
    {
        id: 's1',
        name: '김민준',
        level: 3,
        weeklyAssignment: { projectName: '9월 모의고사 A', passCount: 4, totalSequences: 5, scoreRate: 85 },
        pendingRefund: { amount: 5000, requestedAt: '2026-01-10' },
        monthlyData: {
            '2026-01': { weeklyProgress: [80, 85, 90, 88], avgScore: 86, missedWords: ['elaborate', 'phenomenon'] }
        }
    },
    {
        id: 's2',
        name: '이서연',
        level: 4,
        weeklyAssignment: { projectName: '9월 모의고사 A', passCount: 2, totalSequences: 5, scoreRate: 72 },
        pendingRefund: null,
        monthlyData: {
            '2026-01': { weeklyProgress: [70, 75, 72, 78], avgScore: 74, missedWords: ['substantial', 'inherent', 'profound'] }
        }
    },
    {
        id: 's3',
        name: '박지훈',
        level: 2,
        weeklyAssignment: { projectName: 'Voca Day 1-5', passCount: 5, totalSequences: 5, scoreRate: 95 },
        pendingRefund: null,
        monthlyData: {}
    },
    {
        id: 's4',
        name: '최예은',
        level: 5,
        weeklyAssignment: { projectName: '9월 모의고사 A', passCount: 5, totalSequences: 5, scoreRate: 100 },
        pendingRefund: { amount: 10000, requestedAt: '2026-01-08' },
        monthlyData: {
            '2026-01': { weeklyProgress: [95, 98, 100, 97], avgScore: 97, missedWords: [] }
        }
    },
    {
        id: 's5',
        name: '정하윤',
        level: 1,
        weeklyAssignment: { projectName: 'Voca Day 1-5', passCount: 1, totalSequences: 5, scoreRate: 60 },
        pendingRefund: null,
        monthlyData: {}
    },
];

// Refund Modal Component
const RefundModal: React.FC<{
    student: StudentData;
    onComplete: () => void;
    onCancel: () => void;
}> = ({ student, onComplete, onCancel }) => {
    const refund = student.pendingRefund;
    if (!refund) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-stone-900 border border-babel-gold/30 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <button onClick={onCancel} className="absolute top-4 right-4 text-stone-500 hover:text-white">
                    <X size={20} />
                </button>

                <h3 className="text-xl font-serif text-babel-gold mb-4 flex items-center gap-2">
                    <Coins size={20} />
                    포인트 환급 요청
                </h3>

                <div className="space-y-4">
                    <div className="bg-black/40 border border-white/10 rounded-lg p-4">
                        <div className="text-xs text-stone-500 mb-1">학생</div>
                        <div className="text-white font-bold">{student.name}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/40 border border-white/10 rounded-lg p-4">
                            <div className="text-xs text-stone-500 mb-1">환급 금액</div>
                            <div className="text-babel-gold font-bold text-xl">{refund.amount.toLocaleString()}원</div>
                        </div>
                        <div className="bg-black/40 border border-white/10 rounded-lg p-4">
                            <div className="text-xs text-stone-500 mb-1">신청일</div>
                            <div className="text-white">{refund.requestedAt}</div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-3 border border-white/20 text-stone-400 rounded-lg hover:bg-white/5 transition-colors"
                        >
                            취소
                        </button>
                        <button
                            onClick={() => {
                                alert(`${student.name}님의 ${refund.amount.toLocaleString()}원 환급 처리가 완료되었습니다.`);
                                onComplete();
                            }}
                            className="flex-1 px-4 py-3 bg-babel-gold text-black font-bold rounded-lg hover:bg-yellow-500 transition-colors"
                        >
                            처리완료
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Monthly Report Modal (UI placeholder)
const MonthlyReportModal: React.FC<{
    student: StudentData;
    onClose: () => void;
}> = ({ student, onClose }) => {
    const [currentMonth, setCurrentMonth] = useState('2026-01');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-stone-900 border border-babel-gold/30 rounded-2xl p-6 w-full max-w-2xl shadow-2xl">
                <button onClick={onClose} className="absolute top-4 right-4 text-stone-500 hover:text-white">
                    <X size={20} />
                </button>

                <h3 className="text-xl font-serif text-babel-gold mb-4 flex items-center gap-2">
                    <FileBarChart size={20} />
                    월간 리포트 - {student.name}
                </h3>

                {/* Month Navigator */}
                <div className="flex items-center justify-center gap-4 mb-6">
                    <button
                        onClick={() => setCurrentMonth('2025-12')}
                        className="p-2 hover:bg-white/10 rounded-lg text-stone-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-white font-bold px-4 py-2 bg-black/40 rounded-lg border border-white/10">
                        {currentMonth === '2026-01' ? '2026년 1월' : '2025년 12월'}
                    </span>
                    <button
                        onClick={() => setCurrentMonth('2026-01')}
                        className="p-2 hover:bg-white/10 rounded-lg text-stone-400 hover:text-white transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Content Placeholder */}
                <div className="bg-black/40 border border-white/10 rounded-xl p-8 text-center">
                    <FileBarChart size={48} className="mx-auto mb-4 text-stone-600" />
                    <p className="text-stone-500 mb-2">월간 리포트 데이터</p>
                    <p className="text-xs text-stone-600">API 연동 예정</p>
                    <div className="mt-6 text-xs text-stone-500 space-y-1">
                        <p>• 주차별 수행도</p>
                        <p>• 득점률</p>
                        <p>• 주차별 오답단어</p>
                        <p>• 세트별 득점 속도</p>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-babel-gold text-black font-bold rounded-lg hover:bg-yellow-500 transition-colors"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
};

// Main Component
export const StudentMonitor: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'score' | 'level'>('name');
    const [refundModal, setRefundModal] = useState<StudentData | null>(null);
    const [reportModal, setReportModal] = useState<StudentData | null>(null);

    // Filtered and sorted students
    const filteredStudents = useMemo(() => {
        let result = [...MOCK_STUDENTS];

        // Search filter
        if (searchTerm) {
            result = result.filter(s =>
                s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.weeklyAssignment.projectName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Sort
        result.sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name, 'ko');
            if (sortBy === 'score') return b.weeklyAssignment.scoreRate - a.weeklyAssignment.scoreRate;
            if (sortBy === 'level') return b.level - a.level;
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
                        Student Database
                    </h2>
                    <p className="text-xs text-stone-500 mt-1">학생 학습 현황 및 관리</p>
                </div>
                {pendingRefundCount > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-babel-gold/10 border border-babel-gold/30 rounded-lg text-babel-gold text-sm">
                        <Coins size={16} />
                        <span>환급 대기: {pendingRefundCount}건</span>
                    </div>
                )}
            </div>

            {/* Search & Filter Bar */}
            <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" />
                    <input
                        type="text"
                        placeholder="학생 이름 또는 과제명으로 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-stone-600 focus:border-babel-gold/50 focus:outline-none transition-colors"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <ArrowUpDown size={16} className="text-stone-500" />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'name' | 'score' | 'level')}
                        className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-babel-gold/50 focus:outline-none"
                    >
                        <option value="name">이름순</option>
                        <option value="score">점수순</option>
                        <option value="level">레벨순</option>
                    </select>
                </div>
            </div>

            {/* Student Table */}
            <div className="bg-black/40 border border-white/10 rounded-xl overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-black/20 text-[10px] text-stone-500 uppercase tracking-widest">
                    <div className="col-span-3">학생</div>
                    <div className="col-span-2">이번주 과제</div>
                    <div className="col-span-2 text-center">수행도</div>
                    <div className="col-span-2 text-center">득점률</div>
                    <div className="col-span-1 text-center">환급</div>
                    <div className="col-span-2 text-right">액션</div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-white/5">
                    {filteredStudents.map(student => {
                        const { weeklyAssignment, pendingRefund } = student;
                        const isComplete = weeklyAssignment.passCount === weeklyAssignment.totalSequences;
                        const isDanger = weeklyAssignment.scoreRate < 70;

                        return (
                            <div
                                key={student.id}
                                className={clsx(
                                    "grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors",
                                    isDanger && "bg-red-900/10"
                                )}
                            >
                                {/* Student Info */}
                                <div className="col-span-3 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-babel-gold/20 rounded-full flex items-center justify-center text-babel-gold font-bold">
                                        {student.name.slice(0, 1)}
                                    </div>
                                    <div>
                                        <div className="text-white font-medium">{student.name}</div>
                                        <div className="text-[10px] text-stone-500">Lv.{student.level}</div>
                                    </div>
                                </div>

                                {/* Weekly Assignment */}
                                <div className="col-span-2">
                                    <div className="text-sm text-white">{weeklyAssignment.projectName}</div>
                                </div>

                                {/* Progress */}
                                <div className="col-span-2 text-center">
                                    <div className={clsx(
                                        "inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold",
                                        isComplete
                                            ? "bg-emerald-900/30 border border-emerald-500/30 text-emerald-400"
                                            : "bg-blue-900/30 border border-blue-500/30 text-blue-400"
                                    )}>
                                        {isComplete ? <CheckCircle size={12} /> : <Clock size={12} />}
                                        {weeklyAssignment.passCount}/{weeklyAssignment.totalSequences}
                                    </div>
                                </div>

                                {/* Score Rate */}
                                <div className="col-span-2 text-center">
                                    <span className={clsx(
                                        "font-mono font-bold text-lg",
                                        isDanger ? "text-red-400" : "text-emerald-400"
                                    )}>
                                        {weeklyAssignment.scoreRate}%
                                    </span>
                                    {isDanger && <AlertTriangle size={14} className="inline ml-1 text-red-400" />}
                                </div>

                                {/* Refund Badge */}
                                <div className="col-span-1 text-center">
                                    {pendingRefund ? (
                                        <button
                                            onClick={() => setRefundModal(student)}
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-babel-gold/20 border border-babel-gold/30 rounded text-babel-gold text-xs font-bold hover:bg-babel-gold/30 transition-colors animate-pulse"
                                        >
                                            <Coins size={12} />
                                            대기
                                        </button>
                                    ) : (
                                        <span className="text-stone-600 text-xs">-</span>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="col-span-2 text-right">
                                    <button
                                        onClick={() => setReportModal(student)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-white/10 rounded-lg text-xs text-stone-400 hover:text-white hover:border-babel-gold/30 hover:bg-babel-gold/10 transition-colors"
                                    >
                                        <FileBarChart size={14} />
                                        월간리포트
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-4 bg-black/30 border-t border-white/10 flex justify-between text-xs text-stone-500">
                    <span>총 {filteredStudents.length}명</span>
                    <span>위험군: {filteredStudents.filter(s => s.weeklyAssignment.scoreRate < 70).length}명</span>
                </div>
            </div>

            {/* Modals */}
            {refundModal && (
                <RefundModal
                    student={refundModal}
                    onComplete={() => setRefundModal(null)}
                    onCancel={() => setRefundModal(null)}
                />
            )}

            {reportModal && (
                <MonthlyReportModal
                    student={reportModal}
                    onClose={() => setReportModal(null)}
                />
            )}
        </div>
    );
};
