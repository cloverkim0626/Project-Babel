import React from 'react';
import {
    LayoutDashboard,
    FileText,
    FolderOpen,
    BookOpen,
    Users,
    TrendingUp,
    Calendar,
    CheckCircle,
    Clock,
    AlertTriangle
} from 'lucide-react';
import { clsx } from 'clsx';

// Mock data for stats
interface DashboardStats {
    totalPassages: number;
    totalProjects: number;
    totalVocabulary: number;
    activeStudents: number;
}

// Mock weekly assignment data
interface WeeklyAssignment {
    studentId: string;
    studentName: string;
    incompleteCount: number; // 미완과제 누적
    pastDueCount: number; // 지연된 과제 수
    assignments: {
        projectName: string;
        status: 'completed' | 'in_progress' | 'not_started' | 'overdue';
        progress: number; // 0-100
        dueDate: string;
    }[];
}

const MOCK_STATS: DashboardStats = {
    totalPassages: 47,
    totalProjects: 12,
    totalVocabulary: 856,
    activeStudents: 23
};

const MOCK_WEEKLY_DATA: WeeklyAssignment[] = [
    {
        studentId: 's1',
        studentName: '김민준',
        incompleteCount: 2,
        pastDueCount: 0,
        assignments: [
            { projectName: '9월 모의고사 A', status: 'completed', progress: 100, dueDate: '1/13' },
            { projectName: 'Voca Day 1-5', status: 'in_progress', progress: 60, dueDate: '1/15' },
        ]
    },
    {
        studentId: 's2',
        studentName: '이서연',
        incompleteCount: 5,
        pastDueCount: 1,
        assignments: [
            { projectName: '9월 모의고사 A', status: 'in_progress', progress: 40, dueDate: '1/13' },
            { projectName: 'Voca Day 1-5', status: 'not_started', progress: 0, dueDate: '1/15' },
        ]
    },
    {
        studentId: 's3',
        studentName: '박지훈',
        incompleteCount: 8,
        pastDueCount: 3,
        assignments: [
            { projectName: '9월 모의고사 A', status: 'overdue', progress: 20, dueDate: '1/13' },
            { projectName: 'Voca Day 1-5', status: 'not_started', progress: 0, dueDate: '1/15' },
        ]
    },
    {
        studentId: 's4',
        studentName: '최예은',
        incompleteCount: 0,
        pastDueCount: 0,
        assignments: [
            { projectName: '9월 모의고사 A', status: 'completed', progress: 100, dueDate: '1/13' },
            { projectName: 'Voca Day 1-5', status: 'completed', progress: 100, dueDate: '1/15' },
        ]
    },
];



// Status badge component
const StatusBadge: React.FC<{ status: WeeklyAssignment['assignments'][0]['status']; progress: number }> = ({ status, progress }) => {
    const configs = {
        completed: { bg: 'bg-emerald-900/30', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: CheckCircle, label: '완료' },
        in_progress: { bg: 'bg-blue-900/30', border: 'border-blue-500/30', text: 'text-blue-400', icon: Clock, label: `${progress}%` },
        not_started: { bg: 'bg-stone-800/30', border: 'border-stone-500/30', text: 'text-stone-500', icon: Clock, label: '미시작' },
        overdue: { bg: 'bg-red-900/30', border: 'border-red-500/30', text: 'text-red-400', icon: AlertTriangle, label: '지연' },
    };
    const config = configs[status];
    const Icon = config.icon;

    return (
        <div className={clsx('flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-bold', config.bg, config.border, config.text)}>
            <Icon size={12} />
            <span>{config.label}</span>
        </div>
    );
};

// Stat card component
const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number; trend?: string }> = ({ icon, label, value, trend }) => (
    <div className="bg-black/40 border border-white/10 rounded-xl p-5 hover:border-babel-gold/30 transition-colors group">
        <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-babel-gold/10 rounded-lg border border-babel-gold/20 group-hover:bg-babel-gold/20 transition-colors">
                {icon}
            </div>
            {trend && (
                <div className="flex items-center gap-1 text-emerald-400 text-[10px]">
                    <TrendingUp size={12} />
                    {trend}
                </div>
            )}
        </div>
        <div className="text-2xl font-bold text-white mb-1">{value.toLocaleString()}</div>
        <div className="text-[10px] text-stone-500 uppercase tracking-widest">{label}</div>
    </div>
);

