import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Save, ArrowRight, X, BookOpen, GraduationCap, FileText, Sparkles, Loader2, Plus, Trash2, Layers, Check, Edit2, Brain, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { extractWordsFromText } from '../../../services/ai/extractionService';
import type { RichWord } from '../../../services/ai/extractionService';

interface InputCard {
    id: string;
    ref: string; // e.g. "31", "Unit 1"
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

    // --- Step 2: Content (Slot Model) ---
    const [inputs, setInputs] = useState<InputCard[]>([
        { id: 'card-1', ref: '1', content: '' }
    ]);
    const [activeInputId, setActiveInputId] = useState<string>('card-1');

    // Analysis State
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

    // --- Input Management (Slot Logic) ---
    const addInputCard = () => {
        const newId = `card-${Date.now()}`;
        const lastRef = inputs[inputs.length - 1]?.ref;
        const nextRef = lastRef && !isNaN(Number(lastRef)) ? String(Number(lastRef) + 1) : `${inputs.length + 1}`;
        setInputs(prev => [...prev, { id: newId, ref: nextRef, content: '' }]);
        setActiveInputId(newId);
    };

    const removeInputCard = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (inputs.length === 1) return;
        setInputs(prev => prev.filter(c => c.id !== id));
        const newData = { ...analyzedData };
        delete newData[id];
        setAnalyzedData(newData);
        if (activeInputId === id) setActiveInputId(inputs[0].id);
    };

    const updateInput = (id: string, field: 'ref' | 'content', value: string) => {
        setInputs(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    // --- Analysis ---
    const handleAnalyzeAll = async () => {
        const validInputs = inputs.filter(i => i.content.trim().length > 0);
        if (validInputs.length === 0) return alert("분석할 지문 내용이 없습니다.");

        setIsAnalyzing(true);
        try {
            const updates: Record<string, RichWord[]> = {};
            for (const input of validInputs) {
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

    // --- Save (Nuclear Option) ---
    const handleSave = async () => {
        if (!user) return;
        if (!title.trim()) return alert("프로젝트 제목이 없습니다.");
        const validInputs = inputs.filter(i => i.content.trim().length > 0);
        if (validInputs.length === 0) return alert("저장할 지문이 없습니다.");

        setIsSaving(true);
        try {
            // Use Nuclear Auth Token if available for absolute reliability
            // ... (Auth Logic similar to ContinentManager)
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

            let token = '';
            let projectId = '';
            try { projectId = supabaseUrl.split('//')[1].split('.')[0]; } catch (e) { }
            const key = `sb-${projectId}-auth-token`;
            const sessionStr = localStorage.getItem(key) ||
                localStorage.getItem(Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token')) || '');

            if (sessionStr) {
                token = JSON.parse(sessionStr).access_token;
            }

            // Headers
            const headers: any = {
                'apikey': supabaseKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            // 1. Create Continent
            const metadata = {
                category: category.toUpperCase(),
                textbook: category === 'textbook' ? { subject, publisher, unit: chapter } : undefined,
                mock: category === 'mock' ? { year: mockYear, month: mockMonth, grade: mockGrade } : undefined,
                other: category === 'custom' ? { workbook: 'Custom', publisher: 'User', unit: '1' } : undefined
            };

            const continentPayload = {
                name: `${category}-${Date.now()}`,
                display_name: title,
                theme_color: '#D4AF37',
                metadata: metadata,
                created_by: user.id
            };

            const continentRes = await fetch(`${supabaseUrl}/rest/v1/continents`, {
                method: 'POST',
                headers,
                body: JSON.stringify(continentPayload)
            });

            if (!continentRes.ok) throw new Error(await continentRes.text());
            const [continentData] = await continentRes.json();
            const continentId = continentData.id;

            // 2. Insert Passages
            const passagesToInsert = validInputs.map(input => ({
                continent_id: continentId,
                title: input.ref,
                content: input.content,
                word_count: input.content.trim().split(/\s+/).length,
                words_data: analyzedData[input.id] || []
            }));

            const passageRes = await fetch(`${supabaseUrl}/rest/v1/passages`, {
                method: 'POST',
                headers,
                body: JSON.stringify(passagesToInsert)
            });

            if (!passageRes.ok) throw new Error(await passageRes.text());

            alert("프로젝트가 성공적으로 생성되었습니다. (Saved to Abyss)");
            onComplete();

        } catch (e: any) {
            console.error(e);
            alert("저장 실패: " + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#020617] flex flex-col font-sans animate-fade-in text-slate-200">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-black opacity-80" />

            {/* Header */}
            <header className="relative z-10 h-16 flex items-center justify-between px-6 border-b border-white/5 bg-slate-950/50 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded border border-cyan-500/30 flex items-center justify-center bg-cyan-950/20 text-cyan-400">
                        <Layers size={16} />
                    </div>
                    <div>
                        <h2 className="text-lg font-serif font-bold text-babel-gold tracking-wide">{title || 'PROJECT SETUP'}</h2>
                        <div className="text-[10px] text-stone-500 font-mono uppercase tracking-widest">
                            {step === 1 ? 'Step 1: Configuration' : 'Step 2: Content Injection'}
                        </div>
                    </div>
                </div>
                <button onClick={onCancel} className="text-stone-500 hover:text-white transition-colors"><X size={20} /></button>
            </header>

            <div className="relative z-10 flex-1 overflow-hidden flex">
                {/* Step 1: Metadata */}
                {step === 1 && (
                    <div className="max-w-4xl mx-auto w-full p-12 self-center">
                        <h3 className="text-2xl font-light mb-8 flex items-center gap-2"><span className="text-cyan-500 font-bold">01.</span> Project Metadata</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <label className="text-xs uppercase tracking-widest text-stone-500 mb-4 block">Select Type</label>
                                {[
                                    { id: 'textbook', icon: BookOpen, label: 'Textbook' },
                                    { id: 'mock', icon: GraduationCap, label: 'Mock Test' },
                                    { id: 'custom', icon: FileText, label: 'Custom' }
                                ].map(opt => (
                                    <button key={opt.id} onClick={() => setCategory(opt.id as any)} className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${category === opt.id ? 'bg-cyan-950/30 border-cyan-500 text-white' : 'bg-stone-900/50 border-white/5 text-stone-400'}`}>
                                        <opt.icon size={20} /> <span className="font-bold">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="space-y-6">
                                <label className="text-xs uppercase tracking-widest text-stone-500 mb-4 block">Details</label>
                                <div className="bg-stone-900/50 p-6 rounded-xl border border-white/5 space-y-4">
                                    {category === 'textbook' && (
                                        <>
                                            <div><label className="text-[10px] uppercase text-stone-500 mb-1 block">Subject</label><select value={subject} onChange={e => setSubject(e.target.value)} className="abyss-input w-full">{['공통영어1', '영어1', '영어2'].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                                            <div><label className="text-[10px] uppercase text-stone-500 mb-1 block">Publisher</label><input value={publisher} onChange={e => setPublisher(e.target.value)} onBlur={autoTitle} className="abyss-input w-full" placeholder="Ex: NE능률" /></div>
                                            <div><label className="text-[10px] uppercase text-stone-500 mb-1 block">Unit</label><input value={chapter} onChange={e => setChapter(e.target.value)} onBlur={autoTitle} className="abyss-input w-full" placeholder="Ex: 1" /></div>
                                        </>
                                    )}
                                    {category === 'mock' && (
                                        <div className="grid grid-cols-3 gap-4">
                                            <div><label className="text-[10px] uppercase text-stone-500 mb-1 block">Year</label><select value={mockYear} onChange={e => setMockYear(e.target.value)} className="abyss-input w-full">{[2025, 2024, 2023].map(y => <option key={y} value={y}>{y}</option>)}</select></div>
                                            <div><label className="text-[10px] uppercase text-stone-500 mb-1 block">Month</label><select value={mockMonth} onChange={e => { setMockMonth(e.target.value); autoTitle(); }} className="abyss-input w-full">{['3', '6', '9', '11'].map(m => <option key={m} value={m}>{m}월</option>)}</select></div>
                                            <div><label className="text-[10px] uppercase text-stone-500 mb-1 block">Grade</label><select value={mockGrade} onChange={e => { setMockGrade(e.target.value); autoTitle(); }} className="abyss-input w-full">{['1', '2', '3'].map(g => <option key={g} value={g}>고{g}</option>)}</select></div>
                                        </div>
                                    )}
                                    <div className="pt-4 border-t border-white/5">
                                        <label className="text-[10px] uppercase text-stone-500 mb-1 block">Project Title</label>
                                        <input value={title} onChange={e => setTitle(e.target.value)} className="abyss-input w-full text-lg font-bold text-babel-gold" placeholder="Enter Title..." />
                                    </div>
                                </div>
                                <button onClick={() => setStep(2)} disabled={!title} className="w-full abyss-btn py-4 flex items-center justify-center gap-2 group disabled:opacity-50">Proceed <ArrowRight size={16} /></button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Content */}
                {step === 2 && (
                    <div className="w-full h-full flex overflow-hidden">
                        {/* Sidebar */}
                        <div className="w-60 bg-black/40 border-r border-white/5 flex flex-col p-2 space-y-1 z-20 backdrop-blur-sm">
                            <div className="px-4 py-3 mb-2"><h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Control</h3><p className="text-[10px] text-stone-600">{inputs.length} items</p></div>
                            <button onClick={addInputCard} className="w-full text-left px-4 py-3 rounded flex items-center gap-3 bg-babel-gold/10 text-babel-gold border border-babel-gold/30"><Plus size={16} /> 지문 추가 (Add)</button>
                        </div>

                        {/* Input Area */}
                        <div className="flex-1 bg-stone-900/50 flex flex-col border-r border-white/5 min-w-[400px]">
                            <div className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-stone-900 z-10">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2"><Edit2 size={16} /> 지문 입력</h3>
                                <button onClick={addInputCard} className="px-3 py-1.5 bg-stone-800 border border-white/10 rounded hover:bg-stone-700 text-white text-xs flex items-center gap-2"><Plus size={14} /> Add Slot</button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                                {inputs.map(input => (
                                    <div key={input.id} onClick={() => setActiveInputId(input.id)} className={`border rounded-xl p-4 relative group ${activeInputId === input.id ? 'bg-stone-800 border-babel-gold' : 'bg-stone-900 border-white/5 opacity-80'}`}>
                                        <div className="flex gap-4 mb-3">
                                            <div className="w-16"><input value={input.ref} onChange={e => updateInput(input.id, 'ref', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-center text-white font-bold text-sm" placeholder="#" /></div>
                                            <div className="flex-1"><div className="text-xs text-stone-400 truncate pt-1.5">{input.content.substring(0, 50)}...</div></div>
                                            {inputs.length > 1 && <button onClick={(e) => removeInputCard(input.id, e)} className="text-stone-600 hover:text-red-400"><X size={14} /></button>}
                                        </div>
                                        <textarea value={input.content} onChange={e => updateInput(input.id, 'content', e.target.value)} className="w-full h-40 bg-black/30 border border-white/5 rounded-lg p-3 text-stone-300 text-sm font-serif leading-relaxed" placeholder="Paste text..." />
                                        {analyzedData[input.id] && <div className="absolute bottom-4 right-4 text-[10px] text-green-500 bg-green-950/20 px-2 py-1 rounded border border-green-900/30"><Check size={10} /> Analyzed</div>}
                                    </div>
                                ))}
                                <div className="h-20" />
                            </div>
                        </div>

                        {/* Result Area */}
                        <div className="flex-1 bg-black/80 flex flex-col border-l border-white/5 min-w-[450px]">
                            <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/95 z-10 sticky top-0">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2"><Brain size={16} className="text-babel-gold" /> Result</h3>
                                <div className="flex gap-2">
                                    <button onClick={handleAnalyzeAll} disabled={isAnalyzing} className="px-3 py-1.5 bg-stone-800 text-babel-gold border border-babel-gold/30 rounded text-xs flex items-center gap-2">{isAnalyzing ? <RefreshCw className="animate-spin" size={12} /> : <Sparkles size={12} />} Analyze All</button>
                                    <button onClick={handleSave} disabled={isSaving} className="px-4 py-1.5 bg-babel-gold text-black font-bold rounded text-xs flex items-center gap-2">{isSaving ? <Loader2 className="animate-spin" size={12} /> : <Save size={12} />} Save</button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {inputs.flatMap(input => (analyzedData[input.id] || []).map((word, wIdx) => (
                                    <div key={`${input.id}-${wIdx}`} className="bg-stone-900 p-4 rounded-xl border border-white/5">
                                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/5">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-bold bg-stone-800 text-babel-gold px-2 py-0.5 rounded">No. {input.ref}</span>
                                                <input value={word.word} onChange={e => updateWord(input.id, wIdx, 'word', e.target.value)} className="bg-transparent font-bold text-babel-gold text-base outline-none w-32" />
                                                <span className="text-stone-600 text-xs">{word.phonetic}</span>
                                                <span className="text-stone-500 text-[10px] bg-stone-950 px-1 rounded">{word.part_of_speech}</span>
                                            </div>
                                            <button onClick={() => removeWord(input.id, wIdx)} className="text-stone-600 hover:text-red-400"><Trash2 size={12} /></button>
                                        </div>
                                        <div className="space-y-1 mb-3">
                                            {word.meanings_kr.map((m, i) => (
                                                <input key={i} value={m} onChange={e => { const nm = [...word.meanings_kr]; nm[i] = e.target.value; updateWord(input.id, wIdx, 'meanings_kr', nm) }} className="w-full bg-transparent border-b border-white/5 py-1 text-xs text-stone-300" placeholder={`Mean. ${i + 1}`} />
                                            ))}
                                        </div>
                                        {/* Context & Antonyms */}
                                        <div className="space-y-2 text-[10px] text-stone-500 bg-black/20 p-2 rounded">
                                            <div className="flex gap-2"><span className="w-8 font-bold opacity-50">SYN</span><input value={word.synonyms?.join(', ')} onChange={e => updateWord(input.id, wIdx, 'synonyms', e.target.value.split(','))} className="bg-transparent w-full text-stone-400" /></div>
                                            <div className="flex gap-2"><span className="w-8 font-bold opacity-50">ANT</span><input value={word.antonyms?.join(', ')} onChange={e => updateWord(input.id, wIdx, 'antonyms', e.target.value.split(','))} className="bg-transparent w-full text-stone-400" /></div>
                                            <div className="border-t border-white/5 pt-2 mt-2">
                                                <div className="flex gap-2 mb-1"><span className="w-8 font-bold opacity-50">CTX</span><p className="text-stone-300 italic flex-1">{word.context_sentence}</p></div>
                                                <div className="flex gap-2"><span className="w-8 font-bold opacity-50">TANS</span><p className="text-stone-500 flex-1">{word.context_translation}</p></div>
                                            </div>
                                        </div>
                                    </div>
                                )))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
