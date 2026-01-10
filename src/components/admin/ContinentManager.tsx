import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { extractWordsFromText, type RichWord } from '../../services/ai/extractionService';
import { ArrowLeft, Save, Plus, Brain, CheckSquare, Trash2, Layers, Check } from 'lucide-react';
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

interface ContinentManagerProps {
    continent: Continent;
    onClose: () => void;
}

export const ContinentManager: React.FC<ContinentManagerProps> = ({ continent, onClose }) => {
    // View State
    const [view, setView] = useState<'list' | 'add'>('list');
    const [passages, setPassages] = useState<Passage[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Distribution State
    const [isDistributing, setIsDistributing] = useState(false);

    // Bulk Add State
    const [newPassages, setNewPassages] = useState<{ id: string, title: string, content: string }[]>([
        { id: 'new-1', title: 'Passage 1', content: '' }
    ]);

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
        setNewPassages(prev => [...prev, {
            id: `new-${Date.now()}`,
            title: `Passage ${prev.length + 1}`,
            content: ''
        }]);
    };

    const removeSlot = (id: string) => {
        setNewPassages(prev => prev.filter(p => p.id !== id));
    };

    const updateSlot = (id: string, field: 'title' | 'content', value: string) => {
        setNewPassages(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handleBulkSave = async () => {
        // 1. Filter empty
        const valid = newPassages.filter(p => p.content.trim().length > 0);
        if (valid.length === 0) return alert("No content to save.");

        // 2. Prepare Inserts
        const payload = valid.map(p => ({
            continent_id: continent.id,
            title: p.title,
            content: p.content,
            word_count: p.content.trim().split(/\s+/).length,
            words_data: [] // Empty until AI analyzed
        }));

        // 3. Insert
        const { error } = await supabase.from('passages').insert(payload);

        if (error) {
            console.error(error);
            alert("Failed to save passages.");
        } else {
            alert(`Saved ${valid.length} passages.`);
            setNewPassages([{ id: 'new-1', title: 'Passage 1', content: '' }]);
            setView('list');
            fetchPassages();
        }
    };

    // --- AI Analysis Logic ---
    const analyzePassage = async (passage: Passage) => {
        if (!confirm(`Analyze "${passage.title}" with AI?`)) return;

        // 1. Loading State (Optimistic)
        // In real app, show spinner on specific row

        // 2. Call Service
        try {
            const richWords = await extractWordsFromText(passage.content);

            // 3. Update DB
            const { error } = await supabase
                .from('passages')
                .update({
                    words_data: richWords,
                    word_count: richWords.length // Update exact count based on extraction
                })
                .eq('id', passage.id);

            if (error) throw error;

            alert(`Analysis Complete: Extracted ${richWords.length} words.`);
            fetchPassages();

        } catch (e) {
            console.error(e);
            alert("AI Analysis Failed.");
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
        <div className="fixed inset-0 z-40 bg-obsidian flex flex-col animate-in fade-in duration-300">
            {/* Header */}
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-stone-900">
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
                        <Layers size={16} /> Distribute Selected ({selectedIds.length})
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden flex">
                {/* Sidebar / Navigation */}
                <div className="w-64 border-r border-white/10 bg-black/20 p-4 space-y-2">
                    <button
                        onClick={() => setView('list')}
                        className={`w-full text-left px-4 py-3 rounded flex items-center gap-3 transition-colors ${view === 'list' ? 'bg-babel-gold/10 text-babel-gold border border-babel-gold/30' : 'text-stone-400 hover:bg-white/5'}`}
                    >
                        <CheckSquare size={16} /> Passage Library
                    </button>
                    <button
                        onClick={() => setView('add')}
                        className={`w-full text-left px-4 py-3 rounded flex items-center gap-3 transition-colors ${view === 'add' ? 'bg-babel-gold/10 text-babel-gold border border-babel-gold/30' : 'text-stone-400 hover:bg-white/5'}`}
                    >
                        <Plus size={16} /> Add New Passages
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto bg-stone-900/50 p-8">
                    {/* View: Passage List */}
                    {view === 'list' && (
                        <div className="max-w-5xl mx-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl text-white font-serif">Library Content</h2>
                                <div className="flex gap-2 text-xs">
                                    <button onClick={toggleSelectAll} className="px-3 py-1 border border-white/20 rounded hover:bg-white/10 text-stone-300">
                                        Select All
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {passages.length === 0 && (
                                    <div className="text-center py-20 text-stone-500 border border-dashed border-white/10 rounded-xl">
                                        No passages found. Click "Add New Passages" to start.
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
                                                    <div className="text-[10px] text-stone-600">Raw Count</div>
                                                </div>

                                                <button
                                                    onClick={() => analyzePassage(p)}
                                                    className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-colors ${isAnalyzed ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-stone-700 text-stone-300 hover:bg-babel-gold hover:text-black'
                                                        }`}
                                                >
                                                    <Brain size={12} />
                                                    {isAnalyzed ? 'Analyzed' : 'AI Analyze'}
                                                </button>

                                                <button className="text-stone-600 hover:text-red-400">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* View: Add Passages */}
                    {view === 'add' && (
                        <div className="max-w-4xl mx-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl text-white font-serif">Bulk Passage Entry</h2>
                                <div className="flex gap-2">
                                    <button onClick={addSlot} className="px-4 py-2 border border-white/20 rounded hover:bg-white/10 text-stone-300 flex items-center gap-2">
                                        <Plus size={16} /> Add Slot
                                    </button>
                                    <button onClick={handleBulkSave} className="px-6 py-2 bg-babel-gold text-black font-bold rounded hover:bg-yellow-500 flex items-center gap-2">
                                        <Save size={16} /> Save to Library
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {newPassages.map((p, idx) => (
                                    <div key={p.id} className="bg-stone-800 border border-white/5 rounded-xl p-4 slide-in-bottom">
                                        <div className="flex justify-between items-center mb-3">
                                            <input
                                                className="bg-transparent text-lg font-bold text-white placeholder-stone-600 outline-none w-full"
                                                placeholder={`Pasage Title (e.g., Chapter ${idx + 1})`}
                                                value={p.title}
                                                onChange={(e) => updateSlot(p.id, 'title', e.target.value)}
                                            />
                                            <button onClick={() => removeSlot(p.id)} className="text-stone-600 hover:text-red-400">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <textarea
                                            className="w-full h-40 bg-black/40 border border-white/10 rounded-lg p-3 text-stone-300 text-sm font-mono focus:border-babel-gold/50 outline-none resize-none"
                                            placeholder="Paste English text here..."
                                            value={p.content}
                                            onChange={(e) => updateSlot(p.id, 'content', e.target.value)}
                                        />
                                        <div className="mt-2 text-right text-xs text-stone-500">
                                            {p.content.trim() ? p.content.trim().split(/\s+/).length : 0} words approx.
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
