import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { extractWordsFromText, type RichWord } from '../../services/ai/extractionService';
import { ArrowLeft, Save, Plus, Brain, CheckSquare, Trash2, Layers, Check, Edit2, X, ChevronRight } from 'lucide-react';
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

    // Bulk Add State
    const [newPassages, setNewPassages] = useState<NewPassageInput[]>([
        { id: 'new-1', title: '1', content: '' }
    ]);
    const [analyzedData, setAnalyzedData] = useState<Record<string, RichWord[]>>({}); // id -> words
    const [activeInputId, setActiveInputId] = useState<string>('new-1');

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

    // --- Bulk Add Logic ---
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
        setNewPassages(prev => prev.filter(p => p.id !== id));
        if (activeInputId === id) {
            setActiveInputId(newPassages[0]?.id || '');
        }
    };

    const updateSlot = (id: string, field: 'title' | 'content', value: string) => {
        setNewPassages(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const runAIStats = async () => {
        // Run analysis on the ACTIVE slot
        const target = newPassages.find(p => p.id === activeInputId);
        if (!target || !target.content.trim()) return alert("부석할 지문 내용이 없습니다.");

        const richWords = await extractWordsFromText(target.content);
        setAnalyzedData(prev => ({
            ...prev,
            [activeInputId]: richWords
        }));
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
        // 1. Filter empty
        const valid = newPassages.filter(p => p.content.trim().length > 0);
        if (valid.length === 0) return alert("저장할 지문이 없습니다.");

        // 2. Prepare Inserts
        const payload = valid.map(p => ({
            continent_id: continent.id,
            title: `지문 ${p.title}`,
            content: p.content,
            word_count: p.content.trim().split(/\s+/).length,
            words_data: analyzedData[p.id] || [] // Use modified AI data if exists
        }));

        // 3. Insert
        const { error } = await supabase.from('passages').insert(payload);

        if (error) {
            console.error(error);
            alert("저장 실패: " + error.message);
        } else {
            alert(`${valid.length}개 지문 저장 완료.`);
            // Reset
            setNewPassages([{ id: 'new-1', title: '1', content: '' }]);
            setAnalyzedData({});
            setView('list');
            fetchPassages();
        }
    };

    // --- Selection Logic ---
    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === passages.length) setSelectedIds([]);
        else setSelectedIds(passages.map(p => p.id));
    };

    // --- Render ---

    if (isDistributing) {
        const selectedPassages = passages.filter(p => selectedIds.includes(p.id));
        return <MissionDistributor
            onClose={() => setIsDistributing(false)}
            initialPassages={selectedPassages} // Pass selected passages
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
                        <CheckSquare size={16} /> 지문 보관함 (Library)
                    </button>
                    <button
                        onClick={() => setView('add')}
                        className={`w-full text-left px-4 py-3 rounded flex items-center gap-3 transition-colors ${view === 'add' ? 'bg-babel-gold/10 text-babel-gold border border-babel-gold/30' : 'text-stone-400 hover:bg-white/5'}`}
                    >
                        <Plus size={16} /> 지문 등록 및 분석
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
                                        <button onClick={toggleSelectAll} className="px-3 py-1 border border-white/20 rounded hover:bg-white/10 text-stone-300">
                                            전체 선택 (Select All)
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {passages.length === 0 && (
                                        <div className="text-center py-20 text-stone-500 border border-dashed border-white/10 rounded-xl">
                                            등록된 지문이 없습니다. "지문 등록 및 분석" 메뉴를 이용하세요.
                                        </div>
                                    )}

                                    {passages.map(p => {
                                        const isAnalyzed = p.words_data && Array.isArray(p.words_data) && p.words_data.length > 0;
                                        return (
                                            <div key={p.id} className={`p-4 rounded-lg border flex items-center gap-4 transition-all ${selectedIds.includes(p.id) ? 'bg-blue-900/20 border-blue-500/50' : 'bg-stone-800 border-white/5 hover:border-white/20'}`}>
                                                <div onClick={() => toggleSelect(p.id)} className="cursor-pointer">
                                                    {selectedIds.includes(p.id) ?
                                                        <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-white"><Check size={12} /></div> :
                                                        <div className="w-5 h-5 border border-stone-600 rounded"></div>
                                                    }
                                                </div>

                                                <div className="flex-1">
                                                    <h3 className="text-white font-bold">{p.title}</h3>
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
                                    <div className="flex gap-2">
                                        <button onClick={addSlot} className="px-3 py-1.5 bg-stone-800 border border-white/10 rounded hover:bg-stone-700 text-white text-xs flex items-center gap-2">
                                            <Plus size={14} /> 지문 추가
                                        </button>
                                        <button onClick={handleBulkSave} className="px-4 py-1.5 bg-babel-gold text-black font-bold rounded hover:bg-yellow-500 text-xs flex items-center gap-2">
                                            <Save size={14} /> 전체 저장
                                        </button>
                                    </div>
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
                                                placeholder="지문 내용을 여기에 붙여넣으세요 (English Text Only)..."
                                                value={p.content}
                                                onChange={(e) => updateSlot(p.id, 'content', e.target.value)}
                                            />

                                            <div className="mt-2 flex justify-between items-center">
                                                <div className="text-xs text-stone-500">
                                                    {p.content.trim() ? p.content.trim().split(/\s+/).length : 0} words
                                                </div>
                                                {activeInputId === p.id && (
                                                    <div className="text-xs text-babel-gold animate-pulse font-bold flex items-center gap-1">
                                                        Editing <ChevronRight size={12} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right Pane: Analysis & Edit */}
                            <div className="w-1/2 bg-black/80 p-6 overflow-y-auto flex flex-col border-l border-white/5">
                                <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10 sticky top-0 bg-black/95 z-10 backdrop-blur-sm">
                                    <h2 className="text-xl text-white font-bold flex items-center gap-2">
                                        <Brain size={18} className="text-babel-gold" />
                                        AI 분석 결과 (AI Analysis)
                                    </h2>
                                    <button
                                        onClick={runAIStats}
                                        className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-babel-gold hover:text-white border border-babel-gold/30 rounded text-sm transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.1)]"
                                    >
                                        <Brain size={14} /> 현재 지문 분석 실행
                                    </button>
                                </div>

                                <div className="flex-1 space-y-4">
                                    {analyzedData[activeInputId] ? (
                                        <>
                                            <div className="p-3 bg-blue-900/20 border border-blue-500/20 rounded text-blue-300 text-xs flex items-start gap-2">
                                                <span>💡</span>
                                                <span>
                                                    AI가 분석한 어휘 정보입니다.
                                                    불필요한 단어는 <Trash2 size={10} className="inline" /> 버튼으로 삭제하고,
                                                    뜻이나 유의어/반의어가 부정확하면 직접 수정해주세요.
                                                    "전체 저장" 시 이 내용이 최종 저장됩니다.
                                                </span>
                                            </div>

                                            {analyzedData[activeInputId].map((word, idx) => (
                                                <div key={idx} className="bg-stone-900 p-4 rounded-xl border border-white/5 group hover:border-babel-gold/30 transition-all relative">

                                                    {/* Header: Word & Phonetic & POS */}
                                                    <div className="flex justify-between items-start mb-3 border-b border-white/5 pb-2">
                                                        <div className="flex items-end gap-3">
                                                            <input
                                                                className="bg-transparent font-bold text-babel-gold text-xl outline-none w-32"
                                                                value={word.word}
                                                                onChange={(e) => updateAnalyzedWord(activeInputId, idx, { word: e.target.value })}
                                                            />
                                                            <input
                                                                className="bg-transparent text-stone-500 text-xs font-mono outline-none w-24 mb-1"
                                                                value={word.phonetic}
                                                                placeholder="/IPA/"
                                                                onChange={(e) => updateAnalyzedWord(activeInputId, idx, { phonetic: e.target.value })}
                                                            />
                                                            <input
                                                                className="bg-stone-800 text-stone-300 text-[10px] px-1.5 py-0.5 rounded outline-none w-12 text-center mb-1"
                                                                value={word.part_of_speech}
                                                                placeholder="POS"
                                                                onChange={(e) => updateAnalyzedWord(activeInputId, idx, { part_of_speech: e.target.value })}
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => removeAnalyzedWord(activeInputId, idx)}
                                                            className="text-stone-600 hover:text-red-400 p-1 hover:bg-red-900/20 rounded transition-colors"
                                                            title="단어 삭제"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>

                                                    {/* Meanings (KR) */}
                                                    <div className="mb-3 space-y-1">
                                                        <label className="text-[10px] uppercase text-stone-600 font-bold block">Meanings (KR)</label>
                                                        <div className="flex gap-2">
                                                            {[0, 1, 2].map(i => (
                                                                <input
                                                                    key={i}
                                                                    className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-stone-300 outline-none focus:border-babel-gold/50"
                                                                    placeholder={`뜻 ${i + 1}`}
                                                                    value={word.meanings_kr?.[i] || ''}
                                                                    onChange={(e) => {
                                                                        const newMeanings = [...(word.meanings_kr || [])];
                                                                        newMeanings[i] = e.target.value;
                                                                        updateAnalyzedWord(activeInputId, idx, { meanings_kr: newMeanings });
                                                                    }}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Synonyms & Antonyms */}
                                                    <div className="grid grid-cols-2 gap-4 mb-3">
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] uppercase text-stone-600 font-bold block">Synonyms (유의어)</label>
                                                            <div className="space-y-1">
                                                                {[0, 1, 2].map(i => (
                                                                    <input
                                                                        key={i}
                                                                        className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-[11px] text-stone-400 outline-none focus:border-babel-gold/50"
                                                                        placeholder={`Syn ${i + 1}`}
                                                                        value={word.synonyms?.[i] || ''}
                                                                        onChange={(e) => {
                                                                            const newSyns = [...(word.synonyms || [])];
                                                                            newSyns[i] = e.target.value;
                                                                            updateAnalyzedWord(activeInputId, idx, { synonyms: newSyns });
                                                                        }}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] uppercase text-stone-600 font-bold block">Antonyms (반의어)</label>
                                                            <div className="space-y-1">
                                                                {[0, 1, 2].map(i => (
                                                                    <input
                                                                        key={i}
                                                                        className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-[11px] text-stone-400 outline-none focus:border-babel-gold/50"
                                                                        placeholder={`Ant ${i + 1}`}
                                                                        value={word.antonyms?.[i] || ''}
                                                                        onChange={(e) => {
                                                                            const newAnts = [...(word.antonyms || [])];
                                                                            newAnts[i] = e.target.value;
                                                                            updateAnalyzedWord(activeInputId, idx, { antonyms: newAnts });
                                                                        }}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Example Variations */}
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] uppercase text-stone-600 font-bold block">Example Variation (예문)</label>
                                                        <textarea
                                                            className="w-full bg-black/40 border border-white/10 rounded px-2 py-2 text-xs text-stone-400 outline-none focus:border-babel-gold/50 h-16 resize-none leading-relaxed"
                                                            placeholder="예문 입력..."
                                                            value={word.example_variations?.[0] || ''}
                                                            onChange={(e) => {
                                                                // Simplified to 1 main example for layout sanity, though data structure supports array
                                                                updateAnalyzedWord(activeInputId, idx, { example_variations: [e.target.value] });
                                                            }}
                                                        />
                                                    </div>

                                                </div>
                                            ))}

                                            <div className="h-20"></div> {/* Bottom Padding */}
                                        </>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-stone-600 space-y-4">
                                            <Brain size={48} className="opacity-10" />
                                            <p className="text-sm">왼쪽에서 지문을 선택하고 <br />상단의 <span className="text-babel-gold">"분석 실행"</span>을 눌러주세요.</p>
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
