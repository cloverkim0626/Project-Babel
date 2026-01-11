import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Save, ArrowRight, X, BookOpen, GraduationCap, FileText, Sparkles, Loader2, Plus, Trash2, Layers, Check, Sidebar, CheckSquare, Edit2, Brain, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { extractWordsFromText } from '../../../services/ai/extractionService';
import type { RichWord } from '../../../services/ai/extractionService';

interface InputCard {
    id: string;
    ref: string; // e.g. "30" or "Part 1"
    content: string;
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

    // --- Step 2: Content (Dashboard Layout) ---
    // Input State
    const [inputs, setInputs] = useState<InputCard[]>([
        { id: 'card-1', ref: '1', content: '' }
    ]);
    const [activeInputId, setActiveInputId] = useState<string>('card-1');

    // Analysis State
    // keys are inputCard IDs. Values are the analyzed words for that card.
    const [analyzedData, setAnalyzedData] = useState<Record<string, RichWord[]>>({});
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // --- Helpers ---
    const autoTitle = () => {
        if (title) return;
        if (category === 'textbook' && publisher && chapter) {
            setTitle(`${publisher} ${subject} - Ch.${chapter}`);
        } else if (category === 'mock') {
            setTitle(`${mockYear}년 ${mockMonth}월 고${mockGrade} 학평 변형`);
        }
    };

    // --- Input Management ---
    const addInputCard = () => {
        const newId = `card-${Date.now()}`;
        // Auto-increment ref if possible
        const lastRef = inputs[inputs.length - 1]?.ref;
        const nextRef = lastRef && !isNaN(Number(lastRef)) ? String(Number(lastRef) + 1) : `${inputs.length + 1}`;

        setInputs(prev => [...prev, { id: newId, ref: nextRef, content: '' }]);
        setActiveInputId(newId);
    };

    const removeInputCard = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (inputs.length === 1) return;
        setInputs(prev => prev.filter(c => c.id !== id));
        // Cleanup data
        const newData = { ...analyzedData };
        delete newData[id];
        setAnalyzedData(newData);

