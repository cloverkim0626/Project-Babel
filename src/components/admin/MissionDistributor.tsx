import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Target, Check, BarChart2, Layers, BookOpen, ChevronRight, ChevronDown, Sparkles, Trash2, Globe, Filter } from 'lucide-react';
import type { RichWord } from '../../services/ai/extractionService';

interface Continent {
    id: string;
    display_name: string;
    name: string;
    theme_color: string;
}

interface Passage {
    id: string;
    continent_id: string;
    title: string;
    word_count: number;
    words_data: RichWord[];
}

interface DistributionWord extends RichWord {
    _sourceId: string;
    _sourceTitle: string;
}

interface MissionDistributorProps {
    onClose: () => void;
}

export const MissionDistributor: React.FC<MissionDistributorProps> = ({ onClose }) => {
    // --- State: Data ---
    const [projects, setProjects] = useState<Continent[]>([]);
    const [passagesMap, setPassagesMap] = useState<Record<string, Passage[]>>({});
    const [loadingProjects, setLoadingProjects] = useState(true);

    // --- State: Selection ---
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
    const [selectedPassageIds, setSelectedPassageIds] = useState<Set<string>>(new Set());

    // --- State: Words Output ---
    const [generatedWords, setGeneratedWords] = useState<DistributionWord[]>([]);
    const [isWordListReady, setIsWordListReady] = useState(false);

    // --- State: Config ---
    const [durationWeeks, setDurationWeeks] = useState(4);
    const [wordsPerSeq, setWordsPerSeq] = useState(20);
    const [pointsPerSeq] = useState(10);
    const [missionTitle, setMissionTitle] = useState('New Vocabulary Mission');

    // --- State: Students ---
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [lastSelectedStudentIndex, setLastSelectedStudentIndex] = useState<number | null>(null);

    // Mock Users
    const mockUsers = useMemo(() => Array.from({ length: 15 }, (_, i) => ({ id: `user-${i + 1}`, name: `Student ${i + 1}` })), []);

    // --- Effects ---
    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        const { data } = await supabase.from('continents').select('*').order('created_at', { ascending: false });
        if (data) setProjects(data);
        setLoadingProjects(false);
    };

    const toggleProjectExpand = async (projectId: string) => {
        const newSet = new Set(expandedProjects);
        if (newSet.has(projectId)) {
            newSet.delete(projectId);
        } else {
            newSet.add(projectId);
            // Lazy Load Passages if not present
            if (!passagesMap[projectId]) {
                const { data } = await supabase.from('passages').select('*').eq('continent_id', projectId).order('title', { ascending: true });
                if (data) {
                    setPassagesMap(prev => ({ ...prev, [projectId]: data }));
                }
            }
        }
        setExpandedProjects(newSet);
    };

    // --- Selection Logic ---
    const togglePassageSelection = (passageId: string) => {
        const newSet = new Set(selectedPassageIds);
        if (newSet.has(passageId)) newSet.delete(passageId);
        else newSet.add(passageId);
        setSelectedPassageIds(newSet);
        setIsWordListReady(false); // Invalidate word list if selection changes
    };

    const toggleProjectSelection = (projectId: string, selectAll: boolean) => {
        const projectPassages = passagesMap[projectId] || [];
        const newSet = new Set(selectedPassageIds);
        projectPassages.forEach(p => {
            if (selectAll) newSet.add(p.id);
            else newSet.delete(p.id);
        });
        setSelectedPassageIds(newSet);
        setIsWordListReady(false);
    };

    const printWords = () => {
        const allWords: DistributionWord[] = [];

        // Iterate over all loaded projects to find selected passages
        Object.values(passagesMap).forEach(passageList => {
            passageList.forEach(p => {
                if (selectedPassageIds.has(p.id) && p.words_data) {
                    // Map generic words to DistributionWords with source context
                    const pWords = p.words_data.map(w => ({
                        ...w,
                        _sourceId: p.id,
                        _sourceTitle: p.title
                    }));
                    allWords.push(...pWords);
                }
            });
        });

        // Optional: Remove duplicates logic could go here, but usually context matters for vocabs
        setGeneratedWords(allWords);
        setIsWordListReady(true);
    };

    const removeWord = (index: number) => {
        setGeneratedWords(prev => prev.filter((_, i) => i !== index));
    };

    // --- Student Selection (Shift Click) ---
    const handleStudentClick = (index: number, e: React.MouseEvent) => {
        const userId = mockUsers[index].id;
        let newSelection = [...selectedStudents];

        if (e.shiftKey && lastSelectedStudentIndex !== null) {
            const start = Math.min(lastSelectedStudentIndex, index);
            const end = Math.max(lastSelectedStudentIndex, index);
            const rangeIds = mockUsers.slice(start, end + 1).map(u => u.id);

            // Add all in range if not present
            rangeIds.forEach(id => {
                if (!newSelection.includes(id)) newSelection.push(id);
            });
        } else {
            if (newSelection.includes(userId)) {
                newSelection = newSelection.filter(id => id !== userId);
            } else {
                newSelection.push(userId);
            }
        }

        setSelectedStudents(newSelection);
        setLastSelectedStudentIndex(index);
    };

    const toggleAllStudents = () => {
        if (selectedStudents.length === mockUsers.length) setSelectedStudents([]);
        else setSelectedStudents(mockUsers.map(u => u.id));
    };

    // --- Distribution Preview ---
    const totalWords = generatedWords.length;
    const totalSequences = Math.ceil(totalWords / wordsPerSeq);

    // Simple Weekly Schedule Calculation
    const schedule = useMemo(() => {
        if (totalSequences === 0) return [];
        const base = Math.floor(totalSequences / durationWeeks);
        const remainder = totalSequences % durationWeeks;
        const res = [];
        let cursor = 0;
        for (let i = 1; i <= durationWeeks; i++) {
            const count = base + (i <= remainder ? 1 : 0);
            res.push({ week: i, count, start: cursor + 1, end: cursor + count });
            cursor += count;
        }
        return res;
    }, [totalSequences, durationWeeks]);

    const handleDeploy = async () => {
        if (selectedStudents.length === 0 || totalWords === 0) return;
        if (!confirm(`Deploy mission "${missionTitle}" to ${selectedStudents.length} students?\n(${totalWords} words)`)) return;

        try {
            // 1. Create Mission
            const { data: mission, error } = await supabase.from('missions').insert({
                title: missionTitle,
                category: 'vocabulary', // New Category
                total_sets: totalSequences,
                data_payload: {
                    type: 'vocabulary_dist',
                    words: generatedWords, // The filtered list
                    source_passages: Array.from(selectedPassageIds)
                },
                config: {
                    duration_weeks: durationWeeks,
                    split_size: wordsPerSeq,
                    points_award: pointsPerSeq
                },
                created_by: 'admin' // simpler for now
            }).select().single();

            if (error) throw error;

            // 2. Assign to Students
            const tasks = selectedStudents.flatMap(uid => {
                const userTasks: any[] = [];
                schedule.forEach(sch => {
                    for (let s = sch.start; s <= sch.end; s++) {
                        userTasks.push({
                            user_id: uid,
                            mission_id: mission.id,
                            set_index: s,
                            week_number: sch.week,
                            status: s === 1 ? 'open' : 'locked',
                            score: 0
                        });
                    }
                });
                return userTasks;
            });

            // Batched insert might be too big, chunk it in production. For now directly:
            const { error: assignError } = await supabase.from('quest_sets').insert(tasks);
            if (assignError) throw assignError;

            alert("Mission Deployed Successfully!");
            onClose();

        } catch (e: any) {
            alert("Deployment Failed: " + e.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="bg-stone-900 border border-white/10 rounded-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden shadow-2xl relative">

                {/* Header */}
                <div className="p-5 border-b border-white/10 flex justify-between items-center bg-black/50">
                    <div>
                        <h2 className="text-2xl font-serif text-babel-gold flex items-center gap-3">
                            <Layers className="text-white" /> Mission Deployment Center
                        </h2>
                        <p className="text-xs text-stone-500 mt-1">Select passages, extract vocabulary, and distribute to students.</p>
                    </div>
                    <button onClick={onClose} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white transition-colors">
                        Close
                    </button>
                </div>

                <div className="flex-1 overflow-hidden grid grid-cols-12 divide-x divide-white/10">

                    {/* LEFT: Project & Passage Selector */}
                    <div className="col-span-3 flex flex-col bg-black/20">
                        <div className="p-4 border-b border-white/5 bg-stone-900/50">
                            <h3 className="text-xs font-bold text-stone-500 uppercase flex items-center gap-2">
                                <Globe size={14} /> Source Library
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {loadingProjects ? <div className="text-center p-4 text-stone-600">Loading...</div> : projects.map(proj => (
                                <div key={proj.id} className="border border-white/5 rounded-lg overflow-hidden bg-stone-800/20">
                                    <div
                                        onClick={() => toggleProjectExpand(proj.id)}
                                        className="p-3 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            {expandedProjects.has(proj.id) ? <ChevronDown size={16} className="text-babel-gold" /> : <ChevronRight size={16} className="text-stone-500" />}
                                            <span className="text-sm font-bold text-stone-300">{proj.display_name}</span>
                                        </div>
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: proj.theme_color }} />
                                    </div>

                                    {/* Expanded Passages */}
                                    {expandedProjects.has(proj.id) && (
                                        <div className="bg-black/30 border-t border-white/5 p-2 space-y-1">
                                            {/* Select All Actions */}
                                            <div className="flex justify-end gap-2 px-2 py-1 mb-2">
                                                <button onClick={() => toggleProjectSelection(proj.id, true)} className="text-[10px] text-babel-gold hover:underline">Select All</button>
                                                <button onClick={() => toggleProjectSelection(proj.id, false)} className="text-[10px] text-stone-500 hover:underline">None</button>
                                            </div>

                                            {passagesMap[proj.id] ? passagesMap[proj.id].map(p => (
                                                <div key={p.id} className="flex items-start gap-2 p-2 rounded hover:bg-white/5 group">
                                                    <div className="pt-0.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedPassageIds.has(p.id)}
                                                            onChange={() => togglePassageSelection(p.id)}
                                                            className="accent-babel-gold cursor-pointer"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-xs text-stone-300 group-hover:text-white transition-colors">{p.title}</div>
                                                        <div className="text-[10px] text-stone-600">{p.word_count} words • {(p.words_data?.length || 0)} analyzed</div>
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="text-center py-4 text-xs text-stone-600">Loading Passages...</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* MIDDLE: Configuration & Students */}
                    <div className="col-span-5 flex flex-col bg-stone-900/50">
                        <div className="p-4 border-b border-white/5 bg-stone-900/50">
                            <h3 className="text-xs font-bold text-stone-500 uppercase flex items-center gap-2">
                                <Target size={14} /> Mission Configuration
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">

                            {/* Basics */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs uppercase text-stone-500 mb-1">Mission Title</label>
                                    <input
                                        value={missionTitle} onChange={e => setMissionTitle(e.target.value)}
                                        className="w-full bg-black border border-white/10 rounded p-3 text-white focus:border-babel-gold outline-none font-bold"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs uppercase text-stone-500 mb-1">Duration (Weeks)</label>
                                        <div className="flex items-center gap-3 bg-black border border-white/10 rounded p-2">
                                            <input type="range" min="1" max="12" value={durationWeeks} onChange={e => setDurationWeeks(Number(e.target.value))} className="flex-1 accent-babel-gold" />
                                            <span className="text-babel-gold font-bold w-6">{durationWeeks}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase text-stone-500 mb-1">Words / Seq</label>
                                        <input type="number" value={wordsPerSeq} onChange={e => setWordsPerSeq(Number(e.target.value))} className="w-full bg-black border border-white/10 p-2 rounded text-white text-right" />
                                    </div>
                                </div>
                            </div>

                            {/* Students */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <label className="text-xs uppercase text-stone-500 flex items-center gap-2"><Users size={12} /> Target Students ({selectedStudents.length})</label>
                                    <button onClick={toggleAllStudents} className="text-[10px] text-babel-gold hover:underline">Toggle All</button>
                                </div>
                                <div className="h-64 border border-white/10 rounded-lg bg-black/60 overflow-y-auto p-1 select-none">
                                    {mockUsers.map((u, i) => (
                                        <div
                                            key={u.id}
                                            onClick={(e) => handleStudentClick(i, e)}
                                            className={`p-2 rounded text-sm cursor-pointer flex justify-between items-center mb-0.5 ${selectedStudents.includes(u.id) ? 'bg-babel-gold/20 text-babel-gold border border-babel-gold/30' : 'text-stone-400 hover:bg-white/5 border border-transparent'}`}
                                        >
                                            <span>{u.name}</span>
                                            {selectedStudents.includes(u.id) && <Check size={14} />}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-stone-600 text-right">* Hold Shift to select range</p>
                            </div>

                            {/* Preview */}
                            <div className="bg-stone-800/30 border border-white/5 p-4 rounded-xl">
                                <h4 className="text-xs font-bold text-white mb-4 flex items-center gap-2"><BarChart2 size={12} /> Schedule Preview</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] text-stone-500 uppercase border-b border-white/5 pb-1">
                                        <span>Week</span>
                                        <span>Items</span>
                                        <span>Reward</span>
                                    </div>
                                    {schedule.map(s => (
                                        <div key={s.week} className="flex justify-between text-xs text-stone-300 py-1">
                                            <span className="font-mono text-babel-gold">Week {s.week}</span>
                                            <span>{s.count} Sets (Words: ~{s.count * wordsPerSeq})</span>
                                            <span className="text-stone-500">{s.count * pointsPerSeq} pts</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Word Output */}
                    <div className="col-span-4 flex flex-col bg-black/40">
                        <div className="p-4 border-b border-white/5 bg-stone-900/50 flex justify-between items-center">
                            <h3 className="text-xs font-bold text-stone-500 uppercase flex items-center gap-2">
                                <BookOpen size={14} /> Word List ({generatedWords.length})
                            </h3>
                            {isWordListReady && <button onClick={() => setGeneratedWords([])} className="text-stone-500 hover:text-red-400"><Trash2 size={16} /></button>}
                        </div>

                        <div className="flex-1 overflow-y-auto flex flex-col relative">
                            {!isWordListReady ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-black/50 backdrop-blur-sm z-10">
                                    <div className="w-16 h-16 rounded-full bg-stone-800 flex items-center justify-center mb-4">
                                        <Filter size={24} className="text-babel-gold opacity-50" />
                                    </div>
                                    <h4 className="text-white font-serif text-lg mb-2">Ready to Extract</h4>
                                    <p className="text-sm text-stone-500 mb-6 max-w-xs">
                                        Selected {selectedPassageIds.size} passages.<br />
                                        Click below to generate the vocabulary list.
                                    </p>
                                    <button
                                        onClick={printWords}
                                        disabled={selectedPassageIds.size === 0}
                                        className="bg-babel-gold text-black px-6 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
                                    >
                                        <Sparkles size={18} /> Print Words From DB
                                    </button>
                                </div>
                            ) : (
                                <div className="p-4 space-y-2">
                                    {generatedWords.map((w, idx) => (
                                        <div key={idx} className="bg-stone-900 border border-white/5 p-3 rounded flex gap-3 group hover:border-babel-gold/30 transition-colors">
                                            <div className="text-[10px] font-mono text-stone-600 pt-1 w-6 text-right">{idx + 1}</div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-white font-bold">{w.word}</span>
                                                    <span className="text-xs text-stone-500">{w.phonetic}</span>
                                                </div>
                                                <div className="text-xs text-stone-400 mt-0.5 truncate">{w.meanings_kr.join(', ')}</div>
                                                <div className="text-[10px] text-stone-600 mt-1 flex items-center gap-1">
                                                    <span className="bg-stone-800 px-1 rounded text-stone-500">Source: {w._sourceTitle}</span>
                                                </div>
                                            </div>
                                            <button onClick={() => removeWord(idx)} className="opacity-0 group-hover:opacity-100 text-stone-600 hover:text-red-400 self-start p-1 transition-opacity">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {generatedWords.length === 0 && (
                                        <div className="text-center py-8 text-stone-500 text-sm">No words found in selected passages.</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer Action */}
                        <div className="p-4 border-t border-white/10 bg-stone-900/80 backdrop-blur">
                            <button
                                onClick={handleDeploy}
                                disabled={!isWordListReady || generatedWords.length === 0 || selectedStudents.length === 0}
                                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3 transition-colors"
                            >
                                <Target size={20} />
                                Start Distribution
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
