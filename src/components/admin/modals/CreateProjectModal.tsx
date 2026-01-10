import React, { useState } from 'react';
import { Globe, X, Check, Loader2, BookOpen, User, Calendar, GraduationCap } from 'lucide-react';

interface CreateProjectModalProps {
    onClose: () => void;
    onConfirm: (name: string, displayName: string, themeColor: string, metadata: any) => Promise<void>;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ onClose, onConfirm }) => {
    const [name, setName] = useState('');
    const [displayName, setDisplayName] = useState('');

    // Metadata State
    const [subject, setSubject] = useState('English');
    const [publisher, setPublisher] = useState('');
    const [grade, setGrade] = useState('High 1');
    const [examDate, setExamDate] = useState('');

    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !displayName) return;

        setLoading(true);
        const metadata = { subject, publisher, grade, examDate };
        await onConfirm(name, displayName, '#D4AF37', metadata);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-stone-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden scale-in-95 animate-in duration-200">
                {/* Header */}
                <div className="p-4 bg-black/40 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-lg font-serif text-babel-gold flex items-center gap-2">
                        <Globe size={18} />
                        새 프로젝트 생성 (New Project)
                    </h2>
                    <button onClick={onClose} className="text-stone-500 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">폴더명 (Folder Name)</label>
                            <input
                                autoFocus
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="예: 2024-09-MOCK-H1"
                                className="w-full bg-black border border-white/20 rounded-lg p-3 text-white focus:border-babel-gold focus:outline-none transition-colors font-mono text-sm"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">표시 이름 (Display Name)</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="예: 2024년 9월 고1 모의고사"
                                className="w-full bg-black border border-white/20 rounded-lg p-3 text-white focus:border-babel-gold focus:outline-none transition-colors"
                            />
                        </div>

                        {/* Metadata Fields */}
                        <div className="col-span-1">
                            <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2 flex items-center gap-1"><BookOpen size={10} /> 과목 (Subject)</label>
                            <select
                                value={subject} onChange={(e) => setSubject(e.target.value)}
                                className="w-full bg-black border border-white/20 rounded-lg p-3 text-white focus:border-babel-gold outline-none"
                            >
                                <option value="English">영어 (English)</option>
                                <option value="Korean">국어 (Korean)</option>
                            </select>
                        </div>
                        <div className="col-span-1">
                            <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2 flex items-center gap-1"><User size={10} /> 출판사 (Publisher)</label>
                            <input
                                type="text"
                                value={publisher}
                                onChange={(e) => setPublisher(e.target.value)}
                                placeholder="예: EBS / 교육청"
                                className="w-full bg-black border border-white/20 rounded-lg p-3 text-white focus:border-babel-gold outline-none"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2 flex items-center gap-1"><GraduationCap size={10} /> 학년 (Grade)</label>
                            <select
                                value={grade} onChange={(e) => setGrade(e.target.value)}
                                className="w-full bg-black border border-white/20 rounded-lg p-3 text-white focus:border-babel-gold outline-none"
                            >
                                <option value="High 1">고1</option>
                                <option value="High 2">고2</option>
                                <option value="High 3">고3</option>
                                <option value="Middle">중등</option>
                            </select>
                        </div>
                        <div className="col-span-1">
                            <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2 flex items-center gap-1"><Calendar size={10} /> 시행년월 (Date)</label>
                            <input
                                type="month"
                                value={examDate}
                                onChange={(e) => setExamDate(e.target.value)}
                                className="w-full bg-black border border-white/20 rounded-lg p-3 text-white focus:border-babel-gold outline-none"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-stone-400 hover:text-white text-sm"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={!name || !displayName || loading}
                            className="px-6 py-2 bg-babel-gold text-black font-bold rounded-lg hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            프로젝트 생성
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
