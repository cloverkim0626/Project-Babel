import React, { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Target, Check, AlertCircle, BarChart2, Layers } from 'lucide-react';

// State for Custom Passages (Bulk Entry)
export const MissionDistributor: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    // State for Custom Passages (Bulk Entry)
    const [customPassages, setCustomPassages] = useState<{ id: string, title: string, content: string, wordCount: number }[]>([
        { id: 'p-1', title: 'Passage 1', content: '', wordCount: 0 }
    ]);

    // Step 2: Config
    const [durationWeeks, setDurationWeeks] = useState(2);
    const [wordsPerSeq, setWordsPerSeq] = useState(20);
    const [pointsPerSeq, setPointsPerSeq] = useState(10);
    const [missionTitle, setMissionTitle] = useState('New Mission Assignment');

    // Step 3: Students (Mock)
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    // Mock Selection state (kept for compatibility if needed, but unused in Bulk Mode)
    const [selectedPassages] = useState<string[]>([]);

    const addPassageSlot = () => {
        const id = `p-${Date.now()}`;
        setCustomPassages(prev => [...prev, {
            id,
            title: `Passage ${prev.length + 1}`,
            content: '',
            wordCount: 0
        }]);
    };

    const updatePassage = (id: string, field: 'title' | 'content', value: string) => {
        setCustomPassages(prev => prev.map(p => {
            if (p.id !== id) return p;
            const updates: any = { [field]: value };
            if (field === 'content') {
                // Auto-count words approx
                updates.wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
            }
            return { ...p, ...updates };
        }));
    };

    const removePassage = (id: string) => {
        setCustomPassages(prev => prev.filter(p => p.id !== id));
    };

    // Calculation Logic (Updated to use customPassages)
    const distributionPreview = useMemo(() => {
        // Use ALL custom passages for distribution
        const totalWords = customPassages.reduce((acc, p) => acc + p.wordCount, 0);

        const totalSequences = Math.ceil(totalWords / wordsPerSeq);
        const baseSeqPerWeek = Math.floor(totalSequences / durationWeeks);
        const remainder = totalSequences % durationWeeks;

        const schedule = [];
        let accumulatedSeqs = 0;

        for (let w = 1; w <= durationWeeks; w++) {
            // Distribute remainder to first weeks (Top-heavy)
            const count = baseSeqPerWeek + (w <= remainder ? 1 : 0);
            if (count > 0) {
                schedule.push({
                    week: w,
                    count: count,
                    words: count * wordsPerSeq, // Approx
                    startSeq: accumulatedSeqs + 1,
                    endSeq: accumulatedSeqs + count
                });
                accumulatedSeqs += count;
            }
        }

        return { totalWords, totalSequences, schedule };
    }, [customPassages, durationWeeks, wordsPerSeq]);

    const handleDeploy = async () => {
        if (selectedStudents.length === 0) return alert("Select at least one student.");
        if (distributionPreview.totalWords === 0) return alert("Please add passage content.");

        const confirmMsg = `Deploying to ${selectedStudents.length} students.\n` +
            `Total: ${distributionPreview.totalSequences} Sequences (${distributionPreview.totalWords} words).\n` +
            `Proceed?`;

        if (!confirm(confirmMsg)) return;

        // 1. Create Mission with Payload
        const { data: mission, error: missionError } = await supabase
            .from('missions')
            .insert({
                title: missionTitle,
                category: 'mock',
                total_sets: distributionPreview.totalSequences,
                config: {
                    duration_weeks: durationWeeks,
                    split_size: wordsPerSeq,
                    points_award: pointsPerSeq,
                    // Save the actual passage text in the config or a secure payload column
                    passages: customPassages
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
            const seqs: any[] = [];
            distributionPreview.schedule.forEach(weekSch => {
                for (let i = weekSch.startSeq; i <= weekSch.endSeq; i++) {
                    seqs.push({
                        user_id: userId,
                        mission_id: mission.id,
                        set_index: i,
                        week_number: weekSch.week,
                        status: i === 1 ? 'open' : 'locked',
                        score: 0
                    });
                }
            });
            return supabase.from('quest_sets').insert(seqs);
        });
        <textarea
            value={p.content}
            onChange={(e) => updatePassage(p.id, 'content', e.target.value)}
            placeholder="Paste passage text here..."
            className="w-full h-24 bg-black/40 border border-white/5 rounded p-2 text-xs text-stone-300 focus:border-babel-gold/50 outline-none resize-none"
        />
                            </div >
                        ))}
                    </div >
                </div >

    {/* Middle: Configuration */ }
    < div className = "col-span-4 border-r border-white/10 p-6 overflow-y-auto" >
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
                </div >

    {/* Right: Preview */ }
    < div className = "col-span-4 p-6 bg-black/20 overflow-y-auto" >
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
                </div >
            </div >

    {/* Footer */ }
    < div className = "p-4 border-t border-white/10 flex justify-end gap-3 bg-black/40" >
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
            </div >
        </div >
    </div >
);
};
