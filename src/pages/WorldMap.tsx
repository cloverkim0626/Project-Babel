import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { paraphraseTitle } from '../utils/koreanNamer';
import { Lock, Globe, Compass, Anchor } from 'lucide-react';
import { clsx } from 'clsx';

interface Continent {
    id: string;
    rawName: string;
    paraphrasedName: string;
    subTitle: string;
    themeColor: string;
    progress: number;
    isLocked: boolean;
}

const MOCK_CONTINENTS: Continent[] = [
    {
        id: 'c1',
        rawName: '2024 Sep Mock Exam',
        paraphrasedName: '',
        subTitle: '',
        themeColor: '#38bdf8', // Light Blue
        progress: 45,
        isLocked: false
    },
    {
        id: 'c2',
        rawName: 'Voca Day 1-5',
        paraphrasedName: '',
        subTitle: '',
        themeColor: '#f59e0b', // Amber
        progress: 0,
        isLocked: true
    },
    {
        id: 'c3',
        rawName: 'Grammar Unit 1',
        paraphrasedName: '',
        subTitle: '',
        themeColor: '#10b981', // Emerald
        progress: 0,
        isLocked: true
    }
];

export default function WorldMapView() {
    const navigate = useNavigate();
    const [continents, setContinents] = useState<Continent[]>([]);

    useEffect(() => {
        const hydrated = MOCK_CONTINENTS.map(c => {
            const { display, sub } = paraphraseTitle(c.rawName);
            return {
                ...c,
                paraphrasedName: display,
                subTitle: sub
            };
        });
        setContinents(hydrated);
    }, []);

    const handleEnter = (id: string, locked: boolean) => {
        if (locked) return;
        navigate(`/missions/${id}`);
    };

    return (
        <div className="min-h-screen bg-[#020617] flex flex-col font-sans text-slate-200 overflow-hidden relative">
            <div className="caustic-overlay" />

            {/* Header */}
            <div className="p-8 pb-4 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center z-10 bg-[#020617]/80 backdrop-blur-md">
                <div>
                    <h1 className="text-4xl text-cinematic mb-2 tracking-widest text-shadow-lg">
                        ABYSSAL CHART (탐사 구역 선택)
                    </h1>
                    <p className="text-xs text-cyan-500/60 tracking-[0.3em] uppercase pl-1 flex items-center gap-2">
                        <Compass size={14} className="animate-spin-slow" /> Select Sector to Dive
                    </p>
                </div>
                <div className="flex items-center gap-6 text-xs font-mono mt-4 md:mt-0">
                    <div className="flex items-center gap-2 text-cyan-400">
                        <Globe size={14} />
                        <span className="tracking-widest uppercase">Depth Sync: 98%</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-x-auto flex items-center gap-8 px-12 py-8 snap-x snap-mandatory relative z-10 custom-scrollbar">
                {continents.map((continent, idx) => (
                    <div
                        key={continent.id}
                        onClick={() => handleEnter(continent.id, continent.isLocked)}
                        className={clsx(
                            "snap-center shrink-0 w-[350px] h-[500px] relative rounded-t-full border transition-all duration-700 cursor-pointer group flex flex-col justify-end p-10 overflow-hidden",
                            continent.isLocked
                                ? "border-white/5 bg-slate-950/50 opacity-60 grayscale blur-[1px]"
                                : "abyss-glass border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_50px_rgba(34,211,238,0.15)] hover:-translate-y-4"
                        )}
                    >
                        {/* Interactive Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-cyan-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                        {/* Number Watermark */}
                        <div className="absolute top-8 right-8 text-8xl font-serif text-white/5 font-bold z-0 pointer-events-none">
                            {String(idx + 1).padStart(2, '0')}
                        </div>

                        {/* Content */}
                        <div className="relative z-10 space-y-6 text-center">
                            {continent.isLocked ? (
                                <div className="flex justify-center mb-8 text-slate-600">
                                    <Lock size={40} />
                                </div>
                            ) : (
                                <div className="flex justify-center mb-4">
                                    <Anchor size={32} className="text-cyan-500/80 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                                </div>
                            )}

                            <div>
                                <h3 className={clsx(
                                    "text-2xl font-serif font-bold mb-3 tracking-wide",
                                    continent.isLocked ? "text-slate-500" : "text-white group-hover:text-cinematic-gold transition-colors"
                                )}>
                                    {continent.paraphrasedName || continent.rawName}
                                </h3>
                                <div className="h-0.5 w-12 bg-white/10 mx-auto mb-3" />
                                <p className="text-slate-400 text-xs tracking-widest uppercase font-mono">{continent.subTitle || 'Unknown Signal'}</p>
                            </div>

                            {!continent.isLocked && (
                                <div className="pt-6 border-t border-white/10">
                                    <div className="text-[10px] text-cyan-500/60 uppercase tracking-widest mb-2 font-mono">Conquest Level</div>
                                    <div className="relative w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="absolute h-full bg-gradient-to-r from-cyan-600 to-cyan-400"
                                            style={{ width: `${continent.progress}%` }}
                                        />
                                    </div>
                                    <div className="mt-2 text-white font-serif text-xl">{continent.progress}%</div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Spacer */}
                <div className="w-12 shrink-0" />
            </div>
        </div>
    );
}
