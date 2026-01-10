import React, { useState, useEffect } from 'react'; // Verified Build 4:51
import { supabase } from '../../lib/supabase';
import { extractWordsFromText, type RichWord } from '../../services/ai/extractionService';
import { ArrowLeft, Save, Plus, Brain, CheckSquare, Trash2, Layers, Check, Edit2, X, RefreshCw } from 'lucide-react';
import { MissionDistributor } from './MissionDistributor';

// Types
interface Continent {
    id: string;
    name: string;
    display_name: string;
    theme_color: string;
    image_url: string;
}

interface Passage {
    id: string;
    title: string;
    content: string;
    word_count: number;
    words_data: RichWord[];
    created_at: string;
}

interface NewPassageInput {
    id: string;
    title: string; // Used as Number/Index
    content: string;
}

interface ContinentManagerProps {
    continent: Continent;
    initialView?: 'list' | 'add';
    onClose: () => void;
}

export const ContinentManager: React.FC<ContinentManagerProps> = ({ continent, initialView = 'list', onClose }) => {
    // View State
    const [view, setView] = useState<'list' | 'add'>(initialView);
    const [passages, setPassages] = useState<Passage[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Distribution State
    const [isDistributing, setIsDistributing] = useState(false);

    // Workspace State (Add/Edit)
    const [newPassages, setNewPassages] = useState<NewPassageInput[]>([
        { id: 'new-1', title: '1', content: '' }
    ]);
    const [analyzedData, setAnalyzedData] = useState<Record<string, RichWord[]>>({}); // id -> words
    const [activeInputId, setActiveInputId] = useState<string>('new-1');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // --- Data Fetching ---
    useEffect(() => {
        fetchPassages();
    }, [continent.id]);

    const fetchPassages = async () => {
        const { data } = await supabase
            .from('passages')
            .select('*')
            .eq('continent_id', continent.id)
            .order('created_at', { ascending: true });

        if (data) setPassages(data);
    };

    const loadPassageToEdit = (passage: Passage) => {
        // Load existing passage into workspace
        setNewPassages([{
            id: passage.id,
            title: passage.title.replace('지문 ', ''),
            content: passage.content
        }]);
        setAnalyzedData({
            [passage.id]: passage.words_data || []
        });
        setActiveInputId(passage.id);
        setView('add');
    };

    // --- Workspace Logic ---
    const addSlot = () => {
        const newId = `new-${Date.now()}`;
        setNewPassages(prev => [...prev, {
            id: newId,
            title: `${prev.length + 1}`,
            content: ''
        }]);
        setActiveInputId(newId);
    };

    const removeSlot = (id: string) => {
        if (newPassages.length === 1) return; // Prevent deleting last slot
        setNewPassages(prev => prev.filter(p => p.id !== id));
        if (activeInputId === id) {
            setActiveInputId(newPassages[0]?.id || '');
        }
    };

    const updateSlot = (id: string, field: 'title' | 'content', value: string) => {
        setNewPassages(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const runAnalyzeAll = async () => {
        setIsAnalyzing(true);
        try {
            const updates: Record<string, RichWord[]> = {};

            for (const p of newPassages) {
                if (!p.content.trim()) continue;
                // Only analyze if no data exists or user explicitly re-runs (this function is explicit re-run)
                // Integrating mock delay per item would be slow, so assuming parallel or fast service
                const richWords = await extractWordsFromText(p.content);
                updates[p.id] = richWords;
            }

            setAnalyzedData(prev => ({ ...prev, ...updates }));
        } catch (e) {
            alert("Analysis Failed");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const updateAnalyzedWord = (passageId: string, wordIndex: number, newWord: Partial<RichWord>) => {
        setAnalyzedData(prev => {
            const currentList = [...(prev[passageId] || [])];
            currentList[wordIndex] = { ...currentList[wordIndex], ...newWord };
            return { ...prev, [passageId]: currentList };
        });
    };

    const removeAnalyzedWord = (passageId: string, wordIndex: number) => {
        setAnalyzedData(prev => {
            const currentList = [...(prev[passageId] || [])];
            currentList.splice(wordIndex, 1);
            return { ...prev, [passageId]: currentList };
        });
    };

    const handleBulkSave = async () => {
        const valid = newPassages.filter(p => p.content.trim().length > 0);
        if (valid.length === 0) return alert("저장할 지문이 없습니다.");

        // Separate Inserts and Updates
        const toInsert = [];
        const toUpdate = [];

        for (const p of valid) {
            const payload = {
                continent_id: continent.id,
                title: p.title.startsWith('지문') ? p.title : `지문 ${p.title}`,
                content: p.content,
                word_count: p.content.trim().split(/\s+/).length,
                words_data: analyzedData[p.id] || []
            };

            if (p.id.startsWith('new-')) {
                toInsert.push(payload);
            } else {
                toUpdate.push({ ...payload, id: p.id });
            }
        }

        try {
            if (toInsert.length > 0) {
                const { error } = await supabase.from('passages').insert(toInsert);
                if (error) throw error;
            }
            if (toUpdate.length > 0) {
                for (const item of toUpdate) {
                    const { error } = await supabase.from('passages').update(item).eq('id', item.id);
                    if (error) throw error;
                }
            }

            alert("저장 완료!");
            // Reset workspace
            setNewPassages([{ id: 'new-1', title: '1', content: '' }]);
            setAnalyzedData({});
            setView('list');
            fetchPassages();
        } catch (e: any) {
            alert("저장 실패: " + e.message);
        }
    };

    // --- Render ---

    if (isDistributing) {
        const selectedPassages = passages.filter(p => selectedIds.includes(p.id));
        return <MissionDistributor
            onClose={() => setIsDistributing(false)}
            initialPassages={selectedPassages}
            missionTitle={`Mission: ${continent.display_name}`}
        />;
    }

    return (
        <div className="fixed inset-0 z-40 bg-stone-950 flex flex-col animate-in fade-in duration-300">
            {/* Header */}
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-stone-900 shadow-xl z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="text-stone-400 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-serif text-babel-gold flex items-center gap-2">
                            Project : {continent.display_name}
                        </h1>
                        <p className="text-[10px] text-stone-500 uppercase tracking-widest">{continent.name}</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setIsDistributing(true)}
                        disabled={selectedIds.length === 0}
                        className="px-4 py-2 bg-blue-900/40 text-blue-400 border border-blue-800 rounded hover:bg-blue-800 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Layers size={16} /> 선택 지문 배포 ({selectedIds.length})
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden flex">
                {/* Sidebar Navigation */}
                <div className="w-64 border-r border-white/10 bg-black/40 p-2 space-y-1">
                    <button
                        onClick={() => setView('list')}
                        className={`w-full text-left px-4 py-3 rounded flex items-center gap-3 transition-colors ${view === 'list' ? 'bg-babel-gold/10 text-babel-gold border border-babel-gold/30' : 'text-stone-400 hover:bg-white/5'}`}
                    >
                        <CheckSquare size={16} /> 지문 보관함
                    </button>
                    <button
                        onClick={() => {
                            // Reset to blank new state when explicitly clicking "Add"
                            setNewPassages([{ id: 'new-1', title: '1', content: '' }]);
                            setAnalyzedData({});
                            setView('add');
                        }}
                        className={`w-full text-left px-4 py-3 rounded flex items-center gap-3 transition-colors ${view === 'add' ? 'bg-babel-gold/10 text-babel-gold border border-babel-gold/30' : 'text-stone-400 hover:bg-white/5'}`}
                    >
                        <Plus size={16} /> 지문 등록 / 수정
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden bg-stone-900/50 relative">
                    {/* View: Passage List */}
                    {view === 'list' && (
                        <div className="h-full overflow-y-auto p-8">
                            <div className="max-w-5xl mx-auto">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl text-white font-serif">Library Content</h2>
                                    <div className="flex gap-2 text-xs">
                                        <button onClick={() => {
                                            if (selectedIds.length === passages.length) setSelectedIds([]);
                                            else setSelectedIds(passages.map(p => p.id));
                                        }} className="px-3 py-1 border border-white/20 rounded hover:bg-white/10 text-stone-300">
                                            전체 선택
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {passages.map(p => {
                                        const isAnalyzed = p.words_data && Array.isArray(p.words_data) && p.words_data.length > 0;
                                        return (
                                            <div key={p.id} className={`p-4 rounded-lg border flex items-center gap-4 transition-all ${selectedIds.includes(p.id) ? 'bg-blue-900/20 border-blue-500/50' : 'bg-stone-800 border-white/5 hover:border-white/20'}`}>
                                                <div onClick={() => setSelectedIds(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])} className="cursor-pointer">
                                                    {selectedIds.includes(p.id) ?
                                                        <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-white"><Check size={12} /></div> :
                                                        <div className="w-5 h-5 border border-stone-600 rounded"></div>
                                                    }
                                                </div>

                                                <div className="flex-1 cursor-pointer group" onClick={() => loadPassageToEdit(p)}>
                                                    <h3 className="text-white font-bold group-hover:text-babel-gold transition-colors flex items-center gap-2">
                                                        {p.title} <Edit2 size={12} className="opacity-0 group-hover:opacity-100" />
                                                    </h3>
                                                    <p className="text-stone-500 text-xs truncate w-96 opacity-70">{p.content.substring(0, 100)}...</p>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    <div className="text-right">
                                                        <div className="text-stone-400 text-sm font-mono">{p.word_count} words</div>
                                                    </div>

                                                    {isAnalyzed ? (
                                                        <div className="px-3 py-1 bg-green-900/30 text-green-400 border border-green-800 rounded text-xs flex items-center gap-1">
                                                            <Brain size={12} /> Analyzed
                                                        </div>
                                                    ) : (
                                                        <div className="text-stone-600 text-xs">Unanalyzed</div>
                                                    )}

                                                    <button onClick={async () => {
                                                        if (confirm("정말 삭제하시겠습니까?")) {
                                                            await supabase.from('passages').delete().eq('id', p.id);
                                                            fetchPassages();
                                                        }
                                                    }} className="text-stone-600 hover:text-red-500 transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* View: Split Screen Add & Analyze */}
                    {view === 'add' && (
                        <div className="absolute inset-0 flex">
                            {/* Left Pane: Inputs */}
                            <div className="w-1/2 border-r border-white/10 p-6 overflow-y-auto bg-stone-900">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl text-white font-bold flex items-center gap-2"><Edit2 size={18} /> 지문 입력</h2>
                                    <button onClick={addSlot} className="px-3 py-1.5 bg-stone-800 border border-white/10 rounded hover:bg-stone-700 text-white text-xs flex items-center gap-2">
                                        <Plus size={14} /> 지문 추가
                                    </button>
                                    {/* Moved Save Button to Right Pane */}
                                </div>

                                <div className="space-y-6 pb-20">
                                    {newPassages.map((p) => (
                                        <div
                                            key={p.id}
                                            onClick={() => setActiveInputId(p.id)}
                                            className={`border rounded-xl p-4 transition-all cursor-pointer relative group ${activeInputId === p.id ? 'bg-stone-800 border-babel-gold ring-1 ring-babel-gold/50' : 'bg-stone-800/50 border-white/5 opacity-60 hover:opacity-100'}`}
                                        >
                                            <div className="flex gap-3 mb-3">
                                                <div className="w-16">
                                                    <label className="text-[10px] uppercase text-stone-500 block mb-1">번호</label>
                                                    <input
                                                        className="w-full bg-black/50 border border-white/10 rounded p-2 text-center text-white font-bold outline-none focus:border-babel-gold"
                                                        value={p.title}
                                                        onChange={(e) => updateSlot(p.id, 'title', e.target.value)}
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-[10px] uppercase text-stone-500 block mb-1">내용 미리보기</label>
                                                    <div className="text-xs text-stone-400 truncate pt-2">{p.content.substring(0, 50)}...</div>
                                                </div>
                                                <button onClick={(e) => { e.stopPropagation(); removeSlot(p.id); }} className="text-stone-600 hover:text-red-400 self-start">
                                                    <X size={16} />
                                                </button>
                                            </div>

                                            <textarea
                                                className="w-full h-48 bg-black/40 border border-white/10 rounded-lg p-3 text-stone-300 text-sm font-mono focus:border-babel-gold/50 outline-none resize-none leading-relaxed"
                                                placeholder="지문 내용을 여기에 붙여넣으세요..."
                                                value={p.content}
                                                onChange={(e) => updateSlot(p.id, 'content', e.target.value)}
                                            />

                                            {/* Analysis Indicator */}
                                            {analyzedData[p.id] && (
                                                <div className="mt-2 text-xs text-green-500 flex items-center gap-1">
                                                    <Check size={12} /> {analyzedData[p.id].length} words analyzed
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right Pane: Analysis & Edit */}
                            <div className="w-1/2 bg-black/80 p-6 overflow-y-auto flex flex-col border-l border-white/5">
                                <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10 sticky top-0 bg-black/95 z-10 backdrop-blur-sm">
                                    <h2 className="text-xl text-white font-bold flex items-center gap-2">
                                        <Brain size={18} className="text-babel-gold" />
                                        AI 분석 결과
                                    </h2>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={runAnalyzeAll}
                                            disabled={isAnalyzing}
                                            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-babel-gold hover:text-white border border-babel-gold/30 rounded text-sm transition-colors flex items-center gap-2"
                                        >
                                            {isAnalyzing ? <RefreshCw size={14} className="animate-spin" /> : <Brain size={14} />}
                                            전체 지문 분석
                                        </button>
                                        <button
                                            onClick={handleBulkSave}
                                            className="px-4 py-2 bg-babel-gold text-black font-bold rounded hover:bg-yellow-500 text-sm flex items-center gap-2 shadow-lg"
                                        >
                                            <Save size={14} /> 저장 (Update/Save)
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-4">
                                    {analyzedData[activeInputId] ? (
                                        <>
                                            {analyzedData[activeInputId].map((word, idx) => (
                                                <div key={idx} className="bg-stone-900 p-4 rounded-xl border border-white/5 group hover:border-babel-gold/30 transition-all relative">

                                                    {/* Compact Header */}
                                                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/5">
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                className="bg-transparent font-bold text-babel-gold text-lg outline-none w-28"
                                                                value={word.word}
                                                                onChange={(e) => updateAnalyzedWord(activeInputId, idx, { word: e.target.value })}
                                                            />
                                                            <input
                                                                className="bg-transparent text-stone-500 text-xs font-mono outline-none w-20"
                                                                value={word.phonetic}
                                                                onChange={(e) => updateAnalyzedWord(activeInputId, idx, { phonetic: e.target.value })}
                                                            />
                                                            <input
                                                                className="bg-stone-800 text-stone-300 text-[10px] px-1.5 py-0.5 rounded outline-none w-12 text-center"
                                                                value={word.part_of_speech}
                                                                onChange={(e) => updateAnalyzedWord(activeInputId, idx, { part_of_speech: e.target.value })}
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => removeAnalyzedWord(activeInputId, idx)}
                                                            className="text-stone-600 hover:text-red-400 p-1 rounded"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>

                                                    {/* Compact Body - Meanings */}
                                                    <div className="space-y-1 mb-2">
                                                        {[0, 1, 2].map(i => (
                                                            <input
                                                                key={i}
                                                                className="w-full bg-transparent border-b border-white/5 py-1 text-xs text-stone-300 outline-none focus:border-babel-gold/50 placeholder-stone-700"
                                                                placeholder={`Meaning ${i + 1} (adj. meaning...)`}
                                                                value={word.meanings_kr?.[i] || ''}
                                                                onChange={(e) => {
                                                                    const newMeanings = [...(word.meanings_kr || [])];
                                                                    newMeanings[i] = e.target.value;
                                                                    updateAnalyzedWord(activeInputId, idx, { meanings_kr: newMeanings });
                                                                }}
                                                            />
                                                        ))}
                                                    </div>

                                                    {/* Compact Footer - Single Line Syn/Ant */}
                                                    <div className="grid grid-cols-2 gap-4 text-[10px] text-stone-500">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold opacity-50">SYN</span>
                                                            <input
                                                                className="bg-transparent w-full outline-none text-stone-400"
                                                                value={word.synonyms?.join(', ') || ''}
                                                                onChange={(e) => updateAnalyzedWord(activeInputId, idx, { synonyms: e.target.value.split(',').map(s => s.trim()) })}
                                                                placeholder="syn1, syn2, syn3"
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold opacity-50">ANT</span>
                                                            <input
                                                                className="bg-transparent w-full outline-none text-stone-400"
                                                                value={word.antonyms?.join(', ') || ''}
                                                                onChange={(e) => updateAnalyzedWord(activeInputId, idx, { antonyms: e.target.value.split(',').map(s => s.trim()) })}
                                                                placeholder="ant1, ant2, ant3"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="h-20" />
                                        </>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-stone-600 space-y-4">
                                            <Brain size={48} className="opacity-10" />
                                            <p className="text-sm">지문 입력 후 <br /><span className="text-babel-gold">"전체 지문 분석"</span>을 실행하세요.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