        if (activeInputId === id) {
            setActiveInputId(inputs[0].id);
        }
    };

    const updateInput = (id: string, field: 'ref' | 'content', value: string) => {
        setInputs(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    // --- Analysis ---
    const handleAnalyzeAll = async () => {
        // Filter empty inputs
        const validInputs = inputs.filter(i => i.content.trim().length > 0);
        if (validInputs.length === 0) return alert("분석할 지문 내용이 없습니다.");

        setIsAnalyzing(true);
        try {
            const updates: Record<string, RichWord[]> = {};

            // Process in parallel or squential? Sequential for safety / rate limits if any
            for (const input of validInputs) {
                // Skip if already analyzed and content hasn't changed? 
                // Creating a hash check is complex, let's just re-analyze for explicit user action
                const words = await extractWordsFromText(input.content);
                updates[input.id] = words;
            }

            setAnalyzedData(prev => ({ ...prev, ...updates }));
        } catch (e) {
            console.error(e);
            alert("AI 분석 중 오류가 발생했습니다.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const updateWord = (inputId: string, wordIdx: number, field: keyof RichWord, value: any) => {
        const words = [...(analyzedData[inputId] || [])];
        if (!words[wordIdx]) return;

        words[wordIdx] = { ...words[wordIdx], [field]: value };
        setAnalyzedData(prev => ({ ...prev, [inputId]: words }));
    };

    const removeWord = (inputId: string, wordIdx: number) => {
        const words = [...(analyzedData[inputId] || [])];
        words.splice(wordIdx, 1);
        setAnalyzedData(prev => ({ ...prev, [inputId]: words }));
    };

    // --- Save ---
    const handleSave = async () => {
        if (!user) return;
        // Validate
        if (!title.trim()) return alert("프로젝트 제목이 없습니다.");
        const validInputs = inputs.filter(i => i.content.trim().length > 0);
        if (validInputs.length === 0) return alert("저장할 지문이 없습니다.");

        setIsSaving(true);
        try {
            // 1. Create Continent (Project)
            const metadata = {
                category: category.toUpperCase() as any,
                textbook: category === 'textbook' ? { subject, publisher, unit: chapter } : undefined,
                mock: category === 'mock' ? { year: mockYear, month: mockMonth, grade: mockGrade } : undefined,
                other: category === 'custom' ? { workbook: 'Custom', publisher: 'User', unit: '1' } : undefined
            };

            const { data: continentData, error: continentError } = await supabase
                .from('continents')
                .insert({
                    name: `${category}-${Date.now()}`, // Internal ID
                    display_name: title,
                    theme_color: '#D4AF37', // Gold default
                    metadata: metadata,
                    created_by: user.id
                })
                .select()
                .single();

            if (continentError) throw continentError;
            const continentId = continentData.id;

            // 2. Create Passages
            const passagesToInsert = validInputs.map(input => ({
                continent_id: continentId,
                title: input.ref, // "31", "Lesson 1"
                content: input.content,
                word_count: input.content.trim().split(/\s+/).length,
                words_data: analyzedData[input.id] || [] // JSONB
            }));

            const { error: passageError } = await supabase
                .from('passages')
                .insert(passagesToInsert);

            if (passageError) throw passageError;

            alert("프로젝트가 성공적으로 생성되었습니다.");
            onComplete(); // Back to Project List

        } catch (e: any) {
            console.error(e);
            alert("저장 실패: " + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#020617] flex flex-col font-sans animate-fade-in text-slate-200">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-black opacity-80" />
            <div className="caustic-overlay opacity-30 pointer-events-none" />

            {/* Header */}
            <header className="relative z-10 h-16 flex items-center justify-between px-6 border-b border-white/5 bg-slate-950/50 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded border border-cyan-500/30 flex items-center justify-center bg-cyan-950/20 text-cyan-400">
                        <Layers size={16} />
                    </div>
                    <div>
                        <h2 className="text-lg font-serif font-bold text-babel-gold tracking-wide">
                            {title || 'PROJECT SETUP'}
                        </h2>
                        <div className="text-[10px] text-stone-500 font-mono uppercase tracking-widest">
                            {step === 1 ? 'Step 1: Configuration' : 'Step 2: Content Injection'}
                        </div>
                    </div>
                </div>
                <button onClick={onCancel} className="text-stone-500 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </header>

            {/* Content Container */}
            <div className="relative z-10 flex-1 overflow-hidden flex">

                {/* Step 1: Metadata Config */}
                {step === 1 && (
                    <div className="max-w-4xl mx-auto w-full p-12 self-center">
                        <h3 className="text-2xl font-light mb-8 flex items-center gap-2">
                            <span className="text-cyan-500 font-bold">01.</span> Project Metadata
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {/* Left: Category */}
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs uppercase tracking-widest text-stone-500 mb-4 block">Select Type</label>
                                    <div className="space-y-3">
                                        {[
                                            { id: 'textbook', icon: BookOpen, label: 'Textbook' },
                                            { id: 'mock', icon: GraduationCap, label: 'Mock Test' },
                                            { id: 'custom', icon: FileText, label: 'Custom / Other' }
                                        ].map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setCategory(opt.id as any)}
                                                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${category === opt.id
                                                        ? 'bg-cyan-950/30 border-cyan-500 text-white shadow-[0_0_15px_rgba(34,211,238,0.1)]'
                                                        : 'bg-stone-900/50 border-white/5 text-stone-400 hover:bg-stone-800'
                                                    }`}
                                            >
                                                <opt.icon size={20} className={category === opt.id ? 'text-cyan-400' : 'text-stone-600'} />
                                                <span className="font-bold tracking-wide">{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Details */}
                            <div className="space-y-6">
                                <label className="text-xs uppercase tracking-widest text-stone-500 mb-4 block">Details</label>

                                <div className="bg-stone-900/50 p-6 rounded-xl border border-white/5 space-y-4">
                                    {category === 'textbook' && (
                                        <>
                                            <div>
                                                <label className="text-[10px] uppercase text-stone-500 mb-1 block">Subject</label>
                                                <select value={subject} onChange={e => setSubject(e.target.value)} className="abyss-input w-full">
                                                    {['공통영어1', '공통영어2', '영어1', '영어2', '심화영어'].map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] uppercase text-stone-500 mb-1 block">Publisher</label>
                                                <input value={publisher} onChange={e => setPublisher(e.target.value)} onBlur={autoTitle} className="abyss-input w-full" placeholder="Ex: NE능률(김)" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] uppercase text-stone-500 mb-1 block">Unit / Chapter</label>
                                                <input value={chapter} onChange={e => setChapter(e.target.value)} onBlur={autoTitle} className="abyss-input w-full" placeholder="Ex: 1" />
                                            </div>
                                        </>
                                    )}

                                    {category === 'mock' && (
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="text-[10px] uppercase text-stone-500 mb-1 block">Year</label>
                                                <select value={mockYear} onChange={e => setMockYear(e.target.value)} className="abyss-input w-full">
                                                    {[2025, 2024, 2023, 2022, 2021].map(y => <option key={y} value={y}>{y}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] uppercase text-stone-500 mb-1 block">Month</label>
                                                <select value={mockMonth} onChange={e => { setMockMonth(e.target.value); autoTitle(); }} className="abyss-input w-full">
                                                    {['3', '6', '9', '10', '11'].map(m => <option key={m} value={m}>{m}월</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] uppercase text-stone-500 mb-1 block">Grade</label>
                                                <select value={mockGrade} onChange={e => { setMockGrade(e.target.value); autoTitle(); }} className="abyss-input w-full">
                                                    {['1', '2', '3'].map(g => <option key={g} value={g}>고{g}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-4 border-t border-white/5">
                                        <label className="text-[10px] uppercase text-stone-500 mb-1 block">Project Display Name</label>
                                        <input
                                            value={title}
                                            onChange={e => setTitle(e.target.value)}
                                            className="abyss-input w-full text-lg font-bold text-babel-gold"
                                            placeholder="Enter Title..."
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={() => setStep(2)}
                                    disabled={!title}
                                    className="w-full abyss-btn py-4 flex items-center justify-center gap-2 group disabled:opacity-50"
                                >
                                    Proceed to Content <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Content (Dashboard) */}
                {step === 2 && (
                    <div className="w-full h-full flex overflow-hidden">

                        {/* 1. Left Sidebar */}
                        <div className="w-60 bg-black/40 border-r border-white/5 flex flex-col p-2 space-y-1 z-20 backdrop-blur-sm">
                            <div className="px-4 py-3 mb-2">
                                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Passage Control</h3>
                                <p className="text-[10px] text-stone-600">Managing {inputs.length} blocks</p>
                            </div>

                            <button className="w-full text-left px-4 py-3 rounded flex items-center gap-3 text-stone-500 hover:bg-white/5 cursor-not-allowed opacity-50">
                                <CheckSquare size={16} /> 지문 보관함
                            </button>
                            <button className="w-full text-left px-4 py-3 rounded flex items-center gap-3 bg-babel-gold/10 text-babel-gold border border-babel-gold/30">
                                <Plus size={16} /> 지문 등록 / 수정
                            </button>

                            <div className="mt-auto p-4 border-t border-white/5">
                                <div className="text-[10px] text-stone-600 text-center">
                                    Total Words: {inputs.reduce((acc, i) => acc + i.content.split(/\s+/).length, 0)}
                                </div>
                            </div>
                        </div>

                        {/* 2. Center: Input Area */}
                        <div className="flex-1 bg-stone-900/50 flex flex-col border-r border-white/5 min-w-[400px]">
                            <div className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-stone-900 z-10">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Edit2 size={16} /> 지문 입력 (Passage Input)
                                </h3>
                                <button
                                    onClick={addInputCard}
                                    className="px-3 py-1.5 bg-stone-800 border border-white/10 rounded hover:bg-stone-700 text-white text-xs flex items-center gap-2 shadow-lg"
                                >
                                    <Plus size={14} /> 지문 추가
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-stone-700">
                                {inputs.map((input, idx) => (
                                    <div
                                        key={input.id}
                                        onClick={() => setActiveInputId(input.id)}
                                        className={`border rounded-xl p-4 transition-all relative group ${activeInputId === input.id
                                                ? 'bg-stone-800 border-babel-gold ring-1 ring-babel-gold/50 shadow-xl'
                                                : 'bg-stone-900 border-white/5 opacity-80 hover:opacity-100 hover:bg-stone-800'
                                            }`}
                                    >
                                        <div className="flex gap-4 mb-3">
                                            <div className="w-16">
                                                <label className="text-[9px] uppercase text-stone-500 block mb-1">번호 (Ref)</label>
                                                <input
                                                    value={input.ref}
                                                    onChange={e => updateInput(input.id, 'ref', e.target.value)}
                                                    className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-center text-white font-bold outline-none focus:border-babel-gold text-sm"
                                                    placeholder="#"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-[9px] uppercase text-stone-500 block mb-1">내용 미리보기</label>
                                                <div className="text-xs text-stone-400 font-serif truncate pt-1.5 max-w-[300px]">
                                                    {input.content.substring(0, 60) || '(Empty)'}...
                                                </div>
                                            </div>
                                            {inputs.length > 1 && (
                                                <button
                                                    onClick={(e) => removeInputCard(input.id, e)}
                                                    className="w-6 h-6 rounded flex items-center justify-center text-stone-600 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                                                >
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>

                                        <textarea
                                            value={input.content}
                                            onChange={e => updateInput(input.id, 'content', e.target.value)}
                                            className="w-full h-40 bg-black/30 border border-white/5 rounded-lg p-3 text-stone-300 text-sm font-serif leading-relaxed outline-none focus:border-white/20 resize-none"
                                            placeholder="Paste passage text here..."
                                        />

                                        {analyzedData[input.id] && (
                                            <div className="absolute bottom-4 right-4 text-[10px] text-green-500 flex items-center gap-1 bg-green-950/20 px-2 py-1 rounded border border-green-900/30">
                                                <Check size={10} /> Analyzed ({analyzedData[input.id].length})
                                            </div>
                                        )}
                                    </div>
                                ))}

                                <div className="h-20" /> {/* Spacer */}
                            </div>
                        </div>

                        {/* 3. Right: Results & Actions */}
                        <div className="flex-1 bg-black/80 flex flex-col border-l border-white/5 min-w-[450px]">
                            <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/95 z-10 backdrop-blur-sm shadow-xl sticky top-0">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Brain size={16} className="text-babel-gold" /> AI 분석 결과
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleAnalyzeAll}
                                        disabled={isAnalyzing}
                                        className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-babel-gold border border-babel-gold/30 rounded text-xs transition-colors flex items-center gap-2"
                                    >
                                        {isAnalyzing ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                        전체 지문 분석
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="px-4 py-1.5 bg-babel-gold hover:bg-yellow-500 text-black font-bold rounded text-xs shadow-lg flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                        저장 (Update/Save)
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                {/* Flattened Result List */}
                                <div className="space-y-4">
                                    {inputs.map((input) => {
                                        const words = analyzedData[input.id];
                                        if (!words || words.length === 0) return null;

                                        return words.map((word, wIdx) => (
                                            <div key={`${input.id}-${wIdx}`} className="bg-stone-900 p-4 rounded-xl border border-white/5 group hover:border-babel-gold/30 transition-all">
                                                <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/5">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-bold bg-stone-800 text-babel-gold px-2 py-0.5 rounded border border-white/5">
                                                            No. {input.ref}
                                                        </span>
                                                        <input
                                                            value={word.word}
                                                            onChange={e => updateWord(input.id, wIdx, 'word', e.target.value)}
                                                            className="bg-transparent font-bold text-babel-gold text-base outline-none w-32"
                                                        />
                                                        <span className="text-stone-600 text-xs">/ {word.phonetic || '...'} /</span>
                                                        <span className="text-stone-500 text-[10px] bg-stone-950 px-1 rounded">{word.part_of_speech}</span>
                                                    </div>
                                                    <button onClick={() => removeWord(input.id, wIdx)} className="text-stone-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>

                                                <div className="space-y-1 mb-3">
                                                    {[0, 1].map(i => (
                                                        <input
                                                            key={i}
                                                            className="w-full bg-transparent border-b border-white/5 py-1 text-xs text-stone-300 outline-none focus:border-babel-gold/30 placeholder-stone-700"
                                                            placeholder={`뜻 ${i + 1}...`}
                                                            value={word.meanings_kr?.[i] || ''}
                                                            onChange={(e) => {
                                                                const newMeanings = [...(word.meanings_kr || [])];
                                                                newMeanings[i] = e.target.value;
                                                                updateWord(input.id, wIdx, 'meanings_kr', newMeanings);
                                                            }}
                                                        />
                                                    ))}
                                                </div>

                                                <div className="flex gap-4 text-[10px] text-stone-500">
                                                    <div className="flex-1 flex gap-2 items-center">
                                                        <span className="text-stone-600 font-bold">SYN</span>
                                                        <input
                                                            value={word.synonyms?.join(', ')}
                                                            onChange={e => updateWord(input.id, wIdx, 'synonyms', e.target.value.split(','))}
                                                            className="bg-transparent w-full outline-none text-stone-400"
                                                            placeholder="syn1, syn2..."
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ));
                                    })}

                                    {Object.keys(analyzedData).length === 0 && (
                                        <div className="h-64 flex flex-col items-center justify-center text-stone-600 gap-4">
                                            <Brain size={48} className="opacity-10" />
                                            <p className="text-xs font-mono uppercase tracking-widest text-center">
                                                No Analysis Data.<br />
                                                Input text and click "전체 지문 분석"
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="h-20" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
