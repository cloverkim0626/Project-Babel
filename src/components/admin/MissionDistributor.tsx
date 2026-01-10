import React, { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Target, Check, AlertCircle, BarChart2, Layers } from 'lucide-react';

// Mock Data for "Passages" (Since we don't have a real Passages table yet)
const MOCK_PASSAGES = Array.from({ length: 18 }, (_, i) => ({
    id: `passage-${i + 1}`,
    title: `2024 Sep Mock Exam - Q${18 + i}`,
    wordCount: 25 + Math.floor(Math.random() * 20), // Random 25-45 words
    preview: "Lorem ipsum dolor sit amet, consectetur adipiscing elit..."
}));

export const MissionDistributor: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    // Step 1: Selection
    const [selectedPassages, setSelectedPassages] = useState<string[]>([]);

    // Step 2: Config
    const [durationWeeks, setDurationWeeks] = useState(2);
    const [wordsPerSeq, setWordsPerSeq] = useState(20); // User requested default 30 in prompt example, but default 20 in general
    const [pointsPerSeq, setPointsPerSeq] = useState(10);
    const [missionTitle, setMissionTitle] = useState('New Mission Assignment');

    // Step 3: Students (Mock)
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

    // Calculation Logic
    const distributionPreview = useMemo(() => {
        const totalWords = selectedPassages.reduce((acc, pid) => {
            const passage = MOCK_PASSAGES.find(p => p.id === pid);
            return acc + (passage?.wordCount || 0);
        }, 0);

        const totalSequences = Math.ceil(totalWords / wordsPerSeq);
        const baseSeqPerWeek = Math.floor(totalSequences / durationWeeks);
        const remainder = totalSequences % durationWeeks;

        const schedule = [];
        let accumulatedSeqs = 0;

        for (let w = 1; w <= durationWeeks; w++) {
            // Distribute remainder to first weeks (Top-heavy)
            const count = baseSeqPerWeek + (w <= remainder ? 1 : 0);
            schedule.push({
                week: w,
                count: count,
                words: count * wordsPerSeq, // Approx
                startSeq: accumulatedSeqs + 1,
                endSeq: accumulatedSeqs + count
            });
            accumulatedSeqs += count;
        }

        return { totalWords, totalSequences, schedule };
    }, [selectedPassages, durationWeeks, wordsPerSeq]);

    const handleDeploy = async () => {
        if (selectedStudents.length === 0) return alert("Select at least one student.");

        const confirmMsg = `Deploying to ${selectedStudents.length} students.\n` +
            `Total: ${distributionPreview.totalSequences} Sequences over ${durationWeeks} Weeks.\n` +
            `Proceed?`;

        if (!confirm(confirmMsg)) return;

        // 1. Create Mission
        const { data: mission, error: missionError } = await supabase
            .from('missions')
            .insert({
                title: missionTitle,
                category: 'mock', // default
                total_sets: distributionPreview.totalSequences,
                config: {
                    duration_weeks: durationWeeks,
                    split_size: wordsPerSeq,
                    points_award: pointsPerSeq,
                    source_ids: selectedPassages
                }
            })
            .select()
            .single();

        if (missionError) {
            console.error(missionError);
            return alert("Failed to create mission.");
        }

        // 2. Create Quest Sets for each student
        const tasks = selectedStudents.map(userId => {
            const seqs: any[] = []; // Explicitly type as any[] or partial QuestSet interface
            // Generate sequences based on schedule
            distributionPreview.schedule.forEach(weekSch => {
                for (let i = weekSch.startSeq; i <= weekSch.endSeq; i++) {
                    seqs.push({
                        user_id: userId,
                        mission_id: mission.id,
                        set_index: i,
                        week_number: weekSch.week,
                        status: i === 1 ? 'open' : 'locked', // Unlock first one? Or wait for week?
                        score: 0
                    });
                }
            });
            return supabase.from('quest_sets').insert(seqs);
        });

        await Promise.all(tasks);
        alert("Deployment Complete!");
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-stone-900 border border-white/10 rounded-xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40">
                    <h2 className="text-2xl font-serif text-babel-gold flex items-center gap-3">
                        <Layers className="text-white" /> Advanced Mission Distributor
                    </h2>
                    <button onClick={onClose} className="text-stone-400 hover:text-white">Close</button>
                </div>

                <div className="flex-1 overflow-hidden grid grid-cols-12">
                    {/* Left: Passage Selection */}
                    <div className="col-span-4 border-r border-white/10 p-4 overflow-y-auto bg-black/20">
                        <h3 className="text-xs uppercase tracking-widest text-stone-500 mb-4 flex items-center gap-2">
                            <Target size={14} /> Select Passages
                        </h3>
                        <div className="space-y-2">
                            {MOCK_PASSAGES.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => {
                                        if (selectedPassages.includes(p.id)) {
                                            setSelectedPassages(prev => prev.filter(id => id !== p.id));
                                        } else {
                                            setSelectedPassages(prev => [...prev, p.id]);
                                        }
                                    }}
                                    className={`p-3 rounded border cursor-pointer transition-all ${selectedPassages.includes(p.id)
                                        ? 'bg-blue-900/30 border-blue-500 text-blue-100'
                                        : 'bg-stone-800/50 border-white/5 text-stone-400 hover:bg-stone-800'
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className="font-bold text-sm">{p.title}</span>
                                        {selectedPassages.includes(p.id) && <Check size={14} className="text-blue-400" />}
                                    </div>
                                    <div className="text-xs mt-1 text-stone-500">{p.wordCount} words</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Middle: Configuration */}
                    <div className="col-span-4 border-r border-white/10 p-6 overflow-y-auto">
                        <h3 className="text-xs uppercase tracking-widest text-stone-500 mb-6 flex items-center gap-2">
                            <Target size={14} /> Distribution Config
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm text-stone-400 mb-2">Mission Title</label>
                                <input
                                    type="text"
                                    value={missionTitle}
                                    onChange={(e) => setMissionTitle(e.target.value)}
                                    className="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-babel-gold"
                                />
                            </div>

                            <div className="bg-stone-800/30 p-4 rounded-lg space-y-4 border border-white/5">
                                <div>
                                    <label className="block text-xs uppercase text-stone-500 mb-1">Duration (Weeks)</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range" min="1" max="10"
                                            value={durationWeeks}
                                            onChange={(e) => setDurationWeeks(Number(e.target.value))}
                                            className="flex-1 accent-babel-gold"
                                        />
                                        <span className="text-xl font-bold text-babel-gold w-8 text-center">{durationWeeks}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs uppercase text-stone-500 mb-1">Words per Sequence</label>
                                    <input
                                        type="number"
                                        value={wordsPerSeq}
                                        onChange={(e) => setWordsPerSeq(Number(e.target.value))}
                                        className="w-full bg-black border border-white/20 rounded p-2 text-white text-right"
                                    />
                                    <p className="text-[10px] text-stone-500 mt-1">Recommended: 20-30 words</p>
                                </div>

                                <div>
                                    <label className="block text-xs uppercase text-stone-500 mb-1">Points per Sequence</label>
                                    <input
                                        type="number"
                                        value={pointsPerSeq}
                                        onChange={(e) => setPointsPerSeq(Number(e.target.value))}
                                        className="w-full bg-black border border-white/20 rounded p-2 text-white text-right"
                                    />
                                </div>
                            </div>

                            {/* Target Students Mock */}
                            <div>
                                <label className="block text-xs uppercase text-stone-500 mb-2 flex items-center gap-2">
                                    <Users size={12} /> Target Students
                                </label>
                                <div className="h-40 overflow-y-auto border border-white/10 rounded bg-black/40 p-2 space-y-1">
                                    {['User A', 'User B', 'User C (High Rank)'].map((u, i) => {
                                        const uid = `user-${i}`;
                                        const isSel = selectedStudents.includes(uid);
                                        return (
                                            <div
                                                key={uid}
                                                onClick={() => {
                                                    if (isSel) setSelectedStudents(prev => prev.filter(id => id !== uid));
                                                    else setSelectedStudents(prev => [...prev, uid]);
                                                }}
                                                className={`p-2 rounded text-sm cursor-pointer flex justify-between items-center ${isSel ? 'bg-green-900/30 text-green-300' : 'text-stone-400 hover:bg-white/5'
                                                    }`}
                                            >
                                                <span>{u}</span>
                                                {isSel && <Check size={12} />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Preview */}
                    <div className="col-span-4 p-6 bg-black/20 overflow-y-auto">
                        <h3 className="text-xs uppercase tracking-widest text-stone-500 mb-6 flex items-center gap-2">
                            <BarChart2 size={14} /> Schedule Preview
                        </h3>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end border-b border-white/10 pb-4">
                                <div>
                                    <div className="text-3xl font-bold text-white">{distributionPreview.totalSequences}</div>
                                    <div className="text-xs text-stone-500">Total Sequences</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-bold text-babel-gold">{distributionPreview.totalWords}</div>
                                    <div className="text-xs text-stone-500">Total Words</div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {distributionPreview.schedule.map((sch) => (
                                    <div key={sch.week} className="bg-stone-800/50 p-3 rounded border border-white/5 relative overflow-hidden group">
                                        {/* Week Progress Bar bg */}
                                        <div
                                            className="absolute bottom-0 left-0 top-0 bg-blue-500/10 transition-all"
                                            style={{ width: `${(sch.count / Math.max(...distributionPreview.schedule.map(s => s.count))) * 100}%` }}
                                        />

                                        <div className="relative flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center text-xs font-bold text-stone-300 border border-white/10">
                                                    W{sch.week}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-white">{sch.count} Sequences</div>
                                                    <div className="text-[10px] text-stone-500">Seq #{sch.startSeq} - #{sch.endSeq}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-blue-400">~{sch.words} words</div>
                                                <div className="text-[10px] text-stone-600">Reward: {sch.count * pointsPerSeq} pts</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Alert if uneven */}
                            {distributionPreview.schedule[distributionPreview.schedule.length - 1].count !== distributionPreview.schedule[0].count && (
                                <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded text-xs text-yellow-500 flex items-start gap-2">
                                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                    <div>
                                        Distribution is uneven (Top-heavy). <br />
                                        Last week has fewer sequences to handle remainder.
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 flex justify-end gap-3 bg-black/40">
                    <button onClick={onClose} className="px-6 py-3 rounded text-stone-400 hover:text-white transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleDeploy}
                        disabled={selectedStudents.length === 0 || selectedPassages.length === 0}
                        className="px-8 py-3 bg-babel-gold hover:bg-yellow-500 text-black font-bold rounded shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Deploy Mission
                    </button>
                </div>
            </div>
        </div>
    );
};
