import { useEffect, useState, useMemo } from 'react';
import {
    Plus, Layers,
    Filter, X, ChevronRight, Check, Trash2, Search,
    Book, Scroll
} from 'lucide-react';
import { ContinentManager } from '../ContinentManager';
import { MissionDistributor } from '../MissionDistributor';
import { useNavigate, useLocation } from 'react-router-dom';

interface Continent {
    id: string;
    name: string; // Internal Folder Name
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

    // Textbook Filters
    const [filterTbSubject, setFilterTbSubject] = useState('ALL');

    // Mock Filters
    const [filterMockYear, setFilterMockYear] = useState('ALL');
    const [filterMockGrade, setFilterMockGrade] = useState('ALL');

    // Other Filters
    const [filterOtherPublisher, setFilterOtherPublisher] = useState('ALL');

    useEffect(() => {
        fetchContinents();
    }, []);

    // Auto-open new project logic
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
                console.warn("[ProjectList] No auth token found");
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
            } else {
                console.error("[ProjectList] Fetch failed:", await response.text());
            }
        } catch (e) {
            console.error("[ProjectList] Error:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (!selectedIds.length) return;
        if (!confirm(`선택한 ${selectedIds.length}개 프로젝트를 정말 삭제하시겠습니까? 복구할 수 없습니다.`)) return;

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

            alert("삭제 완료");
            setSelectedIds([]);
            fetchContinents();
        } catch (e: any) {
            alert("삭제 실패: " + e.message);
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

    // --- Dynamic Filter Options ---
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

    if (loading) return <div className="p-8 text-[#d4af37] animate-pulse text-center font-serif text-xl mt-20">Unsealing the Archives...</div>;

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

            <div className="flex flex-col gap-8 mb-12">
                {/* Header Row */}
                <div className="flex justify-between items-end border-b border-[#78350f] pb-6">
                    <div>
                        <h2 className="text-4xl font-serif text-[#fbbf24] mb-2 flex items-center gap-3 drop-shadow-md text-glow-gold">
                            <Book size={32} className="text-[#fbbf24]" /> The Knowledge Repository
                        </h2>
                        <p className="text-[#a8a29e] text-sm italic opacity-80 pl-1">"Select a Time to open, or inscribe a new one."</p>
                    </div>
                    <div className="flex gap-3">
                        {selectedIds.length > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                className="bg-[#450a0a] hover:bg-[#7f1d1d] text-[#fca5a5] border border-[#7f1d1d] px-5 py-2 rounded-sm font-serif font-bold flex items-center gap-2 transition-colors shadow-lg"
                            >
                                <Trash2 size={16} /> Burn Selected ({selectedIds.length})
                            </button>
                        )}
                        <button
                            onClick={() => {
                                if (selectedIds.length === filteredContinents.length) setSelectedIds([]);
                                else setSelectedIds(filteredContinents.map(c => c.id));
                            }}
                            className="ancient-button px-5 py-2 rounded-sm"
                        >
                            {selectedIds.length > 0 && selectedIds.length === filteredContinents.length ? 'Deselect All' : 'Select All'}
                        </button>
                        <button
                            onClick={() => setShowDistributor(true)}
                            className="ancient-button px-5 py-2 rounded-sm flex items-center gap-2"
                        >
                            <Layers size={16} /> Quick Deploy
                        </button>
                        <button
                            onClick={() => navigate('/admin/create-project')}
                            className="ancient-button px-6 py-2 rounded-sm flex items-center gap-2 border-[#d4af37] text-[#fbbf24] shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                        >
                            <Plus size={16} /> Inscribe New
                        </button>
                    </div>
                </div>

                {/* Ancient Filter Bar */}
                <div className="ancient-panel p-4 rounded-sm flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 text-[#fbbf24] mr-4 pr-4 border-r border-[#451a03]">
                        <Filter size={18} />
                        <span className="text-xs font-serif font-bold tracking-widest uppercase">Filters</span>
                    </div>

                    {/* Category Select */}
                    <select
                        value={filterCategory}
                        onChange={(e) => {
                            setFilterCategory(e.target.value as any);
                            setFilterTbSubject('ALL'); setFilterMockYear('ALL'); setFilterMockGrade('ALL'); setFilterOtherPublisher('ALL');
                        }}
                        className="bg-[#0c0a09] border border-[#44403c] rounded-sm px-3 py-1.5 text-xs text-[#d6d3d1] font-serif font-bold outline-none focus:border-[#fbbf24] shadow-inner cursor-pointer"
                    >
                        <option value="ALL">All Categories</option>
                        <option value="TEXTBOOK">교과서 (Textbooks)</option>
                        <option value="MOCK">모의고사 (Mock Tests)</option>
                        <option value="OTHER">기타 (Others)</option>
                    </select>

                    {/* Dynamic Sub Filters */}
                    {filterCategory === 'TEXTBOOK' && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4">
                            <ChevronRight size={14} className="text-[#78716c]" />
                            <select value={filterTbSubject} onChange={(e) => setFilterTbSubject(e.target.value)} className="bg-[#0c0a09] border border-[#44403c] rounded-sm px-3 py-1.5 text-xs text-[#d6d3d1] font-serif font-bold outline-none focus:border-[#fbbf24] shadow-inner cursor-pointer">
                                <option value="ALL">All XML Subjects</option>
                                {filterOptions.subjects.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    )}
                    {filterCategory === 'MOCK' && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4">
                            <ChevronRight size={14} className="text-[#78716c]" />
                            <select value={filterMockYear} onChange={(e) => setFilterMockYear(e.target.value)} className="bg-[#0c0a09] border border-[#44403c] rounded-sm px-3 py-1.5 text-xs text-[#d6d3d1] font-serif font-bold outline-none focus:border-[#fbbf24] shadow-inner cursor-pointer">
                                <option value="ALL">Year</option>
                                {filterOptions.years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <select value={filterMockGrade} onChange={(e) => setFilterMockGrade(e.target.value)} className="bg-[#0c0a09] border border-[#44403c] rounded-sm px-3 py-1.5 text-xs text-[#d6d3d1] font-serif font-bold outline-none focus:border-[#fbbf24] shadow-inner cursor-pointer">
                                <option value="ALL">Grade</option>
                                {filterOptions.grades.map(g => <option key={g} value={g}>{g === 'High 1' ? '고1' : g === 'High 2' ? '고2' : '고3'}</option>)}
                            </select>
                        </div>
                    )}
                    {filterCategory === 'OTHER' && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4">
                            <ChevronRight size={14} className="text-[#78716c]" />
                            <select value={filterOtherPublisher} onChange={(e) => setFilterOtherPublisher(e.target.value)} className="bg-[#0c0a09] border border-[#44403c] rounded-sm px-3 py-1.5 text-xs text-[#d6d3d1] font-serif font-bold outline-none focus:border-[#fbbf24] shadow-inner cursor-pointer">
                                <option value="ALL">Publisher</option>
                                {filterOptions.publishers.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    )}

                    <div className="ml-auto relative">
                        <input
                            type="text"
                            placeholder="Search the archives..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-[#0c0a09] border border-[#44403c] rounded-full pl-9 pr-4 py-1.5 text-xs text-[#d6d3d1] font-serif w-56 focus:w-72 transition-all outline-none focus:border-[#fbbf24] shadow-inner placeholder-[#57534e]"
                        />
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#57534e]" />
                    </div>

                    {(filterCategory !== 'ALL' || searchTerm) && (
                        <button onClick={resetFilters} className="text-[#78716c] hover:text-[#ef4444] p-1 transition-colors">
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Create New Card */}
                <div
                    onClick={() => navigate('/admin/create-project')}
                    className="h-36 border-2 border-dashed border-[#44403c] rounded bg-[#1c1917]/30 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-[#fbbf24] hover:bg-[#1c1917]/50 transition-all group relative overflow-hidden"
                >
                    <div className="w-12 h-12 rounded-full bg-[#0c0a09] flex items-center justify-center group-hover:bg-[#fbbf24] group-hover:text-[#0c0a09] transition-colors border border-[#44403c] text-[#57534e] z-10">
                        <Plus size={24} />
                    </div>
                    <span className="text-[#57534e] font-serif font-bold tracking-widest text-xs group-hover:text-[#fbbf24] transition-colors z-10">INSCRIBE NEW</span>
                </div>

                {filteredContinents.map((cont) => {
                    let tag = '';
                    if (cont.metadata?.category === 'TEXTBOOK') tag = `${cont.metadata.textbook?.subject}`;
                    else if (cont.metadata?.category === 'MOCK') tag = `${cont.metadata.mock?.year} · ${cont.metadata.mock?.month}`;
                    else if (cont.metadata?.category === 'OTHER') tag = cont.metadata.other?.publisher || 'Other';

                    const categoryLabel = {
                        'TEXTBOOK': '교과서',
                        'MOCK': '모의고사',
                        'OTHER': '기타'
                    }[cont.metadata?.category || 'OTHER'] || '기타';

                    const isSelected = selectedIds.includes(cont.id);

                    return (
                        <div
                            key={cont.id}
                            onClick={() => setSelectedContinent(cont)}
                            className={`h-36 relative ancient-card flex flex-col cursor-pointer ${isSelected
                                ? 'border-[#fbbf24] ring-1 ring-[#fbbf24] bg-[#2a1d12]'
                                : ''
                                }`}
                        >
                            {/* Book Spine / Accent */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 z-10 rounded-l ${cont.metadata?.category === 'TEXTBOOK' ? 'bg-[#3b82f6]' :
                                cont.metadata?.category === 'MOCK' ? 'bg-[#9333ea]' : 'bg-[#78716c]'
                                }`} />

                            {/* Checkbox (Seal) */}
                            <div
                                className="absolute top-2 left-4 z-20 cursor-pointer p-2 -m-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ opacity: isSelected ? 1 : undefined }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedIds(prev => prev.includes(cont.id) ? prev.filter(id => id !== cont.id) : [...prev, cont.id]);
                                }}
                            >
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all shadow-md ${isSelected
                                    ? 'bg-[#fbbf24] border-[#fffbeb] text-[#422006]'
                                    : 'bg-[#0c0a09]/80 border-[#57534e] text-transparent hover:border-[#fbbf24]'
                                    }`}>
                                    <Check size={12} strokeWidth={4} />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 pl-6 p-4 flex flex-col justify-between relative z-0">
                                <div className="flex flex-col gap-1">
                                    {/* Date Stamp */}
                                    <div className="text-[10px] text-[#78716c] font-mono flex justify-end opacity-60">
                                        {new Date(cont.created_at).toLocaleDateString()}
                                    </div>

                                    {/* Title */}
                                    <h3
                                        className={`font-serif font-bold text-lg leading-tight truncate pr-2 transition-colors ${isSelected ? 'text-[#fbbf24]' : 'text-[#e7e5e4] group-hover:text-white'
                                            }`}
                                    >
                                        {cont.display_name}
                                    </h3>

                                    {/* Subtitle */}
                                    <p className="text-[10px] text-[#78716c] font-serif truncate">
                                        ID: {cont.name}
                                    </p>
                                </div>

                                {/* Footer Row */}
                                <div className="flex items-end justify-between mt-2">
                                    <div className="flex items-center gap-2">
                                        <span className="flex items-center gap-1.5 text-[10px] text-[#78716c] bg-[#0c0a09] px-2 py-1 rounded border border-[#292524] font-bold">
                                            <Layers size={10} /> {tag || 'General'}
                                        </span>
                                    </div>

                                    {/* Category Label */}
                                    <span className={`text-[10px] px-2 py-0.5 rounded-sm border font-serif font-bold uppercase tracking-wider ${cont.metadata?.category === 'TEXTBOOK' ? 'bg-[#1e3a8a]/20 text-[#60a5fa] border-[#1e3a8a]/30' :
                                        cont.metadata?.category === 'MOCK' ? 'bg-[#581c87]/20 text-[#c084fc] border-[#581c87]/30' :
                                            'bg-[#292524] text-[#a8a29e] border-[#44403c]'
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
                <div className="mt-20 text-center text-[#57534e] font-serif">
                    <div className="mb-4 opacity-30"><Scroll size={64} className="mx-auto" /></div>
                    <p className="text-xl">No Tomes found in the Archives.</p>
                </div>
            )}
        </div>
    );
};
