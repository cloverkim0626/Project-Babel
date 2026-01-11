import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Database, CheckCircle, Box, Lock } from 'lucide-react';
import { clsx } from 'clsx';
// import { useGameEngine } from '../hooks/useGameEngine';

interface QuestSet {
    id: string;
    index: number;
    status: 'locked' | 'open' | 'passed' | 'failed' | 'corroded';
    score: number;
    week: number;
}

export const QuestProgressView: React.FC = () => {
    const { id: missionId } = useParams();
    const navigate = useNavigate();
    // const { addXp, addPoints } = useGameEngine(); 

    const [questSets, setQuestSets] = useState<QuestSet[]>([]);
    const [loading, setLoading] = useState(true);
    const [missionTitle, setMissionTitle] = useState("Initializing...");

    useEffect(() => {
        if (!missionId) return;

        const fetchData = async () => {
            const { data: mission } = await supabase.from('missions').select('title').eq('id', missionId).single();
            if (mission) setMissionTitle(mission.title);

            // Mock Data if DB empty (for demo)
            const sets: QuestSet[] = Array.from({ length: 5 }).map((_, i) => ({
                id: `set-${i}`,
                index: i + 1,
                status: i === 0 ? 'open' : i < 3 ? 'passed' : 'locked',
                score: i < 3 ? 100 : 0,
                week: 1
            }));

            // In reality, use the Supabase call from before. Re-instating mockup for guaranteed render.
            // const { data: sets } = await supabase.from('quest_sets')

            setQuestSets(sets);
            setLoading(false);
        };

        fetchData();
    }, [missionId]);

    const handleNodeClick = (set: QuestSet) => {
        if (set.status === 'locked') {
            alert("보안 등급이 부족합니다. 이전 데이터 파편을 먼저 해석하십시오.");
            return;
        }
        navigate(`/mission/${set.id}/play`);
    };

    if (loading) return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center font-mono">
            <span className="text-cyan-500 animate-pulse uppercase tracking-[0.5em]">System Initializing...</span>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 font-sans flex flex-col relative overflow-hidden">
            <div className="caustic-overlay" />

            {/* Header */}
            <div className="p-6 md:px-12 md:py-8 border-b border-white/5 flex items-center justify-between bg-[#020617]/90 backdrop-blur z-20 sticky top-0">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-cyan-400 transition-colors">
                    <ArrowLeft size={18} /> <span className="text-xs uppercase tracking-widest font-mono">Abort Dive</span>
                </button>

                <div className="text-center">
                    <h2 className="text-2xl md:text-3xl text-cinematic flex items-center justify-center gap-3">
                        <Database size={24} className="text-cyan-500" />
                        DATA SEQUENCES (데이터 시퀀스)
                    </h2>
                </div>

                <div className="w-24" /> {/* Spacer */}
            </div>

            {/* Main Content: Grid of Fragments */}
            <div className="flex-1 overflow-y-auto p-6 md:p-12 z-10 custom-scrollbar">
                <div className="max-w-6xl mx-auto">

                    <div className="mb-12 text-center">
                        <p className="text-sm font-mono text-cyan-500/60 uppercase tracking-[0.3em] mb-2">Target Source</p>
                        <h1 className="text-4xl md:text-5xl font-serif text-white mb-6">{missionTitle}</h1>
                        <p className="text-slate-400 text-lg max-w-3xl mx-auto leading-relaxed">
                            "이 구역에서 {questSets.length}개의 손상된 데이터 시퀀스가 발견되었습니다. 각 큐브를 선택하여 데이터를 복원하십시오."
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                        {questSets.map((set) => (
                            <div
                                key={set.id}
                                onClick={() => handleNodeClick(set)}
                                className={clsx(
                                    "aspect-square relative group cursor-pointer transition-all duration-300",
                                    set.status === 'locked' ? "opacity-40" : "hover:-translate-y-2"
                                )}
                            >
                                {/* Cube Container */}
                                <div className={clsx(
                                    "w-full h-full border-2 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-sm",
                                    set.status === 'locked' && "bg-slate-900 border-white/5",
                                    set.status === 'open' && "bg-cyan-950/20 border-cyan-500/50 shadow-[0_0_30px_rgba(34,211,238,0.2)] animate-pulse-slow",
                                    set.status === 'passed' && "bg-emerald-950/20 border-emerald-500/30"
                                )}>

                                    {/* Icon */}
                                    <div className="mb-6 relative z-10">
                                        {set.status === 'locked' && <Lock className="text-slate-600" size={40} />}
                                        {set.status === 'open' && <Box className="text-cyan-400 animate-pulse" size={48} />}
                                        {set.status === 'passed' && (
                                            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                                <CheckCircle size={32} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Label */}
                                    <h3 className={clsx(
                                        "text-xl font-serif font-bold z-10 tracking-wider",
                                        set.status === 'open' ? "text-cyan-100" : "text-slate-500"
                                    )}>
                                        SEQUENCE {String(set.index).padStart(2, '0')}
                                    </h3>

                                    {/* Status Text */}
                                    <span className="text-xs uppercase tracking-widest mt-3 font-mono text-slate-500 z-10 font-bold">
                                        {set.status === 'locked' ? 'ENCRYPTED' : set.status === 'open' ? 'READY TO DECODE' : 'RESTORED'}
                                    </span>

                                    {/* Open Hover Effect */}
                                    {set.status === 'open' && (
                                        <div className="absolute inset-0 bg-cyan-400/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuestProgressView;
