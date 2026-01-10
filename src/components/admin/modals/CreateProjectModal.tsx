import React, { useState } from 'react';
import { X, Check, Loader2, Layers } from 'lucide-react';

interface CreateProjectModalProps {
    onClose: () => void;
    onConfirm: (name: string, displayName: string, themeColor: string, metadata: any) => Promise<void>;
}

type Category = 'TEXTBOOK' | 'MOCK' | 'OTHER';

const TEXTBOOK_SUBJECTS = ['공통영어1', '공통영어2', '영어1', '영어2', '심화영어'];
const MOCK_YEARS = Array.from({ length: 7 }, (_, i) => String(2020 + i)); // 2020-2026
const MOCK_MONTHS = ['3월', '6월', '9월', '10월', '대수능'];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ onClose, onConfirm }) => {
    // Basic Info
    const [folderName, setFolderName] = useState('');
    const [category, setCategory] = useState<Category>('TEXTBOOK');

    // Textbook State
    const [tbSubject, setTbSubject] = useState(TEXTBOOK_SUBJECTS[0]);
    const [tbUnit, setTbUnit] = useState('');

    // Mock State
    const [mockYear, setMockYear] = useState('2024');
    const [mockGrade, setMockGrade] = useState('High 1');
    const [mockMonth, setMockMonth] = useState('3월');

    // Other State
    const [otherWorkbook, setOtherWorkbook] = useState('');
    const [otherPublisher, setOtherPublisher] = useState('');
    const [otherUnit, setOtherUnit] = useState('');

    const [loading, setLoading] = useState(false);

    // Auto-generate Display Name based on selection (Invisible to user but used for DB)
    const generateDisplayName = () => {
        if (category === 'TEXTBOOK') return `${tbSubject} - ${tbUnit}`;
        if (category === 'MOCK') return `${mockYear}년 ${mockMonth} 고${mockGrade === 'High 1' ? 1 : mockGrade === 'High 2' ? 2 : 3} 모의고사`;
        if (category === 'OTHER') return `${otherWorkbook} (${otherPublisher})`;
        return folderName;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!folderName) return;

        setLoading(true);
        const metadata = {
            category,
            // Save all fields, even if not active, for simplicity or filter only active
            textbook: category === 'TEXTBOOK' ? { subject: tbSubject, unit: tbUnit } : null,
            mock: category === 'MOCK' ? { year: mockYear, month: mockMonth, grade: mockGrade } : null,
            other: category === 'OTHER' ? { workbook: otherWorkbook, publisher: otherPublisher, unit: otherUnit } : null
        };

        const autoDisplayName = generateDisplayName();

        await onConfirm(folderName, autoDisplayName, '#D4AF37', metadata);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-stone-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden scale-in-95 animate-in duration-200">
                {/* Header */}
                <div className="p-4 bg-black/40 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-lg font-serif text-babel-gold flex items-center gap-2">
                        <Layers size={18} />
                        새 프로젝트 생성 (New Project)
                    </h2>
                    <button onClick={onClose} className="text-stone-500 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* 1. Folder Name */}
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">폴더명 (Folder Name)</label>
                        <input
                            autoFocus
                            type="text"
                            value={folderName}
                            onChange={(e) => setFolderName(e.target.value)}
                            placeholder="예: 2024-03-H1"
                            className="w-full bg-black border border-white/20 rounded-lg p-3 text-white focus:border-babel-gold focus:outline-none font-mono text-sm"
                        />
                    </div>

                    {/* 2. Category Selection */}
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-stone-500 mb-3">분류 선택 (Category)</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['TEXTBOOK', 'MOCK', 'OTHER'] as Category[]).map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setCategory(cat)}
                                    className={`py-3 rounded-lg border text-sm font-bold transition-all ${category === cat
                                        ? 'bg-babel-gold text-black border-babel-gold'
                                        : 'bg-stone-800 text-stone-400 border-white/5 hover:bg-stone-700'
                                        }`}
                                >
                                    {cat === 'TEXTBOOK' && '교과서'}
                                    {cat === 'MOCK' && '모의고사'}
                                    {cat === 'OTHER' && '기타'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 3. Conditional Inputs */}
                    <div className="bg-black/20 p-4 rounded-lg border border-white/5 space-y-4 animate-in fade-in slide-in-from-top-2">

                        {/* A. TEXTBOOK */}
                        {category === 'TEXTBOOK' && (
                            <>
                                <div>
                                    <label className="block text-[10px] uppercase text-stone-500 mb-1">과목 선택</label>
                                    <select
                                        value={tbSubject}
                                        onChange={(e) => setTbSubject(e.target.value)}
                                        className="w-full bg-stone-900 border border-white/10 rounded p-2 text-white outline-none focus:border-babel-gold"
                                    >
                                        {TEXTBOOK_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase text-stone-500 mb-1">단원 (Unit)</label>
                                    <input
                                        type="text"
                                        placeholder="예: Lesson 1"
                                        value={tbUnit}
                                        onChange={(e) => setTbUnit(e.target.value)}
                                        className="w-full bg-stone-900 border border-white/10 rounded p-2 text-white outline-none focus:border-babel-gold"
                                    />
                                </div>
                            </>
                        )}

                        {/* B. MOCK EXAM */}
                        {category === 'MOCK' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] uppercase text-stone-500 mb-1">연도 (Year)</label>
                                    <select
                                        value={mockYear} onChange={(e) => setMockYear(e.target.value)}
                                        className="w-full bg-stone-900 border border-white/10 rounded p-2 text-white outline-none focus:border-babel-gold"
                                    >
                                        {MOCK_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase text-stone-500 mb-1">학년 (Grade)</label>
                                    <select
                                        value={mockGrade} onChange={(e) => setMockGrade(e.target.value)}
                                        className="w-full bg-stone-900 border border-white/10 rounded p-2 text-white outline-none focus:border-babel-gold"
                                    >
                                        <option value="High 1">고1</option>
                                        <option value="High 2">고2</option>
                                        <option value="High 3">고3</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] uppercase text-stone-500 mb-1">시행월 (Month)</label>
                                    <div className="flex gap-2">
                                        {MOCK_MONTHS.map(m => (
                                            <button
                                                key={m} type="button"
                                                onClick={() => setMockMonth(m)}
                                                className={`flex-1 py-2 text-xs rounded border transition-colors ${mockMonth === m
                                                    ? 'bg-stone-700 text-white border-babel-gold'
                                                    : 'bg-stone-800 text-stone-500 border-transparent hover:bg-stone-700'
                                                    }`}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* C. OTHER */}
                        {category === 'OTHER' && (
                            <>
                                <div>
                                    <label className="block text-[10px] uppercase text-stone-500 mb-1">문제집 종류</label>
                                    <input
                                        type="text"
                                        placeholder="예: 수능특강"
                                        value={otherWorkbook}
                                        onChange={(e) => setOtherWorkbook(e.target.value)}
                                        className="w-full bg-stone-900 border border-white/10 rounded p-2 text-white outline-none focus:border-babel-gold"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] uppercase text-stone-500 mb-1">출판사</label>
                                        <input
                                            type="text"
                                            placeholder="예: EBS"
                                            value={otherPublisher}
                                            onChange={(e) => setOtherPublisher(e.target.value)}
                                            className="w-full bg-stone-900 border border-white/10 rounded p-2 text-white outline-none focus:border-babel-gold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase text-stone-500 mb-1">단원 (숫자만)</label>
                                        <input
                                            type="number"
                                            placeholder="1"
                                            value={otherUnit}
                                            onChange={(e) => setOtherUnit(e.target.value)}
                                            className="w-full bg-stone-900 border border-white/10 rounded p-2 text-white outline-none focus:border-babel-gold"
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer Actions */}
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
                            disabled={!folderName || loading}
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
