import React, { useState } from 'react';
import { Users, AlertTriangle, Clock } from 'lucide-react';
import { clsx } from 'clsx';

interface StudentStat {
    id: string;
    name: string;
    level: number;
    avgScore: number;
    errorCount: number; // For Alarm
    lastActive: string;
}

// Mock Data
const MOCK_STUDENTS: StudentStat[] = Array.from({ length: 42 }, (_, i) => ({
    id: `student-${i}`,
    name: `Student ${i + 1}`,
    level: Math.floor(Math.random() * 5) + 1,
    avgScore: Math.floor(Math.random() * 40) + 60,
    errorCount: i === 3 ? 24 : Math.floor(Math.random() * 15), // Student 3 triggers alarm
    lastActive: '2h ago'
}));

export const StudentMonitor: React.FC = () => {
    const [filter, setFilter] = useState<'all' | 'danger' | 'review_needed'>('all');

    // Filtering Logic
    const filteredStudents = MOCK_STUDENTS.filter(s => {
        if (filter === 'danger') return s.avgScore < 70;
        if (filter === 'review_needed') return s.errorCount >= 20;
        return true;
    });

    const handleCreateReviewSet = (studentId: string, count: number) => {
        if (confirm(`Create Review Set for ${studentId} with ${count} errors?\nThis will create a new 'Review Mission' assigned only to this student.`)) {
            alert("Review Mission Created (Mock DB Insert)");
            // TODO: API Logic: Select top 20 errors -> Insert into QuestSets
        }
    };

    return (
        <div className="bg-black/40 border border-white/10 rounded-xl p-6">
            <header className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-serif text-white flex items-center gap-2">
                    <Users size={20} className="text-babel-gold" />
                    Student Assignments & Monitor
                </h2>

                {/* Filter Tabs */}
                <div className="flex gap-2 text-xs">
                    <button
                        onClick={() => setFilter('all')}
                        className={clsx("px-3 py-1 rounded border transition-colors", filter === 'all' ? "bg-white/10 border-white/30 text-white" : "border-transparent text-stone-500 hover:text-stone-300")}
                    >
                        All Students
                    </button>
                    <button
                        onClick={() => setFilter('danger')}
                        className={clsx("px-3 py-1 rounded border transition-colors flex items-center gap-1", filter === 'danger' ? "bg-red-900/20 border-red-500/30 text-red-400" : "border-transparent text-stone-500 hover:text-red-400")}
                    >
                        <AlertTriangle size={12} /> Danger Zone
                    </button>
                    <button
                        onClick={() => setFilter('review_needed')}
                        className={clsx("px-3 py-1 rounded border transition-colors flex items-center gap-1", filter === 'review_needed' ? "bg-yellow-900/20 border-yellow-500/30 text-yellow-500" : "border-transparent text-stone-500 hover:text-yellow-500")}
                    >
                        <Clock size={12} /> Review Needed
                    </button>
                </div>
            </header>

            {/* Table Header */}
            <div className="grid grid-cols-5 text-[10px] text-stone-500 uppercase tracking-widest px-4 pb-2 border-b border-white/10">
                <div className="col-span-2">Student Identity</div>
                <div className="text-center">Avg. Score</div>
                <div className="text-center">Vault Errors</div>
                <div className="text-right">Action</div>
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto custom-scrollbar space-y-1 mt-2">
                {filteredStudents.map(student => {
                    const isReviewNeeded = student.errorCount >= 20;
                    return (
                        <div key={student.id} className={clsx(
                            "grid grid-cols-5 items-center p-3 rounded border transition-all hover:bg-white/5",
                            isReviewNeeded ? "border-yellow-500/30 bg-yellow-900/10" : "border-white/5 bg-transparent"
                        )}>
                            <div className="col-span-2">
                                <div className="text-sm font-bold text-white flex items-center gap-2">
                                    {student.name}
                                    <span className="text-[10px] font-normal text-stone-500 bg-black px-1.5 py-0.5 rounded border border-white/10">Lv.{student.level}</span>
                                </div>
                                <div className="text-[10px] text-stone-600 font-mono">ID: {student.id} • Last: {student.lastActive}</div>
                            </div>

                            <div className="text-center font-mono text-sm">
                                <span className={student.avgScore < 70 ? "text-red-400" : "text-green-400"}>{student.avgScore}%</span>
                            </div>

                            <div className="text-center">
                                <span className={clsx("text-xs font-bold px-2 py-1 rounded", isReviewNeeded ? "bg-yellow-500 text-black animate-pulse" : "text-stone-400")}>
                                    {student.errorCount} / 20
                                </span>
                            </div>

                            <div className="text-right flex justify-end">
                                {isReviewNeeded ? (
                                    <button
                                        onClick={() => handleCreateReviewSet(student.id, student.errorCount)}
                                        className="text-[10px] bg-babel-gold text-black font-bold px-2 py-1 rounded hover:scale-105 transition-transform flex items-center gap-1 shadow-[0_0_10px_rgba(212,175,55,0.3)]"
                                    >
                                        <Clock size={10} /> Create Review
                                    </button>
                                ) : (
                                    <button className="text-[10px] text-stone-600 hover:text-white border border-white/10 px-2 py-1 rounded">
                                        View Details
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 p-3 border border-white/5 bg-black/20 rounded flex items-center justify-between text-xs text-stone-500">
                <span>Total Students: {MOCK_STUDENTS.length}</span>
                <span>Danger Zone: {MOCK_STUDENTS.filter(s => s.avgScore < 70).length}</span>
            </div>
        </div>
    );
};
