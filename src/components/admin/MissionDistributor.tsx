import React, { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Target, Check, AlertCircle, BarChart2, Layers, BookOpen } from 'lucide-react';

interface Passage {
    id: string;
    title: string;
    content: string;
    word_count: number;
}

interface MissionDistributorProps {
    onClose: () => void;
    initialPassages: Passage[];
    missionTitle?: string;
}

export const MissionDistributor: React.FC<MissionDistributorProps> = ({ onClose, initialPassages, missionTitle: defaultTitle }) => {
    // Config State
    const [durationWeeks, setDurationWeeks] = useState(2);
    const [wordsPerSeq, setWordsPerSeq] = useState(20);
    const [pointsPerSeq, setPointsPerSeq] = useState(10);
    const [inputTitle, setInputTitle] = useState(defaultTitle || '새로운 미션 배포');

    // Student Selection State (Mock for now)
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

    // Calculation Logic
    const distributionPreview = useMemo(() => {
        const totalWords = initialPassages.reduce((acc, p) => acc + p.word_count, 0);

        const totalSequences = Math.ceil(totalWords / wordsPerSeq);
        const baseSeqPerWeek = Math.floor(totalSequences / durationWeeks);
        const remainder = totalSequences % durationWeeks;

        const schedule = [];
        let accumulatedSeqs = 0;

        for (let w = 1; w <= durationWeeks; w++) {
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
    }, [initialPassages, durationWeeks, wordsPerSeq]);

    const handleDeploy = async () => {
        if (selectedStudents.length === 0) return alert("최소 한 명 이상의 학생을 선택해주세요.");
        if (distributionPreview.totalWords === 0) return alert("배포할 지문 내용이 없습니다.");

        const confirmMsg = `${selectedStudents.length}명의 학생에게 배포합니다.\n` +
            `총 ${distributionPreview.totalSequences} 시퀀스 (${distributionPreview.totalWords} 단어).\n` +
            `진행하시겠습니까?`;

        if (!confirm(confirmMsg)) return;

        // 1. Create Mission with Payload
        const { data: mission, error: missionError } = await supabase
            .from('missions')
            .insert({
                title: inputTitle,
                category: 'mock',
                total_sets: distributionPreview.totalSequences,
                config: {
                    duration_weeks: durationWeeks,
                    split_size: wordsPerSeq,
                    points_award: pointsPerSeq,
                    passages: initialPassages // Save snapshot of passages
                }
            })
            .select()
            .single();

        if (missionError) {
            console.error(missionError);
            return alert("미션 생성 실패.");
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

        await Promise.all(tasks);
        alert("배포가 완료되었습니다!");
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-stone-900 border border-white/10 rounded-xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40">
                    <h2 className="text-2xl font-serif text-babel-gold flex items-center gap-3">
                        <Layers className="text-white" /> 미션 배포 설정 (Mission Distribution)
                    </h2>
                    <button onClick={onClose} className="text-stone-400 hover:text-white">닫기</button>
                </div>

                <div className="flex-1 overflow-hidden grid grid-cols-12">
                    {/* Left: Selected Passages (Read Only) */}
                    <div className="col-span-4 border-r border-white/10 p-4 overflow-y-auto bg-black/20 flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs uppercase tracking-widest text-stone-500 flex items-center gap-2">
                                <BookOpen size={14} /> 선택된 지문 ({initialPassages.length})
                            </h3>
                        </div>

                        <div className="space-y-3 flex-1">
                            {initialPassages.map((p, idx) => (
                                <div key={p.id || idx} className="p-4 bg-stone-800/50 border border-white/5 rounded-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-white text-sm">{p.title}</span>
                                        <span className="text-[10px] text-stone-500 bg-black/50 px-2 py-0.5 rounded">{p.word_count} words</span>
                                    </div>
                                    <p className="text-xs text-stone-500 line-clamp-3 leading-relaxed">
                                        {p.content}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Middle: Configuration */}
                    <div className="col-span-4 border-r border-white/10 p-6 overflow-y-auto">
                        <h3 className="text-xs uppercase tracking-widest text-stone-500 mb-6 flex items-center gap-2">
                            <Target size={14} /> 설정 (Configuration)
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm text-stone-400 mb-2">미션 제목</label>
                                <input
                                    type="text"
                                    value={inputTitle}
                                    onChange={(e) => setInputTitle(e.target.value)}
                                    className="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-babel-gold outline-none"
                                />
                            </div>

                            <div className="bg-stone-800/30 p-4 rounded-lg space-y-4 border border-white/5">
                                <div>
                                    <label className="block text-xs uppercase text-stone-500 mb-1">기간 설정 (주 단위)</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range" min="1" max="10"
                                            value={durationWeeks}
                                            onChange={(e) => setDurationWeeks(Number(e.target.value))}
                                            className="flex-1 accent-babel-gold"
                                        />
                                        <span className="text-xl font-bold text-babel-gold w-8 text-center">{durationWeeks}주</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs uppercase text-stone-500 mb-1">시퀀스 당 단어 수</label>
                                    <input
                                        type="number"
                                        value={wordsPerSeq}
                                        onChange={(e) => setWordsPerSeq(Number(e.target.value))}
                                        className="w-full bg-black border border-white/20 rounded p-2 text-white text-right"
                                    />
                                    <p className="text-[10px] text-stone-500 mt-1">권장: 20-30 단어</p>
                                </div>

                                <div>
                                    <label className="block text-xs uppercase text-stone-500 mb-1">시퀀스 당 보상 포인트</label>
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
                                    <Users size={12} /> 대상 학생 선택
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
                                                className={`p-2 rounded text-sm cursor-pointer flex justify-between items-center transition-colors ${isSel ? 'bg-green-900/30 text-green-300 border border-green-800' : 'text-stone-400 hover:bg-white/5 border border-transparent'
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
                            <BarChart2 size={14} /> 일정 미리보기 (Schedule)
                        </h3>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end border-b border-white/10 pb-4">
                                <div>
                                    <div className="text-3xl font-bold text-white">{distributionPreview.totalSequences}</div>
                                    <div className="text-xs text-stone-500">총 시퀀스 (Total Sequences)</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-bold text-babel-gold">{distributionPreview.totalWords}</div>
                                    <div className="text-xs text-stone-500">총 단어 수 (Total Words)</div>
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
                            {distributionPreview.schedule.length > 0 && distributionPreview.schedule[distributionPreview.schedule.length - 1].count !== distributionPreview.schedule[0].count && (
                                <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded text-xs text-yellow-500 flex items-start gap-2">
                                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                    <div>
                                        배분 불균형 감지 (Top-heavy). <br />
                                        나머지 시퀀스가 앞쪽 주차에 배치되었습니다.
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 flex justify-end gap-3 bg-black/40">
                    <button onClick={onClose} className="px-6 py-3 rounded text-stone-400 hover:text-white transition-colors">
                        취소
                    </button>
                    <button
                        onClick={handleDeploy}
                        disabled={selectedStudents.length === 0 || initialPassages.length === 0}
                        className="px-8 py-3 bg-babel-gold hover:bg-yellow-500 text-black font-bold rounded shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        미션 배포 시작 (Start Deploy)
                    </button>
                </div>
            </div>
        </div>
    );
};
