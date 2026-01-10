import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Save, ArrowRight, X, BookOpen, GraduationCap, FileText, Sparkles, Loader2, Search, Plus, Trash2, Layers } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { extractWordsFromText } from '../../../services/ai/extractionService';
import type { RichWord } from '../../../services/ai/extractionService';

interface QueueItem {
    id: string;
    questionNum: string;
    text: string;
}

interface ExtendedRichWord extends RichWord {
    source_question_ref?: string;
}

export const ProjectWizard = ({ onCancel, onComplete }: { onCancel: () => void, onComplete: () => void }) => {
    const { user } = useAuth();
    const [step, setStep] = useState<1 | 2>(1);

    // --- Step 1: Metadata ---
    const [category, setCategory] = useState<'textbook' | 'mock' | 'custom'>('custom');

    // Textbook Meta
    const [subject, setSubject] = useState('공통영어1');
    const [publisher, setPublisher] = useState('');
    const [chapter, setChapter] = useState('');

    // Mock Meta
    const [mockYear, setMockYear] = useState('2025');
    const [mockMonth, setMockMonth] = useState('3');
    const [mockGrade, setMockGrade] = useState('1');

    // Common
    const [title, setTitle] = useState('');

    // --- Step 2: Content (Batch / AI) ---
    // Input State
    const [currentQNum, setCurrentQNum] = useState('');
    const [rawText, setRawText] = useState('');

    // Queue State
    const [queue, setQueue] = useState<QueueItem[]>([]);

    // Results State
    const [extractedWords, setExtractedWords] = useState<ExtendedRichWord[]>([]);
    const [isExtracting, setIsExtracting] = useState(false);

    // --- Helpers ---
    const autoTitle = () => {
        if (title) return;
        if (category === 'textbook' && publisher && chapter) {
            setTitle(`${publisher} ${subject} - Ch.${chapter}`);
        } else if (category === 'mock') {
            setTitle(`${mockYear}년 ${mockMonth}월 고${mockGrade} 학평 변형`);
        }
    };

    const addToQueue = () => {
        if (!rawText.trim()) return;

        // If Mock, require Question Number
        if (category === 'mock' && !currentQNum.trim()) {
            return alert("Please enter a Question Number (e.g. 39).");
        }

        const newItem: QueueItem = {
            id: crypto.randomUUID(),
            questionNum: category === 'mock' ? currentQNum : `Part ${queue.length + 1}`,
            text: rawText
        };

        setQueue(prev => [...prev, newItem]);
        setRawText('');
        setCurrentQNum(''); // Clear input for next
    };

    const removeFromQueue = (id: string) => {
        setQueue(prev => prev.filter(item => item.id !== id));
    };

    const handleBatchAnalysis = async () => {
        if (queue.length === 0) return;
        setIsExtracting(true);
        setExtractedWords([]); // Clear previous

        try {
            const allResults: ExtendedRichWord[] = [];

            // Process sequentially for prototype (parallelize in prod)
            for (const item of queue) {
                const words = await extractWordsFromText(item.text);
                // Tag words with Source Question
                const taggedWords = words.map(w => ({ ...w, source_question_ref: item.questionNum }));
                allResults.push(...taggedWords);
            }

            setExtractedWords(allResults);
        } catch (e) {
            alert("AI Extraction Failed");
        } finally {
            setIsExtracting(false);
        }
    };

    const updateWord = (index: number, field: keyof ExtendedRichWord, value: any) => {
        const newWords = [...extractedWords];
        // @ts-ignore
        newWords[index] = { ...newWords[index], [field]: value };
        setExtractedWords(newWords);
    };

    const removeWord = (index: number) => {
        setExtractedWords(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!user) return;

        try {
            // New Payload Structure: 
            // Mock: Group by sections based on 'source_question_ref'
            // Simple: Flat list

            let finalPayload;
            let totalWords = extractedWords.length;

            if (category === 'mock') {
                const sections: Record<string, RichWord[]> = {};
                extractedWords.forEach(w => {
                    const key = w.source_question_ref || 'Uncategorized';
                    if (!sections[key]) sections[key] = [];
                    sections[key].push(w);
                });
                finalPayload = { type: 'mock', sections };
            } else {
                finalPayload = { type: 'simple', words: extractedWords };
            }

            const metadata = category === 'textbook'
                ? { subject, publisher, chapter }
                : category === 'mock'
                    ? { year: mockYear, month: mockMonth, grade: mockGrade }
                    : {};

            const { error } = await supabase
                .from('missions')
                .insert({
                    title: title || 'Untitled Project',
                    category,
                    metadata,
                    data_payload: finalPayload,
                    created_by: user.id,
                    deadline: null,
                    total_sets: Math.ceil(totalWords / 20) || 1,
                });

            if (error) throw error;
            onComplete();
        } catch (err: any) {
            alert("Error: " + err.message);
        }
    };

    return (
        <div className="bg-stone-900 h-full flex flex-col animate-fade-in relative">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                <div>
                    <h2 className="text-xl font-serif text-white">Create Project</h2>
                    <p className="text-xs text-stone-500">Step {step} of 2</p>
                </div>
                <button onClick={onCancel} className="text-stone-500 hover:text-white"><X size={24} /></button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
                {step === 1 && (
                    <div className="max-w-3xl mx-auto space-y-8">
                        {/* Category Select */}
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { id: 'textbook', icon: BookOpen, label: '교과서 (Textbook)' },
                                { id: 'mock', icon: GraduationCap, label: '모의고사 (Mock)' },
                                { id: 'custom', icon: FileText, label: '자유 입력 (Custom)' }
                            ].map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setCategory(opt.id as any)}
                                    className={`p-6 rounded-xl border flex flex-col items-center gap-3 transition-all ${category === opt.id
                                        ? 'bg-babel-gold/10 border-babel-gold text-babel-gold'
                                        : 'bg-black/40 border-white/10 text-stone-500 hover:bg-white/5'
                                        }`}
                                >
                                    <opt.icon size={32} />
                                    <span className="font-bold text-sm">{opt.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Dynamic Fields */}
                        <div className="bg-black/30 p-6 rounded-xl border border-white/5 space-y-6">
                            {category === 'textbook' && (
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase text-stone-500">과목 (Subject)</label>
                                        <select
                                            value={subject} onChange={e => setSubject(e.target.value)}
                                            className="w-full bg-stone-900 border border-white/10 rounded p-3 text-white focus:border-babel-gold outline-none"
                                        >
                                            {['공통영어1', '공통영어2', '영어1', '영어2', '심화영어'].map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase text-stone-500">출판사 (Publisher)</label>
                                        <input
                                            value={publisher} onChange={e => setPublisher(e.target.value)} onBlur={autoTitle}
                                            className="w-full bg-stone-900 border border-white/10 rounded p-3 text-white"
                                            placeholder="예: NE능률(김)"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase text-stone-500">단원 (Chapter)</label>
                                        <input
                                            type="number" value={chapter} onChange={e => setChapter(e.target.value)} onBlur={autoTitle}
                                            className="w-full bg-stone-900 border border-white/10 rounded p-3 text-white"
                                            placeholder="숫자만 입력 (예: 1)"
                                        />
                                    </div>
                                </div>
                            )}

                            {category === 'mock' && (
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase text-stone-500">연도 (Year)</label>
                                        <select
                                            value={mockYear} onChange={e => setMockYear(e.target.value)}
                                            className="w-full bg-stone-900 border border-white/10 rounded p-3 text-white"
                                        >
                                            {[2025, 2024, 2023, 2022, 2021, 2020].map(y => <option key={y} value={y}>{y}년</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase text-stone-500">시행월 (Month)</label>
                                        <select
                                            value={mockMonth} onChange={e => { setMockMonth(e.target.value); autoTitle(); }}
                                            className="w-full bg-stone-900 border border-white/10 rounded p-3 text-white"
                                        >
                                            {['3', '6', '9', '10', '11(수능)'].map(m => <option key={m} value={m}>{m}월</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase text-stone-500">학년 (Grade)</label>
                                        <select
                                            value={mockGrade} onChange={e => { setMockGrade(e.target.value); autoTitle(); }}
                                            className="w-full bg-stone-900 border border-white/10 rounded p-3 text-white"
                                        >
                                            {['1', '2', '3'].map(g => <option key={g} value={g}>고{g}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2 pt-4 border-t border-white/10">
                                <label className="text-xs uppercase text-stone-500">프로젝트명 (Title)</label>
                                <input
                                    value={title} onChange={e => setTitle(e.target.value)}
                                    className="w-full bg-stone-900 border border-white/10 rounded p-3 text-white font-bold"
                                    placeholder="자동으로 생성되거나 직접 입력하세요"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={() => setStep(2)} disabled={!title}
                                className="bg-white text-black px-6 py-2 rounded font-bold disabled:opacity-50 flex items-center gap-2 hover:bg-stone-200"
                            >
                                Next Step <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="max-w-7xl mx-auto h-full flex flex-col gap-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Sparkles size={20} className="text-babel-gold" /> AI Batch Extraction
                            </h3>
                            <div className="flex items-center gap-4">
                                <span className="text-stone-500 text-sm">
                                    {queue.length} passages queued
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 flex gap-6 min-h-0">
                            {/* Left: Input & Queue */}
                            <div className="flex-1 flex flex-col gap-4">
                                {/* Input Area */}
                                <div className="bg-stone-800 rounded-xl border border-white/10 p-4 space-y-4 shadow-lg">
                                    {category === 'mock' && (
                                        <div className="flex items-center gap-3">
                                            <span className="text-babel-gold font-bold text-sm bg-black/40 px-3 py-1 rounded">Q.</span>
                                            <input
                                                value={currentQNum}
                                                onChange={e => setCurrentQNum(e.target.value)}
                                                placeholder="e.g. 39 or 41-42"
                                                className="bg-black/50 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-babel-gold w-full text-sm font-mono"
                                            />
                                        </div>
                                    )}
                                    <textarea
                                        value={rawText}
                                        onChange={e => setRawText(e.target.value)}
                                        className="w-full h-32 bg-black/50 border border-white/10 rounded p-3 font-serif text-stone-300 resize-none focus:border-babel-gold outline-none text-sm leading-relaxed"
                                        placeholder="Paste passage text..."
                                    />
                                    <button
                                        onClick={addToQueue}
                                        disabled={!rawText}
                                        className="w-full bg-stone-700 hover:bg-stone-600 text-white py-2 rounded font-bold flex justify-center items-center gap-2 text-sm transition-all"
                                    >
                                        <Plus size={16} /> Add to Queue
                                    </button>
                                </div>

                                {/* Queue List */}
                                <div className="flex-1 bg-stone-900 border border-white/10 rounded-xl overflow-hidden flex flex-col">
                                    <div className="bg-black/40 p-3 border-b border-white/10 flex justify-between items-center">
                                        <span className="text-xs font-bold text-stone-500">SCANNING QUEUE</span>
                                        <span className="text-xs text-stone-600">{queue.length} items</span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                        {queue.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-stone-700 gap-2">
                                                <Layers size={24} />
                                                <p className="text-xs">Queue is empty</p>
                                            </div>
                                        ) : (
                                            queue.map((item) => (
                                                <div key={item.id} className="bg-black/20 p-3 rounded border border-white/5 flex gap-3 group">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-babel-gold text-xs font-bold px-2 py-0.5 bg-yellow-900/20 rounded">
                                                                {item.questionNum}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-stone-500 line-clamp-2 font-serif">
                                                            {item.text}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => removeFromQueue(item.id)}
                                                        className="text-stone-600 hover:text-red-400 self-start p-1"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className="p-3 bg-black/20 border-t border-white/5">
                                        <button
                                            onClick={handleBatchAnalysis}
                                            disabled={queue.length === 0 || isExtracting}
                                            className="w-full bg-babel-gold hover:bg-yellow-500 text-black py-3 rounded font-bold flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.2)] disabled:opacity-50 disabled:shadow-none"
                                        >
                                            {isExtracting ? (
                                                <Loader2 size={18} className="animate-spin" />
                                            ) : (
                                                <Sparkles size={18} />
                                            )}
                                            {isExtracting ? 'Analyzing All...' : 'Analyze All'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Aggregated Results */}
                            <div className="flex-1 bg-stone-900 border border-white/10 rounded-xl overflow-hidden flex flex-col shadow-2xl">
                                <div className="bg-black/40 p-4 border-b border-white/10 flex justify-between items-center">
                                    <span className="font-bold text-babel-gold text-sm flex items-center gap-2">
                                        <ArrowRight size={14} /> ANALYSIS RESULTS
                                    </span>
                                    <span className="text-xs text-stone-500">{extractedWords.length} Words Found</span>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {extractedWords.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-stone-600 gap-4">
                                            <div className="w-16 h-16 rounded-full bg-stone-800 flex items-center justify-center">
                                                <Search size={24} />
                                            </div>
                                            <p className="text-sm">Results will appear here</p>
                                        </div>
                                    ) : (
                                        extractedWords.map((item, idx) => (
                                            <div key={idx} className="group bg-black/20 p-3 rounded border border-white/5 hover:border-babel-gold/30 transition-all flex gap-3 items-start">
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center gap-2 justify-between">
                                                        <input
                                                            value={item.word}
                                                            onChange={e => updateWord(idx, 'word', e.target.value)}
                                                            className="bg-transparent font-bold text-white outline-none w-full"
                                                        />
                                                        {item.source_question_ref && (
                                                            <span className="text-[10px] text-stone-500 bg-stone-800 px-2 py-0.5 rounded">
                                                                {item.source_question_ref}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <span className="text-[10px] text-stone-500 bg-white/5 px-1 rounded">{item.phonetic}</span>
                                                        <input
                                                            value={item.meanings_kr?.[0] || ''}
                                                            onChange={e => {
                                                                const newMeanings = [...(item.meanings_kr || [])];
                                                                newMeanings[0] = e.target.value;
                                                                updateWord(idx, 'meanings_kr', newMeanings);
                                                            }}
                                                            className="bg-transparent text-sm text-babel-gold outline-none w-full placeholder-stone-600"
                                                            placeholder="Meaning..."
                                                        />
                                                    </div>
                                                    {item.example_variations?.[0] && (
                                                        <p className="text-[10px] text-stone-500 italic truncate">"{item.example_variations[0]}"</p>
                                                    )}
                                                    <div className="flex gap-1 text-[10px] text-stone-600">
                                                        <span>Syn: {item.synonyms?.slice(0, 2).join(', ')}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeWord(idx)}
                                                    className="opacity-0 group-hover:opacity-100 p-2 text-stone-600 hover:text-red-400 transition-all"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="p-4 bg-black/40 border-t border-white/10">
                                    <button
                                        onClick={handleSubmit}
                                        disabled={extractedWords.length === 0}
                                        className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white py-3 rounded-lg font-bold flex justify-center gap-2 shadow-lg"
                                    >
                                        <Save size={18} /> Save Complete Project
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
