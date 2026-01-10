import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { paraphraseTitle } from '../utils/koreanNamer';
import { Map, Crown, Lock, Globe, Brain } from 'lucide-react';
import { clsx } from 'clsx';
import { useGameEngine } from '../hooks/useGameEngine';

interface Continent {
    id: string;
    rawName: string;
    paraphrasedName: string;
    subTitle: string;
    themeColor: string;
    progress: number; // 0-100
    isLocked: boolean;
}

const MOCK_CONTINENTS: Continent[] = [
    {
        id: 'c1',
        rawName: '2024 Sep Mock Exam',
        paraphrasedName: '',
        subTitle: '',
        themeColor: '#D4AF37',
        progress: 45,
        isLocked: false
    },
    {
        id: 'c2',
        rawName: 'Voca Day 1-5',
        paraphrasedName: '',
        subTitle: '',
        themeColor: '#EF4444',
        progress: 0,
        isLocked: true
    },
    {
        id: 'c3',
        rawName: 'Grammar Unit 1',
        paraphrasedName: '',
        subTitle: '',
        themeColor: '#3B82F6',
        progress: 0,
        isLocked: true
    }
];

export default function WorldMapView() {
    const navigate = useNavigate();
    const [continents, setContinents] = useState<Continent[]>([]);
    const { getDueRevives } = useGameEngine();

    useEffect(() => {
        // Hydrate with paraphrased names
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
        navigate(`/missions/${id}`); // Navigate to Mission Select instead of direct sequence
    };

    const dueReviveCount = getDueRevives().length;

    // Asset Mapping Helper
    const getAssetPath = (id: string, name: string) => {
        // Mock mapping based on ID or Name keywords
        if (id === 'c1' || name.includes('Mock')) return '/assets/valley_of_echoes.png';
        if (id === 'c2' || name.includes('Voca')) return '/assets/crimson_peaks.png';
        return '/assets/valley_of_echoes.png'; // Fallback
    };

    return (
        <div className="min-h-screen bg-obsidian flex flex-col font-mono text-paper overflow-hidden">
            {/* Header */}
            <div className="p-8 pb-4 border-b border-white/10 flex justify-between items-end z-10 bg-obsidian/90 backdrop-blur">
                <div>
                    <h1 className="text-4xl font-serif text-babel-gold mb-2">World Map</h1>
                    <p className="text-xs text-stone-500 tracking-widest uppercase">Select a Region to Explore</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-stone-400">
                    {dueReviveCount > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-violet-900/50 border border-violet-500 rounded-full animate-pulse cursor-pointer hover:bg-violet-800 transition-colors" onClick={() => alert("Reminiscence Mode: Entering the Vault of Mistakes...")}>
                            <Brain size={14} className="text-violet-300" />
                            <span className="text-xs text-violet-200 font-bold">{dueReviveCount} Revives Due</span>
                        </div>
                    )}
                    <Globe size={14} /> Global Synchronization: 98%
                </div>
            </div>

            {/* Horizontal Scroll Container */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden flex items-center gap-8 px-12 py-8 snap-x snap-mandatory">
                {/* Add Reminiscence Node if Active */}
                {dueReviveCount > 0 && (
                    <div
                        onClick={() => alert("Reminiscence Mode: Entering the Vault of Mistakes...")}
                        className="snap-center shrink-0 w-[400px] h-[600px] relative rounded-2xl border transition-all duration-500 cursor-pointer group flex flex-col justify-end p-8 overflow-hidden border-violet-500/50 bg-black hover:border-violet-500 shadow-[0_0_30px_rgba(139,92,246,0.3)]"
                    >
                        <div
                            className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-60 transition-opacity grayscale"
                            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80')` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-violet-950 via-transparent to-transparent opacity-90" />

                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Brain size={16} className="text-violet-400" />
                                <span className="text-xs font-bold text-violet-400 uppercase tracking-widest">Memory Reconstruction</span>
                            </div>
                            <h3 className="text-3xl font-serif font-bold text-white mb-2 text-shadow-lg">
                                Reminiscence
                            </h3>
                            <p className="text-xs text-stone-400 leading-relaxed max-w-[200px]">
                                {dueReviveCount} fragments of lost knowledge have resurfaced. Stabilize them before they fade.
                            </p>
                        </div>
                    </div>
                )}

                {continents.map((continent) => (
                    <div
                        key={continent.id}
                        onClick={() => handleEnter(continent.id, continent.isLocked)}
                        className={clsx(
                            "snap-center shrink-0 w-[400px] h-[600px] relative rounded-2xl border transition-all duration-500 cursor-pointer group flex flex-col justify-end p-8 overflow-hidden",
                            continent.isLocked
                                ? "border-white/5 bg-white/5 grayscale blur-[1px]"
                                : "border-white/10 bg-black hover:border-babel-gold hover:shadow-[0_0_50px_rgba(212,175,55,0.2)]"
                        )}
                        style={{ borderColor: !continent.isLocked ? continent.themeColor : undefined }}
                    >
                        {/* Background Image */}
                        <div
                            className="absolute inset-0 bg-cover bg-center opacity-50 transition-transform duration-700 group-hover:scale-110"
                            style={{ backgroundImage: `url('${getAssetPath(continent.id, continent.rawName)}')` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                        {/* Content */}
                        <div className="relative z-10 space-y-4">
                            {continent.isLocked ? (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-stone-600">
                                    <Lock size={48} />
                                </div>
                            ) : null}

                            <div>
                                <h3 className="text-3xl font-serif font-bold text-white mb-1 group-hover:text-babel-gold transition-colors">
                                    {continent.paraphrasedName}
                                </h3>
                                <p className="text-stone-400 text-xs tracking-wider uppercase">{continent.subTitle}</p>
                            </div>

                            {/* Stats */}
                            <div className="flex gap-4 border-t border-white/20 pt-4 mt-4">
                                <div className="flex-1">
                                    <div className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">Conquest</div>
                                    <div className="text-xl font-bold font-mono text-white">{continent.progress}%</div>
                                </div>
                                <div className="flex-1">
                                    <div className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">Status</div>
                                    <div className="text-xs text-babel-gold flex items-center gap-1">
                                        {continent.progress === 100 ? <Crown size={12} /> : <Map size={12} />}
                                        {continent.progress === 100 ? 'Conquered' : 'Exploring'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Pad end */}
                <div className="w-12 shrink-0" />
            </div>
        </div>
    );
}
