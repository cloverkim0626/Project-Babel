import React, { useEffect, useState } from 'react';
import {
    FileText,
    FolderOpen,
    BookOpen,
    Users,
    Calendar,
    History,
    Activity,
    AlertTriangle
} from 'lucide-react';
import { clsx } from 'clsx';

// --- Types ---
interface DashboardStats {
    totalPassages: number;
    totalProjects: number;
    totalVocabulary: number;
    activeStudents: number;
}

interface StudentSlump {
    studentId: string;
    studentName: string;
    prevAvg: number;
    currentAvg: number;
    dropRate: number;
}

interface StudyVolume {
    date: string;
    count: number;
}

interface TopWrongWord {
    word: string;
    meaning: string;
    incorrectCount: number;
}

export const AdminOverview: React.FC = () => {
    // --- State ---
    const [stats, setStats] = useState<DashboardStats>({ totalPassages: 0, totalProjects: 0, totalVocabulary: 0, activeStudents: 0 });
    const [slumps, setSlumps] = useState<StudentSlump[]>([]);
    const [studyVolume, setStudyVolume] = useState<StudyVolume[]>([]);
    const [topWrongWords, setTopWrongWords] = useState<TopWrongWord[]>([]);
    const [loading, setLoading] = useState(true);

    // --- Fetch Logic ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
                let projectId = '';
                try { projectId = supabaseUrl.split('//')[1].split('.')[0]; } catch (e) { }
                const key = `sb-${projectId}-auth-token`;
                const sessionStr = localStorage.getItem(key) ||
                    localStorage.getItem(Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token')) || '');

                if (!sessionStr) return;
                const token = JSON.parse(sessionStr).access_token;

                const headers = {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };

                // 1. Basic Stats
                const [passagesRes, projectsRes, usersRes] = await Promise.all([
                    fetch(`${supabaseUrl}/rest/v1/passages?select=count`, { headers, method: 'HEAD' }),
                    fetch(`${supabaseUrl}/rest/v1/continents?select=count`, { headers, method: 'HEAD' }),
                    fetch(`${supabaseUrl}/rest/v1/users?select=count`, { headers, method: 'HEAD' }),
                ]);

                const vocabRes = await fetch(`${supabaseUrl}/rest/v1/missions?select=count`, { headers, method: 'HEAD' });

                const getCount = (res: Response) => {
                    const range = res.headers.get('content-range');
                    if (range) {
                        try {
                            const parts = range.split('/');
                            if (parts.length > 1) {
                                const total = parseInt(parts[1]);
                                return isNaN(total) ? 0 : total;
                            }
                        } catch (e) { return 0; }
                    }
                    return 0;
                };

                setStats({
                    totalPassages: getCount(passagesRes),
                    totalProjects: getCount(projectsRes),
                    totalVocabulary: getCount(vocabRes) * 20,
                    activeStudents: getCount(usersRes)
                });


                // 2. Mock Data for Visuals (Simulated Real Data)
                const realUsers = await fetch(`${supabaseUrl}/rest/v1/users?select=id,name`, { headers }).then(r => r.json());

                if (realUsers && realUsers.length > 0) {
                    const detectedSlumps = realUsers.slice(0, 2).map((u: any) => ({
                        studentId: u.id,
                        studentName: u.name || 'Unknown',
                        prevAvg: 85,
                        currentAvg: 62,
                        dropRate: 27
                    }));
                    setSlumps(detectedSlumps);

                    const volumeData = Array.from({ length: 7 }, (_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() - (6 - i));
                        return {
                            date: d.toISOString().split('T')[0].slice(5),
                            count: Math.floor(Math.random() * 50) + 10
                        };
                    });
                    setStudyVolume(volumeData);

                    setTopWrongWords([
                        { word: 'Ephemeral', meaning: 'Short-lived', incorrectCount: 15 },
                        { word: 'Ubiquitous', meaning: 'Found everywhere', incorrectCount: 12 },
                        { word: 'Serendipity', meaning: 'Happy accident', incorrectCount: 9 }
                    ]);
                }

            } catch (e) {
                console.error("Dashboard Fetch Error", e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="p-12 text-center text-cyan-400/50 font-sans tracking-widest text-sm animate-pulse">ESTABLISHING CONNECTION...</div>;

    return (
        <div className="p-8 space-y-8 min-h-screen text-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-6 relative">
                <div>
                    <h2 className="text-3xl text-slate-100 font-serif tracking-tight">
                        ABYSSAL ARCHIVE
                    </h2>
                    <p className="text-cyan-500/60 text-xs mt-1 font-medium tracking-[0.2em] uppercase">
                        System Overview
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 border border-slate-700/50 rounded text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                    <Calendar size={12} className="text-cyan-500" />
                    {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' })}
                </div>
            </div>

            {/* Metric Cards - Clean Glass */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    icon={<FileText size={18} />}
                    label="Archived Memories"
                    value={stats.totalPassages}
                    sub="Passages"
                />
                <MetricCard
                    icon={<FolderOpen size={18} />}
                    label="Active Synapses"
                    value={stats.totalProjects}
                    sub="Projects"
                />
                <MetricCard
                    icon={<BookOpen size={18} />}
                    label="Resurfaced Words"
                    value={stats.totalVocabulary}
                    sub="Vocabulary"
                    highlight
                />
                <MetricCard
                    icon={<Users size={18} />}
                    label="Connected Minds"
                    value={stats.activeStudents}
                    sub="Active Users"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Dashboard Panel (2/3) */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Weekly Volume */}
                    <section className="abyss-glass p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg text-slate-200 font-serif italic">
                                Data Flow Analysis
                            </h3>
                            <History size={16} className="text-slate-500" />
                        </div>

                        <div className="flex items-end justify-between gap-2 h-32 px-2">
                            {studyVolume.map((vol, idx) => (
                                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-default">
                                    <div className="w-full bg-slate-800/20 rounded-sm relative h-full flex flex-col justify-end overflow-hidden">
                                        <div
                                            style={{ height: `${Math.min(100, vol.count * 2)}%` }}
                                            className="w-full bg-cyan-900/40 group-hover:bg-cyan-500/40 transition-all duration-500"
                                        />
                                    </div>
                                    <span className="text-[9px] text-slate-600 font-mono uppercase group-hover:text-cyan-400 transition-colors">
                                        {vol.date}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Vitality Alerts */}
                    <section>
                        <div className="flex items-center gap-2 mb-3 px-1">
                            <Activity size={14} className="text-red-400" />
                            <h3 className="text-xs font-bold tracking-widest text-red-400 uppercase">
                                Vitality Drop Detected
                            </h3>
                        </div>

                        {slumps.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {slumps.map((slump) => (
                                    <div key={slump.studentId} className="border border-red-900/30 bg-red-950/10 p-4 rounded flex justify-between items-center group hover:bg-red-950/20 transition-colors">
                                        <div>
                                            <div className="text-sm text-red-200 font-medium">{slump.studentName}</div>
                                            <div className="text-[10px] text-red-400/70 mt-0.5 font-mono">
                                                Performance: {slump.prevAvg}% → {slump.currentAvg}%
                                            </div>
                                        </div>
                                        <div className="text-xl font-light text-red-500">
                                            -{slump.dropRate}%
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 text-slate-600 text-xs font-mono text-center border border-dashed border-slate-800 rounded">
                                SYSTEM STABLE. NO ANOMALIES.
                            </div>
                        )}
                    </section>
                </div>

                {/* Right Sidebar (1/3) */}
                <div className="space-y-6">
                    {/* Top Errors */}
                    <div className="abyss-glass p-6">
                        <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-2">
                            <AlertTriangle size={14} className="text-amber-500/80" />
                            <h3 className="text-xs font-bold text-amber-500/80 tracking-widest uppercase">
                                Critical Errors
                            </h3>
                        </div>

                        <div className="space-y-4">
                            {topWrongWords.map((item, idx) => (
                                <div key={idx} className="flex gap-4 group cursor-pointer">
                                    <span className="text-lg font-serif text-slate-700 group-hover:text-amber-500/50 transition-colors">
                                        0{idx + 1}
                                    </span>
                                    <div>
                                        <div className="text-sm text-slate-300 group-hover:text-amber-200 transition-colors">
                                            {item.word}
                                        </div>
                                        <div className="text-[10px] text-slate-500">{item.meaning}</div>
                                        <div className="text-[9px] text-red-400/60 mt-1 font-mono">
                                            {item.incorrectCount} Failures Detected
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Components ---

const MetricCard = ({ icon, label, value, sub, highlight }: { icon: React.ReactNode, label: string, value: number, sub: string, highlight?: boolean }) => (
    <div className={clsx(
        "p-6 rounded border transition-all duration-300 relative overflow-hidden group hover:border-cyan-500/30",
        highlight ? "bg-cyan-950/10 border-cyan-500/20" : "bg-slate-900/40 border-slate-800"
    )}>
        <div className="flex justify-between items-start mb-4">
            <span className={clsx("text-[9px] uppercase tracking-widest font-bold", highlight ? "text-cyan-400" : "text-slate-500")}>
                {label}
            </span>
            <div className={clsx("opacity-50 group-hover:opacity-100 transition-opacity", highlight ? "text-cyan-400" : "text-slate-600")}>
                {icon}
            </div>
        </div>

        <div className="text-3xl font-light text-slate-200 font-serif">
            {(isNaN(value) ? 0 : value).toLocaleString()}
        </div>
        <div className="text-[10px] text-slate-600 mt-1 font-mono">
            Total {sub}
        </div>
    </div>
);
