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
        <div className="fixed inset-0 z-50 bg-[#020617] flex flex-col font-sans animate-fade-in text-slate-200">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-black opacity-80" />
            <div className="caustic-overlay opacity-30 pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />

            {/* Header */}
            <header className="relative z-10 h-20 flex items-center justify-between px-8 border-b border-white/5 bg-slate-950/50 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded border border-cyan-500/30 flex items-center justify-center bg-cyan-950/20 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                        <Layers size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-cinematic tracking-widest text-shadow">
                            MISSION ARCHITECT
                        </h2>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-500/60 uppercase tracking-[0.2em]">
                            <span>Protocol: {step === 1 ? 'Initialization' : 'Extraction'}</span>
                            <span className="w-1 h-1 rounded-full bg-cyan-500 animate-pulse" />
                            <span>Step {step}/2</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={onCancel}
                    className="p-2 text-slate-500 hover:text-red-400 transition-colors rounded-full hover:bg-white/5 border border-transparent hover:border-red-900/30"
                >
                    <X size={24} />
                </button>
            </header>

            {/* Content Container */}
            <div className="relative z-10 flex-1 overflow-hidden flex">

                {/* Step 1: Initialization */}
                {step === 1 && (
                    <div className="max-w-5xl mx-auto w-full p-8 md:p-12 overflow-y-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                            {/* Left: Input Panel */}
                            <div className="lg:col-span-8 space-y-8">

                                {/* Section Title */}
                                <div>
                                    <h3 className="text-2xl text-white font-light mb-6 flex items-center gap-3">
                                        <span className="text-cyan-500 font-bold">01.</span>
                                        TARGET SOURCE
                                    </h3>

                                    {/* Category Grid */}
                                    <div className="grid grid-cols-3 gap-4 mb-8">
                                        {[
                                            { id: 'textbook', icon: BookOpen, label: 'TEXTBOOK', sub: '교과서' },
                                            { id: 'mock', icon: GraduationCap, label: 'MOCK TEST', sub: '모의고사' },
                                            { id: 'custom', icon: FileText, label: 'CUSTOM', sub: '기타자료' }
                                        ].map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setCategory(opt.id as any)}
                                                className={`group relative h-32 rounded-xl border transition-all duration-300 overflow-hidden ${category === opt.id
                                                        ? 'bg-cyan-950/30 border-cyan-500 shadow-[0_0_30px_rgba(34,211,238,0.1)]'
                                                        : 'bg-slate-900/40 border-white/5 hover:border-white/20 hover:bg-slate-800/40'
                                                    }`}
                                            >
                                                <div className={`absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent transition-opacity ${category === opt.id ? 'opacity-100' : 'opacity-0'}`} />
                                                <div className="relative z-10 h-full flex flex-col items-center justify-center gap-3">
                                                    <opt.icon size={28} className={category === opt.id ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'text-slate-500 group-hover:text-slate-300'} />
                                                    <div className="text-center">
                                                        <div className={`text-xs font-bold tracking-widest ${category === opt.id ? 'text-white' : 'text-slate-400'}`}>{opt.label}</div>
                                                        <div className="text-[10px] text-slate-600 mt-1 font-mono">{opt.sub}</div>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Dynamic Fields Area */}
                                    <div className="abyss-glass p-8 space-y-6 relative border-t border-cyan-500/30">
                                        <div className="absolute -top-3 left-4 px-2 bg-[#050b14] text-[10px] text-cyan-500 font-bold tracking-[0.2em] border border-cyan-500/30 rounded">
                                            METADATA CONFIG
                                        </div>

                                        {category === 'textbook' && (
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] uppercase text-slate-500 tracking-wider pl-1">Subject</label>
                                                    <select
                                                        value={subject} onChange={e => setSubject(e.target.value)}
                                                        className="abyss-input w-full"
                                                    >
                                                        {['공통영어1', '공통영어2', '영어1', '영어2', '심화영어'].map(s => (
                                                            <option key={s} value={s}>{s}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] uppercase text-slate-500 tracking-wider pl-1">Publisher</label>
                                                    <input
                                                        value={publisher} onChange={e => setPublisher(e.target.value)} onBlur={autoTitle}
                                                        className="abyss-input w-full"
                                                        placeholder="e.g NE능률(김)"
                                                    />
                                                </div>
                                                <div className="space-y-2 col-span-2">
                                                    <label className="text-[10px] uppercase text-slate-500 tracking-wider pl-1">Chapter / Unit</label>
                                                    <input
                                                        type="number" value={chapter} onChange={e => setChapter(e.target.value)} onBlur={autoTitle}
                                                        className="abyss-input w-full"
                                                        placeholder="Numeric Value Only"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {category === 'mock' && (
                                            <div className="grid grid-cols-3 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] uppercase text-slate-500 tracking-wider pl-1">Year</label>
                                                    <select value={mockYear} onChange={e => setMockYear(e.target.value)} className="abyss-input w-full">
                                                        {[2025, 2024, 2023, 2022, 2021, 2020].map(y => <option key={y} value={y}>{y}</option>)}
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] uppercase text-slate-500 tracking-wider pl-1">Month</label>
                                                    <select value={mockMonth} onChange={e => { setMockMonth(e.target.value); autoTitle(); }} className="abyss-input w-full">
                                                        {['3', '6', '9', '10', '11(수능)'].map(m => <option key={m} value={m}>{m}월</option>)}
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] uppercase text-slate-500 tracking-wider pl-1">Grade</label>
                                                    <select value={mockGrade} onChange={e => { setMockGrade(e.target.value); autoTitle(); }} className="abyss-input w-full">
                                                        {['1', '2', '3'].map(g => <option key={g} value={g}>고{g}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        )}

                                        <div className="pt-2">
                                            <label className="text-[10px] uppercase text-slate-500 tracking-wider pl-1 mb-2 block">Operation Name (Title)</label>
                                            <input
                                                value={title} onChange={e => setTitle(e.target.value)}
                                                className="abyss-input w-full text-lg font-bold text-cyan-100"
                                                placeholder="Mission Identifier..."
                                            />
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Right: Preview / Action */}
                            <div className="lg:col-span-4 flex flex-col justify-between border-l border-white/5 pl-12 py-4">
                                <div>
                                    <h4 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-6">Preview Visualization</h4>

                                    {/* Mock Card Preview */}
                                    <div className="aspect-[3/4] bg-slate-900/50 rounded-2xl border border-white/10 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950" />
                                        <div className="absolute top-0 right-0 p-4 opacity-50">
                                            {category === 'textbook' ? <BookOpen size={60} strokeWidth={1} /> : <GraduationCap size={60} strokeWidth={1} />}
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 p-6">
                                            <div className="text-[10px] px-2 py-1 border border-cyan-500/30 text-cyan-400 rounded w-fit mb-2 uppercase tracking-wider">{category}</div>
                                            <div className="text-xl font-bold font-serif text-white mb-1 line-clamp-2 leading-tight">
                                                {title || 'Untitled Operation'}
                                            </div>
                                            <div className="w-8 h-1 bg-cyan-500 rounded-full mt-2" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="text-xs text-slate-500 font-mono">
                                        System Ready.<br />Waiting for authorization...
                                    </div>
                                    <button
                                        onClick={() => setStep(2)} disabled={!title}
                                        className="w-full abyss-btn py-4 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="font-bold tracking-widest text-sm">INITIALIZE</span>
                                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Extraction */}
                {step === 2 && (
                    <div className="w-full h-full flex flex-col">
                        {/* Toolbar */}
                        <div className="h-14 border-b border-white/5 bg-slate-900/30 flex items-center px-6 gap-6">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Search size={16} className="text-cyan-500" />
                                RAW DATA INGESTION
                            </h3>
                            <div className="h-4 w-px bg-white/10" />
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <span className={queue.length > 0 ? "text-cyan-400" : ""}>{queue.length}</span> Fragments Queued
                            </div>
                        </div>

                        <div className="flex-1 flex overflow-hidden">
                            {/* Input Column */}
                            <div className="w-[400px] flex flex-col border-r border-white/5 bg-slate-950/30">
                                <div className="p-4 space-y-4">
                                    {category === 'mock' && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ref ID</span>
                                            <input
                                                value={currentQNum}
                                                onChange={e => setCurrentQNum(e.target.value)}
                                                placeholder="Q.Num"
                                                className="abyss-input py-1 px-3 w-24 text-center font-mono text-cyan-400"
                                            />
                                        </div>
                                    )}
                                    <textarea
                                        value={rawText}
                                        onChange={e => setRawText(e.target.value)}
                                        className="w-full h-48 abyss-input resize-none p-4 font-serif text-sm leading-relaxed"
                                        placeholder="Input raw text data sequence here..."
                                    />
                                    <button
                                        onClick={addToQueue}
                                        disabled={!rawText}
                                        className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-widest rounded transition-colors border border-slate-700 flex items-center justify-center gap-2"
                                    >
                                        <Plus size={14} /> Enqueue Fragment
                                    </button>
                                </div>

                                {/* Queue List */}
                                <div className="flex-1 overflow-y-auto border-t border-white/5">
                                    {queue.map((item) => (
                                        <div key={item.id} className="p-3 border-b border-white/5 hover:bg-white/5 group relative flex gap-3">
                                            <div className="text-[10px] font-mono text-slate-500 pt-1 w-8">{item.questionNum}</div>
                                            <div className="text-xs text-slate-300 line-clamp-2 flex-1 font-serif opacity-80">{item.text}</div>
                                            <button
                                                onClick={() => removeFromQueue(item.id)}
                                                className="absolute right-2 top-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    {queue.length === 0 && (
                                        <div className="p-8 text-center text-slate-600 text-xs uppercase tracking-widest">
                                            Queue Empty
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 border-t border-white/5">
                                    <button
                                        onClick={handleBatchAnalysis}
                                        disabled={queue.length === 0 || isExtracting}
                                        className="w-full abyss-btn py-3 text-xs font-bold flex items-center justify-center gap-2"
                                    >
                                        {isExtracting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                        {isExtracting ? 'PROCESSING...' : 'INITIATE ANALYSIS'}
                                    </button>
                                </div>
                            </div>

                            {/* Results Column */}
                            <div className="flex-1 flex flex-col bg-black/20">
                                <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 xl:grid-cols-2 gap-4 content-start">
                                    {extractedWords.length === 0 ? (
                                        <div className="col-span-full h-96 flex flex-col items-center justify-center text-slate-600 gap-4">
                                            <div className="w-20 h-20 rounded-full border border-slate-800 flex items-center justify-center animate-pulse">
                                                <Search size={32} className="opacity-50" />
                                            </div>
                                            <div className="text-xs uppercase tracking-[0.2em]">Awaiting Analysis Output</div>
                                        </div>
                                    ) : (
                                        extractedWords.map((item, idx) => (
                                            <div key={idx} className="abyss-glass p-4 group hover:border-cyan-500/30 transition-all">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-6 h-6 rounded bg-cyan-950/50 flex items-center justify-center text-xs font-bold text-cyan-500 font-mono">
                                                            {idx + 1}
                                                        </div>
                                                        <input
                                                            value={item.word}
                                                            onChange={e => updateWord(idx, 'word', e.target.value)}
                                                            className="bg-transparent text-lg font-bold text-white outline-none w-40"
                                                        />
                                                    </div>
                                                    <button onClick={() => removeWord(idx)} className="text-slate-600 hover:text-red-400"><X size={14} /></button>
                                                </div>

                                                <div className="pl-9 space-y-2">
                                                    <div className="flex gap-2 text-[10px] text-slate-500 font-mono">
                                                        <span className="bg-white/5 px-1.5 py-0.5 rounded text-slate-400">{item.phonetic || 'N/A'}</span>
                                                        <span className="bg-white/5 px-1.5 py-0.5 rounded text-cyan-700/70">{item.part_of_speech || 'noun'}</span>
                                                        {item.source_question_ref && <span className="text-amber-700/50">Ref: {item.source_question_ref}</span>}
                                                    </div>
                                                    <input
                                                        value={item.meanings_kr?.[0] || ''}
                                                        onChange={e => {
                                                            const newMeanings = [...(item.meanings_kr || [])];
                                                            newMeanings[0] = e.target.value;
                                                            updateWord(idx, 'meanings_kr', newMeanings);
                                                        }}
                                                        className="w-full bg-transparent text-sm text-cyan-100/90 outline-none placeholder-slate-700"
                                                        placeholder="Meaning definition..."
                                                    />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="p-4 border-t border-white/5 bg-slate-950/80 backdrop-blur flex justify-end">
                                    <button
                                        onClick={handleSubmit}
                                        disabled={extractedWords.length === 0}
                                        className="px-8 py-3 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/50 rounded text-sm font-bold tracking-widest uppercase transition-all flex items-center gap-2 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                                    >
                                        <Save size={16} /> Save To Database ({extractedWords.length})
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
