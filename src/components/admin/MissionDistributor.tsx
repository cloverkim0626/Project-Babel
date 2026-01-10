import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Target, Check, BarChart2, Layers, BookOpen, ChevronRight, ChevronDown, Sparkles, Trash2, Globe, Filter, AlertCircle, Scroll, Crown } from 'lucide-react';
import type { RichWord } from '../../services/ai/extractionService';

// --- Styling & Aesthetic ---
// Integrating a premium serif font for the "Library of Babel" feel
const LIBRARY_STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Noto+Serif+KR:wght@300;400;600&display=swap');

.font-library { font-family: 'Cinzel', serif; }
.font-body { font-family: 'Noto Serif KR', serif; }
.text-gold-glow { text-shadow: 0 0 10px rgba(212, 175, 55, 0.5); }
.border-gold-glow { box-shadow: 0 0 15px rgba(212, 175, 55, 0.2); }
.bg-mystery { background: radial-gradient(circle at center, #1c1917 0%, #0c0a09 100%); }
`;

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
    const [loadingPassages, setLoadingPassages] = useState<Set<string>>(new Set());

    // --- State: Selection ---
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
    const [selectedPassageIds, setSelectedPassageIds] = useState<Set<string>>(new Set());

    // --- State: Words Output ---
    const [generatedWords, setGeneratedWords] = useState<DistributionWord[]>([]);
    const [isWordListReady, setIsWordListReady] = useState(false);

    // --- State: Config ---
    const [durationWeeks, setDurationWeeks] = useState(4);
    const [wordsPerSeq, setWordsPerSeq] = useState(20);
    const [pointsPerSeq, setPointsPerSeq] = useState(10);
    const [missionTitle, setMissionTitle] = useState('새로운 탐험 (New Expedition)');

    // --- State: Students ---
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [lastSelectedStudentIndex, setLastSelectedStudentIndex] = useState<number | null>(null);

    // Mock Users - Sorted Alphabetically
    const mockUsers = useMemo(() => {
        const users = Array.from({ length: 15 }, (_, i) => ({ id: `user-${i + 1}`, name: `학생 ${String.fromCharCode(65 + i)} (Student ${i + 1})` }));
        return users.sort((a, b) => a.name.localeCompare(b.name));
    }, []);

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
            // Always fetch to ensure fresh data (Fixing the "not showing" bug)
            // Mark as loading
            setLoadingPassages(prev => new Set(prev).add(projectId));

            try {
                const { data, error } = await supabase
                    .from('passages')
                    .select('*')
                    .eq('continent_id', projectId)
                    .order('title', { ascending: true });

                if (error) throw error;

                // Debug log
                console.log(`Loaded ${data?.length} passages for project ${projectId}`);

                setPassagesMap(prev => ({ ...prev, [projectId]: data || [] }));
            } catch (e) {
                console.error("Failed to load passages:", e);
                // Keep previous data if failed, or set empty? Safe to keep prev or empty.
            } finally {
                setLoadingPassages(prev => {
                    const next = new Set(prev);
                    next.delete(projectId);
                    return next;
                });
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

        Object.values(passagesMap).forEach(passageList => {
            passageList.forEach(p => {
                if (selectedPassageIds.has(p.id) && p.words_data) {
                    const pWords = p.words_data.map(w => ({
                        ...w,
                        _sourceId: p.id,
                        _sourceTitle: p.title
                    }));
                    allWords.push(...pWords);
                }
            });
        });

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

            const set = new Set(newSelection);
            rangeIds.forEach(id => set.add(id));
            newSelection = Array.from(set);
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
    // If no words extracted, we just assign passages. Sequences might not be calculable yet, or just 1?
    // User strategy: Assign first, choose test type later. 
    // If words are present, we use them. If not, we assume 1 "set" per passage or just 1 placeholder set.
    const totalSequences = totalWords > 0
        ? Math.ceil(totalWords / wordsPerSeq)
        : selectedPassageIds.size; // Fallback: 1 set per passage if no words extracted? Or just 1 set total? Let's say 1.

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
        if (selectedStudents.length === 0) return;
        if (selectedPassageIds.size === 0) return; // Must select at least one passage

        const isWordDist = totalWords > 0;
        const deployType = isWordDist ? 'vocabulary_dist' : 'passage_assignment';

        const confirmMsg = isWordDist
            ? `'${missionTitle}' 미션(단어 ${totalWords}개)을 ${selectedStudents.length}명에게 배포하시겠습니까?`
            : `'${missionTitle}' 미션(지문 ${selectedPassageIds.size}개)을 ${selectedStudents.length}명에게 배포하시겠습니까?\n(단어 미추출 - 지문 할당 모드)`;

        if (!confirm(confirmMsg)) return;

        try {
            // 1. Create Mission
            const { data: mission, error } = await supabase.from('missions').insert({
                title: missionTitle,
                category: isWordDist ? 'vocabulary' : 'reading',
                total_sets: totalSequences,
                data_payload: {
                    type: deployType,
                    words: generatedWords, // Might be empty
                    source_passages: Array.from(selectedPassageIds)
                },
                config: {
                    duration_weeks: durationWeeks,
                    split_size: wordsPerSeq,
                    points_award: pointsPerSeq
                },
                created_by: 'admin'
            }).select().single();

            if (error) throw error;

            // 2. Assign to Students
            const tasks = selectedStudents.flatMap(uid => {
                const userTasks: any[] = [];
                // If schedule exists, use it. If not (e.g. 0 seq), create 1 placeholder?
                // Logic above guarantees totalSequences >= 1 if passages > 0
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

            const { error: assignError } = await supabase.from('quest_sets').insert(tasks);
            if (assignError) throw assignError;

            alert("배포가 완료되었습니다! (Deployment Success)");
            onClose();

        } catch (e: any) {
            alert("배포 실패 (Error): " + e.message);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <style>{LIBRARY_STYLE}</style>

            {/* Backdrop with Blur & Mystery Overlay */}
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-30 pointer-events-none" />

            <div className="relative bg-stone-950 border border-babel-gold/30 rounded-lg w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden shadow-[0_0_100px_rgba(212,175,55,0.15)] font-body">

                {/* Header */}
                <div className="p-6 border-b border-babel-gold/20 flex justify-between items-center bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950">
                    <div>
                        <h2 className="text-3xl font-library text-babel-gold text-gold-glow flex items-center gap-3">
                            <Crown className="text-babel-gold fill-babel-gold/20" size={28} />
                            THE LIBRARY OF BABEL
                        </h2>
                        <p className="text-xs text-stone-500 mt-1 font-library tracking-[0.2em] uppercase">Mission Command Center</p>
                    </div>
                    <button onClick={onClose} className="px-6 py-2 rounded border border-white/5 hover:border-babel-gold/50 text-stone-500 hover:text-babel-gold transition-all duration-300 font-library uppercase text-xs tracking-widest">
                        Close
                    </button>
                </div>

                <div className="flex-1 overflow-hidden grid grid-cols-12 divide-x divide-babel-gold/10">

                    {/* LEFT: Project & Passage Selector */}
                    <div className="col-span-3 flex flex-col bg-stone-950/50">
                        <div className="p-4 border-b border-babel-gold/10 bg-black/20">
                            <h3 className="text-xs font-bold text-babel-gold/70 uppercase flex items-center gap-2 tracking-[0.2em] font-library">
                                <Globe size={12} /> Source Archives
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {loadingProjects ? <div className="text-center p-8 text-stone-600 font-library animate-pulse">Accessing Archives...</div> : projects.map(proj => (
                                <div key={proj.id} className="border border-white/5 rounded overflow-hidden bg-stone-900/40 transition-all hover:border-babel-gold/30 group">
                                    <div
                                        onClick={() => toggleProjectExpand(proj.id)}
                                        className="p-3 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            {expandedProjects.has(proj.id) ? <ChevronDown size={14} className="text-babel-gold" /> : <ChevronRight size={14} className="text-stone-600 group-hover:text-babel-gold transition-colors" />}
                                            <span className={`text-sm font-bold transition-all ${expandedProjects.has(proj.id) ? 'text-babel-gold' : 'text-stone-400 group-hover:text-stone-200'}`}>{proj.display_name}</span>
                                        </div>
                                        {/* <div className="w-1 h-1 rounded-full bg-babel-gold/50 box-shadow-glow" /> */}
                                    </div>

                                    {/* Expanded Passages */}
                                    {expandedProjects.has(proj.id) && (
                                        <div className="bg-black/40 border-t border-white/5 p-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                            {/* Select All Actions */}
                                            <div className="flex justify-end gap-3 px-2 py-2 mb-2 border-b border-white/5">
                                                <button onClick={() => toggleProjectSelection(proj.id, true)} className="text-[10px] text-babel-gold hover:text-white transition-colors font-library tracking-wider">ALL</button>
                                                <button onClick={() => toggleProjectSelection(proj.id, false)} className="text-[10px] text-stone-600 hover:text-stone-400 transition-colors font-library tracking-wider">NONE</button>
                                            </div>

                                            {loadingPassages.has(proj.id) ? (
                                                <div className="text-center py-6 text-xs text-babel-gold/50 font-library animate-pulse flex items-center justify-center gap-2">
                                                    <Scroll size={12} /> Retrieving Scrolls...
                                                </div>
                                            ) : (passagesMap[proj.id] && passagesMap[proj.id].length > 0) ? passagesMap[proj.id].map(p => (
                                                <div key={p.id} className="flex items-start gap-3 p-2 rounded hover:bg-white/5 group transition-all duration-300 border border-transparent hover:border-white/5">
                                                    <div className="pt-0.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedPassageIds.has(p.id)}
                                                            onChange={() => togglePassageSelection(p.id)}
                                                            className="accent-babel-gold cursor-pointer w-3 h-3 border-babel-gold/50 rounded-sm bg-transparent"
                                                        />
                                                    </div>
                                                    <div className="flex-1 cursor-pointer" onClick={() => togglePassageSelection(p.id)}>
                                                        <div className={`text-xs transition-colors font-serif ${selectedPassageIds.has(p.id) ? 'text-babel-gold' : 'text-stone-400 group-hover:text-stone-200'}`}>{p.title}</div>
                                                        <div className="text-[10px] text-stone-700 mt-0.5 font-library">{p.word_count} words</div>
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="text-center py-6 text-[10px] text-stone-700 font-library italic">
                                                    No scrolls found in this archive.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* MIDDLE: Configuration & Students */}
                    <div className="col-span-5 flex flex-col bg-stone-900/20 relative">
                        {/* Subtle grid background */}
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none" />

                        <div className="p-4 border-b border-babel-gold/10 bg-black/20 relative z-10">
                            <h3 className="text-xs font-bold text-babel-gold/70 uppercase flex items-center gap-2 tracking-[0.2em] font-library">
                                <Target size={12} /> Mission Calibration
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 relative z-10">

                            {/* Basics */}
                            <div className="space-y-6">
                                <div className="group">
                                    <label className="block text-[10px] uppercase text-stone-500 mb-2 font-library tracking-widest group-hover:text-babel-gold transition-colors">Mission Title</label>
                                    <input
                                        value={missionTitle} onChange={e => setMissionTitle(e.target.value)}
                                        className="w-full bg-transparent border-b border-stone-800 focus:border-babel-gold py-2 text-xl text-stone-200 font-library placeholder-stone-800 outline-none transition-all"
                                        placeholder="Enter Mission Title..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <label className="block text-[10px] uppercase text-stone-500 mb-2 font-library tracking-widest">Duration (Weeks)</label>
                                        <div className="flex items-center gap-4">
                                            <input type="range" min="1" max="12" value={durationWeeks} onChange={e => setDurationWeeks(Number(e.target.value))} className="flex-1 accent-babel-gold h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer" />
                                            <span className="text-2xl font-library text-babel-gold">{durationWeeks}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase text-stone-500 mb-2 font-library tracking-widest">Words / Set</label>
                                        <div className="relative">
                                            <input type="number" value={wordsPerSeq} onChange={e => setWordsPerSeq(Number(e.target.value))} className="w-full bg-stone-900/50 border border-stone-800 rounded p-3 text-right text-white font-mono focus:border-babel-gold/50 outline-none transition-colors" />
                                            <span className="absolute left-3 top-3 text-xs text-stone-600 pointer-events-none">ea</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Students */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-end border-b border-white/5 pb-2">
                                    <label className="text-[10px] uppercase text-stone-500 flex items-center gap-2 font-library tracking-widest"><Users size={12} /> Acolytes ({selectedStudents.length})</label>
                                    <button onClick={toggleAllStudents} className="text-[10px] text-babel-gold hover:text-white transition-colors font-library tracking-wider">TOGGLE ALL</button>
                                </div>
                                <div className="h-64 rounded bg-black/40 border border-white/5 overflow-y-auto p-2 select-none space-y-1 custom-scrollbar">
                                    {mockUsers.map((u, i) => (
                                        <div
                                            key={u.id}
                                            onClick={(e) => handleStudentClick(i, e)}
                                            className={`p-3 rounded-sm text-sm cursor-pointer flex justify-between items-center transition-all duration-200 ${selectedStudents.includes(u.id) ? 'bg-babel-gold/10 text-babel-gold border-l-2 border-babel-gold' : 'text-stone-500 hover:bg-white/5 border-l-2 border-transparent'}`}
                                        >
                                            <span className="font-library tracking-wide text-xs">{u.name}</span>
                                            {selectedStudents.includes(u.id) && <Check size={12} className="text-babel-gold" />}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[9px] text-stone-600 text-right font-mono opacity-50">* Hold SHIFT for range selection</p>
                            </div>

                            {/* Preview */}
                            <div className="bg-stone-900/50 border border-white/5 p-6 rounded relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <BarChart2 size={40} className="text-babel-gold" />
                                </div>
                                <h4 className="text-[10px] font-bold text-babel-gold/80 mb-4 flex items-center gap-2 uppercase tracking-widest font-library">Projections</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] text-stone-600 uppercase border-b border-white/5 pb-2 mb-2 font-library tracking-wider">
                                        <span>Timeline</span>
                                        <span>Load</span>
                                        <span>Reward</span>
                                    </div>
                                    {schedule.map(s => (
                                        <div key={s.week} className="flex justify-between text-xs text-stone-400 py-1 border-b border-white/5 last:border-0 hover:text-stone-200 transition-colors">
                                            <span className="font-library text-babel-gold">Week {s.week}</span>
                                            <span className="font-mono text-[10px] opacity-70">{s.count} Sets</span>
                                            <span className="font-mono text-stone-500">{s.count * pointsPerSeq} pts</span>
                                        </div>
                                    ))}
                                    {schedule.length === 0 && <div className="text-center py-4 text-xs text-stone-700 italic font-library">Awaiting configuration...</div>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Word Output */}
                    <div className="col-span-4 flex flex-col bg-black/40">
                        <div className="p-4 border-b border-babel-gold/10 bg-black/20 flex justify-between items-center">
                            <h3 className="text-xs font-bold text-babel-gold/70 uppercase flex items-center gap-2 tracking-[0.2em] font-library">
                                <BookOpen size={12} /> Lux Veritatis
                            </h3>
                            <div className="text-[10px] text-stone-600 font-mono">
                                {generatedWords.length} Words
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto flex flex-col relative font-body custom-scrollbar">
                            {!isWordListReady ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-transparent z-10">
                                    <div className="w-20 h-20 rounded-full border border-babel-gold/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(212,175,55,0.05)] animate-pulse-slow">
                                        <Sparkles size={24} className="text-babel-gold opacity-70" />
                                    </div>
                                    <h4 className="text-stone-300 font-library text-lg mb-2 text-gold-glow">Lexicon Extraction</h4>
                                    <p className="text-xs text-stone-500 mb-8 max-w-xs leading-relaxed">
                                        {selectedPassageIds.size} Scrolls selected.<br />
                                        Initiate the extraction ritual to reveal the vocabulary.
                                    </p>
                                    <button
                                        onClick={printWords}
                                        disabled={selectedPassageIds.size === 0}
                                        className="group relative px-8 py-3 bg-transparent border border-babel-gold/30 text-babel-gold font-library text-xs tracking-[0.2em] uppercase hover:bg-babel-gold/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed overflow-hidden"
                                    >
                                        <span className="relative z-10 flex items-center gap-2"><Sparkles size={14} /> Manifest Words</span>
                                        <div className="absolute inset-0 bg-babel-gold/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
                                    </button>
                                </div>
                            ) : (
                                <div className="p-4 space-y-2">
                                    <div className="flex justify-end mb-2">
                                        <button onClick={() => setGeneratedWords([])} className="text-[10px] text-red-900 hover:text-red-500 transition-colors flex items-center gap-1 font-library uppercase tracking-wider">
                                            <Trash2 size={10} /> Clear Lux
                                        </button>
                                    </div>
                                    {generatedWords.map((w, idx) => (
                                        <div key={idx} className="bg-stone-900/40 border border-white/5 p-3 rounded-sm flex gap-4 group hover:border-babel-gold/30 hover:bg-stone-900/60 transition-all duration-300">
                                            <div className="text-[10px] font-library text-babel-gold/40 pt-1 w-6 text-right">{idx + 1}</div>
                                            <div className="flex-1">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-stone-200 font-bold text-base font-serif tracking-wide group-hover:text-babel-gold transition-colors">{w.word}</span>
                                                    <span className="text-[10px] text-stone-600 font-mono tracking-tight">{w.phonetic}</span>
                                                </div>
                                                <div className="text-xs text-stone-400 mt-1 truncate pr-2 font-serif opacity-80">{w.meanings_kr.join(', ')}</div>
                                            </div>
                                            <button onClick={() => removeWord(idx)} className="opacity-0 group-hover:opacity-100 text-stone-600 hover:text-red-900 self-start p-1 transition-all transform hover:scale-110">
                                                <XIcon size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    {generatedWords.length === 0 && (
                                        <div className="text-center py-20 text-stone-600 text-xs flex flex-col items-center gap-3 font-library">
                                            <AlertCircle size={20} className="opacity-30" />
                                            <span>The void returns no words.</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer Action */}
                        <div className="p-6 border-t border-babel-gold/10 bg-black/40 backdrop-blur flex justify-between items-center gap-4">
                            <div className="text-[10px] text-stone-600 font-library uppercase tracking-wider max-w-[200px] leading-relaxed">
                                {generatedWords.length > 0 ? "Extraction Complete. Ready to Deploy." : "No words extracted. Deploying as Assignment Only."}
                            </div>
                            <button
                                onClick={handleDeploy}
                                disabled={selectedStudents.length === 0 || selectedPassageIds.size === 0}
                                className={`flex-1 ${generatedWords.length > 0 ? 'bg-babel-gold text-black hover:bg-yellow-500' : 'bg-transparent border border-babel-gold/50 text-babel-gold hover:bg-babel-gold/10'} py-4 rounded-sm shadow-[0_0_20px_rgba(0,0,0,0.5)] disabled:opacity-30 disabled:cursor-not-allowed flex justify-center items-center gap-3 transition-all duration-300 font-library uppercase tracking-[0.15em] text-xs font-bold`}
                            >
                                <Target size={16} />
                                {generatedWords.length > 0 ? "Deploy Mission" : "Assign Passages"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Simple Close Icon component for internal use if needed, reusing Lucide imports
const XIcon = ({ size }: { size: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 18 18" /></svg>
);
