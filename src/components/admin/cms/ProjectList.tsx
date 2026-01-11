import { useEffect, useState, useMemo } from 'react';
import {
    Plus, Layers,
    Filter, X, ChevronRight, Check, Trash2, Search,
    Book
} from 'lucide-react';
import { ContinentManager } from '../ContinentManager';
import { MissionDistributor } from '../MissionDistributor';
import { useNavigate, useLocation } from 'react-router-dom';

interface Continent {
    id: string;
    name: string;
    display_name: string;
    theme_color: string;
    image_url: string;
    created_at: string;
    isNew?: boolean;
    metadata?: {
        category?: 'TEXTBOOK' | 'MOCK' | 'OTHER';
        textbook?: { subject: string; unit: string };
        mock?: { year: string; month: string; grade: string };
        other?: { workbook: string; publisher: string; unit: string };
    };
}

export const ProjectList = ({ onCreate: _legacyOnCreate }: { onCreate: () => void }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [continents, setContinents] = useState<Continent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedContinent, setSelectedContinent] = useState<Continent | null>(null);
    const [showDistributor, setShowDistributor] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // --- Filter State ---
    const [filterCategory, setFilterCategory] = useState<'ALL' | 'TEXTBOOK' | 'MOCK' | 'OTHER'>('ALL');
    const [filterTbSubject, setFilterTbSubject] = useState('ALL');
    const [filterMockYear, setFilterMockYear] = useState('ALL');
    const [filterMockGrade, setFilterMockGrade] = useState('ALL');
    const [filterOtherPublisher, setFilterOtherPublisher] = useState('ALL');

    useEffect(() => {
        fetchContinents();
    }, []);

    useEffect(() => {
        if (continents.length > 0 && location.state && (location.state as any).newProjectId) {
            const newId = (location.state as any).newProjectId;
            const target = continents.find(c => c.id === newId);
            if (target) {
                setSelectedContinent({ ...target, isNew: true });
                window.history.replaceState({}, document.title);
            }
        }
    }, [continents, location]);

    const fetchContinents = async () => {
        try {
            setLoading(true);
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            let projectId = '';
            try { projectId = supabaseUrl.split('//')[1].split('.')[0]; } catch (e) { }
            const key = `sb-${projectId}-auth-token`;
            const sessionStr = localStorage.getItem(key) ||
                localStorage.getItem(Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token')) || '');

            if (!sessionStr) {
                setLoading(false);
                return;
            }

            const token = JSON.parse(sessionStr).access_token;

            const response = await fetch(`${supabaseUrl}/rest/v1/continents?select=*&order=created_at.desc`, {
                method: 'GET',
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setContinents(data);
            }
        } catch (e) {
            console.error("[ProjectList] Error:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (!selectedIds.length) return;
        if (!confirm(`Permanently delete ${selectedIds.length} specimens? This cannot be undone.`)) return;

        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            let projectId = '';
            try { projectId = supabaseUrl.split('//')[1].split('.')[0]; } catch (e) { }
            const key = `sb-${projectId}-auth-token`;
            const sessionStr = localStorage.getItem(key) ||
                localStorage.getItem(Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token')) || '');

            if (!sessionStr) throw new Error("No Auth Token Found");
            const token = JSON.parse(sessionStr).access_token;
            const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

            const idString = selectedIds.join(',');
            const response = await fetch(`${supabaseUrl}/rest/v1/continents?id=in.(${idString})`, {
                method: 'DELETE',
                headers
            });

            if (!response.ok) throw new Error(await response.text());

            alert("Specimens Destroyed.");
            setSelectedIds([]);
            fetchContinents();
        } catch (e: any) {
            alert("Delete Failed: " + e.message);
        }
    };

    // --- Filtering Logic ---
    const filteredContinents = useMemo(() => {
        return continents.filter(c => {
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const matchName = c.display_name.toLowerCase().includes(searchLower) || c.name.toLowerCase().includes(searchLower);
                if (!matchName) return false;
            }
            if (filterCategory !== 'ALL' && c.metadata?.category !== filterCategory) return false;
            if (filterCategory === 'TEXTBOOK' && filterTbSubject !== 'ALL' && c.metadata?.textbook?.subject !== filterTbSubject) return false;
            if (filterCategory === 'MOCK') {
                if (filterMockYear !== 'ALL' && c.metadata?.mock?.year !== filterMockYear) return false;
                if (filterMockGrade !== 'ALL' && c.metadata?.mock?.grade !== filterMockGrade) return false;
            }
            if (filterCategory === 'OTHER' && filterOtherPublisher !== 'ALL' && c.metadata?.other?.publisher !== filterOtherPublisher) return false;
            return true;
        });
    }, [continents, searchTerm, filterCategory, filterTbSubject, filterMockYear, filterMockGrade, filterOtherPublisher]);

    const filterOptions = useMemo(() => {
        const getUnique = (path: (c: Continent) => string | undefined) => Array.from(new Set(continents.map(path).filter(Boolean))).sort();
        return {
            subjects: getUnique(c => c.metadata?.category === 'TEXTBOOK' ? c.metadata.textbook?.subject : undefined),
            years: getUnique(c => c.metadata?.category === 'MOCK' ? c.metadata.mock?.year : undefined),
            grades: getUnique(c => c.metadata?.category === 'MOCK' ? c.metadata.mock?.grade : undefined),
            publishers: getUnique(c => c.metadata?.category === 'OTHER' ? c.metadata.other?.publisher : undefined),
        };
    }, [continents]);

    const resetFilters = () => {
        setFilterCategory('ALL');
        setFilterTbSubject('ALL');
        setFilterMockYear('ALL');
        setFilterMockGrade('ALL');
        setFilterOtherPublisher('ALL');
        setSearchTerm('');
    };

    if (loading) return <div className="p-12 text-center text-cyan-400/50 font-sans tracking-widest text-sm animate-pulse">SCANNING ARCHIVES...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen">
            {showDistributor && <MissionDistributor onClose={() => setShowDistributor(false)} />}
            {selectedContinent && (
                <ContinentManager
                    continent={selectedContinent}
                    initialView={selectedContinent.isNew ? 'add' : 'list'}
                    onClose={() => { setSelectedContinent(null); fetchContinents(); }}
                />
            )}

            <div className="flex flex-col gap-6 mb-10">
                {/* Header Row */}
                <div className="flex justify-between items-end border-b border-slate-800 pb-4">
                    <div>
                        <h2 className="text-3xl text-slate-100 font-serif tracking-tight mb-1">
                            MEMORY CORE
                        </h2>
                        <p className="text-cyan-500/60 text-xs font-medium tracking-[0.2em] uppercase">
                            Specimen Management
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {selectedIds.length > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                className="bg-red-950/20 hover:bg-red-900/40 text-red-300 border border-red-900/50 px-4 py-2 rounded text-xs font-bold tracking-wider flex items-center gap-2 transition-colors"
                            >
                                <Trash2 size={14} /> PURGE ({selectedIds.length})
                            </button>
                        )}
                        <button
                            onClick={() => {
                                if (selectedIds.length === filteredContinents.length) setSelectedIds([]);
                                else setSelectedIds(filteredContinents.map(c => c.id));
                            }}
                            className="bg-slate-900/50 text-slate-400 px-4 py-2 rounded text-xs font-bold tracking-wider transition-all border border-slate-700 hover:text-slate-200"
                        >
                            {selectedIds.length > 0 && selectedIds.length === filteredContinents.length ? 'DESELECT' : 'SELECT ALL'}
                        </button>
                        <button
                            onClick={() => setShowDistributor(true)}
                            className="bg-slate-900/50 hover:bg-slate-800 text-teal-400 px-4 py-2 rounded text-xs font-bold tracking-wider flex items-center gap-2 transition-all border border-slate-700 hover:border-teal-400/50"
                        >
                            <Layers size={14} /> DEPLOY
                        </button>
                        <button
                            onClick={() => navigate('/admin/create-project')}
                            className="abyss-btn px-5 py-2 flex items-center gap-2 text-xs font-bold uppercase shadow-lg"
                        >
                            <Plus size={14} /> New Specimen
                        </button>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-slate-900/30 border border-slate-800/50 rounded flex flex-wrap items-center gap-3 p-2">
                    <div className="flex items-center gap-2 text-slate-500 px-3 border-r border-slate-800">
                        <Filter size={14} />
                        <span className="text-[10px] font-bold tracking-widest uppercase">FILTER</span>
                    </div>

                    <select
                        value={filterCategory}
                        onChange={(e) => {
                            setFilterCategory(e.target.value as any);
                            setFilterTbSubject('ALL'); setFilterMockYear('ALL'); setFilterMockGrade('ALL'); setFilterOtherPublisher('ALL');
                        }}
                        className="bg-transparent text-xs text-slate-300 font-medium outline-none cursor-pointer hover:text-cyan-400 transition-colors uppercase"
                    >
                        <option value="ALL">All Categories</option>
                        <option value="TEXTBOOK">Textbooks</option>
                        <option value="MOCK">Mock Tests</option>
                        <option value="OTHER">Others</option>
                    </select>

                    {/* Dynamic Sub Filters */}
                    {filterCategory === 'TEXTBOOK' && (
                        <div className="flex items-center gap-2 animate-in fade-in">
                            <ChevronRight size={10} className="text-slate-600" />
                            <select value={filterTbSubject} onChange={(e) => setFilterTbSubject(e.target.value)} className="bg-transparent text-xs text-slate-300 font-medium outline-none cursor-pointer hover:text-cyan-400">
                                <option value="ALL">All Subjects</option>
                                {filterOptions.subjects.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    )}
                    {filterCategory === 'MOCK' && (
                        <div className="flex items-center gap-2 animate-in fade-in">
                            <ChevronRight size={10} className="text-slate-600" />
                            <select value={filterMockYear} onChange={(e) => setFilterMockYear(e.target.value)} className="bg-transparent text-xs text-slate-300 font-medium outline-none cursor-pointer hover:text-cyan-400">
                                <option value="ALL">Year</option>
                                {filterOptions.years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <select value={filterMockGrade} onChange={(e) => setFilterMockGrade(e.target.value)} className="bg-transparent text-xs text-slate-300 font-medium outline-none cursor-pointer hover:text-cyan-400">
                                <option value="ALL">Grade</option>
                                {filterOptions.grades.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                    )}
                    {filterCategory === 'OTHER' && (
                        <div className="flex items-center gap-2 animate-in fade-in">
                            <ChevronRight size={10} className="text-slate-600" />
                            <select value={filterOtherPublisher} onChange={(e) => setFilterOtherPublisher(e.target.value)} className="bg-transparent text-xs text-slate-300 font-medium outline-none cursor-pointer hover:text-cyan-400">
                                <option value="ALL">Publisher</option>
                                {filterOptions.publishers.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    )}

                    <div className="ml-auto relative">
                        <input
                            type="text"
                            placeholder="Search Specimens..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-950/50 border border-slate-800 rounded-full pl-8 pr-3 py-1 text-[10px] text-slate-300 w-48 focus:w-64 transition-all outline-none focus:border-cyan-500/50"
                        />
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" />
                    </div>

                    {(filterCategory !== 'ALL' || searchTerm) && (
                        <button onClick={resetFilters} className="text-slate-500 hover:text-red-400 transition-colors">
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Create New Card */}
                <div
                    onClick={() => navigate('/admin/create-project')}
                    className="h-32 border border-dashed border-slate-800 rounded bg-slate-900/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-cyan-500/50 hover:bg-slate-900/40 transition-all group"
                >
                    <div className="w-10 h-10 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 text-slate-600 group-hover:text-cyan-400 group-hover:border-cyan-500/30 transition-colors">
                        <Plus size={20} />
                    </div>
                    <span className="text-[10px] text-slate-600 font-bold tracking-widest uppercase group-hover:text-cyan-500/70 transition-colors">Initialize Specimen</span>
                </div>

                {filteredContinents.map((cont) => {
                    let tag = '';
                    if (cont.metadata?.category === 'TEXTBOOK') tag = `${cont.metadata.textbook?.subject}`;
                    else if (cont.metadata?.category === 'MOCK') tag = `${cont.metadata.mock?.year} · ${cont.metadata.mock?.month}`;
                    else if (cont.metadata?.category === 'OTHER') tag = cont.metadata.other?.publisher || 'Other';

                    const categoryLabel = {
                        'TEXTBOOK': 'TEXTBOOK',
                        'MOCK': 'MOCK TEST',
                        'OTHER': 'OTHER'
                    }[cont.metadata?.category || 'OTHER'] || 'UNKNOWN';

                    const isSelected = selectedIds.includes(cont.id);

                    return (
                        <div
                            key={cont.id}
                            onClick={() => setSelectedContinent(cont)}
                            className={`h-32 relative abyss-glass flex flex-col cursor-pointer transition-all duration-300 group overflow-hidden ${isSelected
                                ? 'ring-1 ring-cyan-500/50 border-cyan-500/30 bg-cyan-950/10'
                                : 'hover:border-slate-600'
                                }`}
                        >
                            {/* Color Bar */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${cont.metadata?.category === 'TEXTBOOK' ? 'bg-blue-500/70' :
                                cont.metadata?.category === 'MOCK' ? 'bg-purple-500/70' : 'bg-slate-500/70'
                                }`} />

                            <div
                                className="absolute top-2 left-4 z-20 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ opacity: isSelected ? 1 : undefined }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedIds(prev => prev.includes(cont.id) ? prev.filter(id => id !== cont.id) : [...prev, cont.id]);
                                }}
                            >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected
                                    ? 'bg-cyan-500 border-cyan-500 text-slate-950'
                                    : 'bg-slate-950 border-slate-600 text-transparent hover:border-cyan-500'
                                    }`}>
                                    <Check size={10} strokeWidth={4} />
                                </div>
                            </div>

                            <div className="flex-1 pl-5 p-4 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h3 className={`font-medium text-sm truncate pr-2 ${isSelected ? 'text-cyan-300' : 'text-slate-200 group-hover:text-white'}`}>
                                            {cont.display_name}
                                        </h3>
                                    </div>
                                    <p className="text-[9px] text-slate-500 font-mono mt-0.5 truncate uppercase">
                                        ID: {cont.name}
                                    </p>
                                </div>

                                <div className="flex items-end justify-between">
                                    <span className="text-[9px] text-slate-400 bg-slate-950/30 px-1.5 py-0.5 rounded border border-slate-800">
                                        {tag || 'Standard'}
                                    </span>
                                    <span className={`text-[8px] px-1.5 py-0.5 rounded border font-mono font-bold tracking-wider ${cont.metadata?.category === 'TEXTBOOK' ? 'text-blue-400 border-blue-900/30' :
                                        cont.metadata?.category === 'MOCK' ? 'text-purple-400 border-purple-900/30' :
                                            'text-slate-500 border-slate-800'
                                        }`}>
                                        {categoryLabel}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredContinents.length === 0 && (
                <div className="mt-20 text-center text-slate-600">
                    <Book size={32} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-mono uppercase tracking-widest">No Specimens Found</p>
                </div>
            )}
        </div>
    );
};