export const AdminOverview: React.FC = () => {
    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-serif text-white flex items-center gap-3">
                        <LayoutDashboard size={24} className="text-babel-gold" />
                        Dashboard Overview
                    </h2>
                    <p className="text-xs text-stone-500 mt-1">이번 주 학습 현황 및 시스템 통계</p>
                </div>
                <div className="text-xs text-stone-400 bg-black/40 border border-white/10 px-3 py-2 rounded-lg flex items-center gap-2">
                    <Calendar size={14} />
                    2026년 1월 둘째주
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                <StatCard
                    icon={<FileText size={20} className="text-babel-gold" />}
                    label="Total Passages"
                    value={MOCK_STATS.totalPassages}
                    trend="+3 this week"
                />
                <StatCard
                    icon={<FolderOpen size={20} className="text-babel-gold" />}
                    label="Total Projects"
                    value={MOCK_STATS.totalProjects}
                />
                <StatCard
                    icon={<BookOpen size={20} className="text-babel-gold" />}
                    label="Generated Vocabulary"
                    value={MOCK_STATS.totalVocabulary}
                    trend="+124 new"
                />
                <StatCard
                    icon={<Users size={20} className="text-babel-gold" />}
                    label="Active Students"
                    value={MOCK_STATS.activeStudents}
                />
            </div>

            {/* Weekly Assignment Table */}
            <div className="bg-black/40 border border-white/10 rounded-xl overflow-hidden">
                <div className="p-5 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-lg font-serif text-white flex items-center gap-2">
                        <Calendar size={18} className="text-babel-gold" />
                        이번 주 과제 현황
                    </h3>
                    <span className="text-xs text-stone-500">{MOCK_WEEKLY_DATA.length}명의 학생</span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10 bg-black/20">
                                <th className="text-left p-4 text-[10px] text-stone-500 uppercase tracking-widest font-normal w-36">학생</th>
                                <th className="text-center p-4 text-[10px] text-stone-500 uppercase tracking-widest font-normal w-20">미완누적</th>
                                <th className="text-left p-4 text-[10px] text-stone-500 uppercase tracking-widest font-normal">이번주 과제</th>
                            </tr>
                        </thead>
                        <tbody>
                            {MOCK_WEEKLY_DATA.map(student => (
                                <tr key={student.studentId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-babel-gold/20 rounded-full flex items-center justify-center text-babel-gold text-xs font-bold">
                                                {student.studentName.slice(0, 1)}
                                            </div>
                                            <span className="text-sm text-white font-medium">{student.studentName}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        {student.incompleteCount > 0 ? (
                                            <div className={clsx(
                                                "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold",
                                                student.pastDueCount > 0
                                                    ? "bg-red-900/40 text-red-400 border border-red-500/30"
                                                    : "bg-amber-900/40 text-amber-400 border border-amber-500/30"
                                            )}>
                                                <AlertTriangle size={10} />
                                                {student.incompleteCount}
                                            </div>
                                        ) : (
                                            <span className="text-emerald-400 text-xs font-bold">✓</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-2">
                                            {student.assignments.map((assignment, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center gap-1.5 bg-black/30 rounded px-2 py-1 border border-white/10"
                                                >
                                                    <span className="text-[10px] text-stone-500">{assignment.projectName}:</span>
                                                    <StatusBadge status={assignment.status} progress={assignment.progress} />
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Summary Footer */}
                <div className="p-4 bg-black/30 border-t border-white/10 flex items-center justify-between text-xs text-stone-500">
                    <div className="flex items-center gap-6">
                        <span className="flex items-center gap-1.5"><CheckCircle size={12} className="text-emerald-400" /> 완료: 3</span>
                        <span className="flex items-center gap-1.5"><Clock size={12} className="text-blue-400" /> 진행중: 2</span>
                        <span className="flex items-center gap-1.5"><AlertTriangle size={12} className="text-red-400" /> 지연: 1</span>
                    </div>
                    <span>마지막 업데이트: 방금 전</span>
                </div>
            </div>
        </div>
    );
};
