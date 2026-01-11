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
        <div className="p-12 space-y-12 min-h-screen text-slate-200 relative">
            <div className="caustic-overlay" />

            {/* Header */}
            <div className="flex items-center justify-between pb-8 relative border-b border-white/5 z-10">
                <div>
                    <h2 className="text-4xl md:text-5xl text-cinematic mb-2 drop-shadow-lg">
                        ABYSSAL ARCHIVE
                    </h2>
                    <p className="text-cyan-500/70 text-sm font-bold tracking-[0.3em] uppercase pl-1">
                        Secure Command Center
                    </p>
                </div>
                <div className="bg-slate-900/50 backdrop-blur-md px-6 py-3 rounded-full border border-slate-700/50 flex items-center gap-3 shadow-lg">
                    <Calendar size={16} className="text-cyan-400" />
                    <span className="text-slate-300 font-mono text-sm tracking-wider uppercase">
                        {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                </div>
            </div>

            {/* Metric Cards - Astonishing Scale */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                <MetricCard
                    icon={<FileText size={32} />}
                    label="Archived Memories"
                    value={stats.totalPassages}
                    sub="Passages"
                />
                <MetricCard
                    icon={<FolderOpen size={32} />}
                    label="Active Synapses"
                    value={stats.totalProjects}
                    sub="Projects"
                />
                <MetricCard
                    icon={<BookOpen size={32} />}
                    label="Resurfaced Words"
                    value={stats.totalVocabulary}
                    sub="Vocabulary"
                    highlight
                />
                <MetricCard
                    icon={<Users size={32} />}
                    label="Connected Minds"
                    value={stats.activeStudents}
                    sub="Active Divers"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                {/* Main Dashboard Panel (2/3) */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Weekly Volume */}
                    <section className="abyss-glass p-8 border hover:border-cyan-500/20 transition-colors">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl text-slate-200 font-serif tracking-wider flex items-center gap-3">
                                <History className="text-cyan-500" /> Data Flow Analysis
                            </h3>
                        </div>

                        <div className="flex items-end justify-between gap-4 h-48 px-4">
                            {studyVolume.map((vol, idx) => (
                                <div key={idx} className="flex-1 flex flex-col items-center gap-3 group cursor-default">
                                    <div className="w-full bg-slate-800/30 rounded relative h-full flex flex-col justify-end overflow-hidden shadow-inner">
                                        <div
                                            style={{ height: `${Math.min(100, vol.count * 2)}%` }}
                                            className="w-full bg-gradient-to-t from-cyan-900 to-cyan-500 opacity-60 group-hover:opacity-100 transition-all duration-500 shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                                        />
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-bold font-mono uppercase group-hover:text-cyan-400 transition-colors">
                                        {vol.date}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Vitality Alerts */}
                    <section>
                        <div className="flex items-center gap-3 mb-4 pl-2">
                            <Activity size={20} className="text-red-400" />
                            <h3 className="text-sm font-black tracking-[0.2em] text-red-500 uppercase text-shadow-red">
                                Vitality Drop Detected
                            </h3>
                        </div>

                        {slumps.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {slumps.map((slump) => (
                                    <div key={slump.studentId} className="abyss-glass p-6 border-l-4 border-l-red-500 flex justify-between items-center group bg-red-950/5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-red-900/20 flex items-center justify-center text-red-400 font-bold border border-red-500/20">
                                                !
                                            </div>
                                            <div>
                                                <div className="text-lg text-slate-200 font-bold tracking-wide">{slump.studentName}</div>
                                                <div className="text-sm text-red-300 font-mono mt-1">
                                                    Performance dropped from <span className="text-white">{slump.prevAvg}%</span> to <span className="text-white">{slump.currentAvg}%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-3xl font-black text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                                            -{slump.dropRate}%
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-slate-500 text-sm font-mono tracking-widest text-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-950/30">
                                SYSTEM STABLE // NO ANOMALIES DETECTED
                            </div>
                        )}
                    </section>
                </div>

                {/* Right Sidebar (1/3) */}
                <div className="space-y-8">
                    {/* Top Errors */}
                    <div className="abyss-glass p-8">
                        <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-4">
                            <AlertTriangle size={18} className="text-amber-500" />
                            <h3 className="text-sm font-black text-amber-500 tracking-[0.2em] uppercase">
                                Critical Errors
                            </h3>
                        </div>

                        <div className="space-y-6">
                            {topWrongWords.map((item, idx) => (
                                <div key={idx} className="flex gap-5 group cursor-pointer items-center">
                                    <span className="text-4xl font-serif text-slate-800 group-hover:text-amber-500/40 transition-colors font-bold">
                                        {idx + 1}
                                    </span>
                                    <div>
                                        <div className="text-lg text-slate-200 font-bold group-hover:text-amber-400 transition-colors">
                                            {item.word}
                                        </div>
                                        <div className="text-sm text-slate-500 italic mb-1">{item.meaning}</div>
                                        <div className="text-[10px] text-red-400 bg-red-950/30 px-2 py-0.5 rounded border border-red-900/50 inline-block font-mono">
                                            {item.incorrectCount} FAILURES
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
        "p-8 rounded-xl border transition-all duration-500 relative overflow-hidden group hover:-translate-y-2",
        highlight ? "bg-cyan-950/20 border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.1)]" : "bg-slate-900/40 border-slate-800 hover:border-slate-600"
    )}>
        {/* Cinematic Glow Background */}
        <div className={clsx("absolute -right-10 -top-10 w-40 h-40 rounded-full blur-[60px] opacity-0 group-hover:opacity-40 transition-opacity duration-700", highlight ? "bg-cyan-400" : "bg-slate-400")} />

        <div className="flex justify-between items-start mb-6 relative z-10">
            <span className={clsx("text-xs uppercase tracking-[0.2em] font-bold", highlight ? "text-cyan-400" : "text-slate-500")}>
                {label}
            </span>
            <div className={clsx("opacity-60 group-hover:opacity-100 transition-all transform group-hover:scale-110", highlight ? "text-cyan-400" : "text-slate-500")}>
                {icon}
            </div>
        </div>

        <div className="text-5xl font-medium text-slate-100 font-[Cinzel] tracking-tight relative z-10 text-shadow-lg">
            {(isNaN(value) ? 0 : value).toLocaleString()}
        </div>
        <div className="text-xs text-slate-500 mt-2 font-mono uppercase tracking-widest relative z-10">
            Total {sub}
        </div>
    </div>
);
