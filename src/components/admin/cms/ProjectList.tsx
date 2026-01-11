import { useEffect, useState, useMemo } from 'react';
import {
    Plus, Globe, Layers,
    Filter, X, ChevronRight, Check, Trash2, Search
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

            const headers = {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

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
            // 0. Search Term
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const matchName = c.display_name.toLowerCase().includes(searchLower) || c.name.toLowerCase().includes(searchLower);
                if (!matchName) return false;
            }

            // 1. Category Filter
            if (filterCategory !== 'ALL' && c.metadata?.category !== filterCategory) return false;

            // 2. Sub Filters
            if (filterCategory === 'TEXTBOOK') {
                if (filterTbSubject !== 'ALL' && c.metadata?.textbook?.subject !== filterTbSubject) return false;
            } else if (filterCategory === 'MOCK') {
                if (filterMockYear !== 'ALL' && c.metadata?.mock?.year !== filterMockYear) return false;
                if (filterMockGrade !== 'ALL' && c.metadata?.mock?.grade !== filterMockGrade) return false;
            } else if (filterCategory === 'OTHER') {
                if (filterOtherPublisher !== 'ALL' && c.metadata?.other?.publisher !== filterOtherPublisher) return false;
            }

            return true;
        });
    }, [continents, searchTerm, filterCategory, filterTbSubject, filterMockYear, filterMockGrade, filterOtherPublisher]);

    // --- Dynamic Filter Options ---
    const filterOptions = useMemo(() => {
        const getUnique = (path: (c: Continent) => string | undefined) =>
            Array.from(new Set(continents.map(path).filter(Boolean))).sort();

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

    if (loading) return <div className="p-8 text-babel-gold animate-pulse text-center font-serif">Loading Archives...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-transparent">
            {showDistributor && (
                <MissionDistributor
                    onClose={() => setShowDistributor(false)}
                />
            )}

            {selectedContinent && (
                <ContinentManager
                    continent={selectedContinent}
                    initialView={selectedContinent.isNew ? 'add' : 'list'}
                    onClose={() => {
                        setSelectedContinent(null);
                        fetchContinents();
                    }}
                />
            )}

            <div className="flex flex-col gap-6 mb-8">
                {/* Header Row */}
                <div className="flex justify-between items-center border-b border-white/10 pb-6">
                    <div>
                        <h2 className="text-3xl font-serif text-white mb-2 flex items-center gap-3">
                            <Globe className="text-babel-gold" /> The Knowledge Repository
                        </h2>
                        <p className="text-stone-500 text-sm">관리할 프로젝트 폴더를 선택하거나 새로 생성하십시오.</p>
                    </div>
                    <div className="flex gap-2">
                        {selectedIds.length > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                className="bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-800 px-4 py-2 rounded font-bold flex items-center gap-2 transition-colors text-sm"
                            >
                                <Trash2 size={16} /> 삭제 ({selectedIds.length})
                            </button>
                        )}
                        <button
                            onClick={() => {
                                if (selectedIds.length === filteredContinents.length) setSelectedIds([]);
                                else setSelectedIds(filteredContinents.map(c => c.id));
                            }}
                            className="bg-stone-800 hover:bg-stone-700 text-stone-300 px-4 py-2 rounded font-bold transition-colors border border-white/10 text-sm"
                        >
                            {selectedIds.length > 0 && selectedIds.length === filteredContinents.length ? '선택 해제' : '전체 선택'}
                        </button>
                        <button
                            onClick={() => setShowDistributor(true)}
                            className="bg-stone-800 hover:bg-stone-700 text-white px-4 py-2 rounded font-bold flex items-center gap-2 transition-colors border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)] text-sm"
                        >
                            <Layers size={16} /> 빠른 배포
                        </button>
                        <button
                            onClick={() => navigate('/admin/create-project')}
                            className="bg-babel-gold hover:bg-yellow-500 text-black px-6 py-2 rounded font-bold flex items-center gap-2 transition-transform hover:scale-105 shadow-[0_0_15px_rgba(212,175,55,0.3)] text-sm"
                        >
                            <Plus size={16} /> 새 프로젝트
                        </button>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-wrap items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 text-stone-400 mr-2 border-r border-white/10 pr-4">
                        <Filter size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Filters</span>
                    </div>

                    {/* Category Select */}
                    <select
                        value={filterCategory}
                        onChange={(e) => {
                            setFilterCategory(e.target.value as any);
                            // Reset sub-filters when category changes
                            setFilterTbSubject('ALL');
                            setFilterMockYear('ALL');
                            setFilterMockGrade('ALL');
                            setFilterOtherPublisher('ALL');
                        }}
                        className="bg-stone-900 border border-white/20 rounded px-3 py-1.5 text-xs text-white outline-none focus:border-babel-gold"
                    >
                        <option value="ALL">전체 카테고리</option>
                        <option value="TEXTBOOK">교과서</option>
                        <option value="MOCK">모의고사</option>
                        <option value="OTHER">기타</option>
                    </select>

                    {/* Dynamic Sub Filters */}
                    {filterCategory === 'TEXTBOOK' && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4">
                            <ChevronRight size={14} className="text-stone-600" />
                            <select value={filterTbSubject} onChange={(e) => setFilterTbSubject(e.target.value)} className="bg-stone-900 border border-white/20 rounded px-3 py-1.5 text-xs text-white outline-none focus:border-babel-gold">
                                <option value="ALL">전체 과목 (Subjects)</option>
                                {filterOptions.subjects.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    )}

                    {filterCategory === 'MOCK' && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4">
                            <ChevronRight size={14} className="text-stone-600" />
                            <select value={filterMockYear} onChange={(e) => setFilterMockYear(e.target.value)} className="bg-stone-900 border border-white/20 rounded px-3 py-1.5 text-xs text-white outline-none focus:border-babel-gold">
                                <option value="ALL">전체 연도 (Year)</option>
                                {filterOptions.years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <select value={filterMockGrade} onChange={(e) => setFilterMockGrade(e.target.value)} className="bg-stone-900 border border-white/20 rounded px-3 py-1.5 text-xs text-white outline-none focus:border-babel-gold">
                                <option value="ALL">전체 학년 (Grade)</option>
                                {filterOptions.grades.map(g => <option key={g} value={g}>{g === 'High 1' ? '고1' : g === 'High 2' ? '고2' : '고3'}</option>)}
                            </select>
                        </div>
                    )}

                    {filterCategory === 'OTHER' && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4">
                            <ChevronRight size={14} className="text-stone-600" />
                            <select value={filterOtherPublisher} onChange={(e) => setFilterOtherPublisher(e.target.value)} className="bg-stone-900 border border-white/20 rounded px-3 py-1.5 text-xs text-white outline-none focus:border-babel-gold">
                                <option value="ALL">전체 출판사 (Publisher)</option>
                                {filterOptions.publishers.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Search Input */}
                    <div className="ml-auto relative">
                        <input
                            type="text"
                            placeholder="프로젝트 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-black/50 border border-white/10 rounded-full pl-8 pr-4 py-1.5 text-xs text-white w-48 focus:w-64 transition-all outline-none focus:border-babel-gold"
                        />
                        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                    </div>

                    {(filterCategory !== 'ALL' || searchTerm) && (
                        <button onClick={resetFilters} className="text-stone-500 hover:text-white p-1">
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Create New Card - Compact */}
                <div
                    onClick={() => navigate('/admin/create-project')}
                    className="h-28 border border-dashed border-white/10 rounded-lg flex items-center justify-center gap-3 cursor-pointer hover:border-babel-gold/50 hover:bg-white/5 transition-all group"
                >
                    <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center group-hover:bg-babel-gold group-hover:text-black transition-colors border border-white/10">
                        <Plus size={16} />
                    </div>
                    <span className="text-stone-500 font-medium group-hover:text-white uppercase tracking-widest text-xs">New</span>
                </div>

                {filteredContinents.map((cont) => {
                    // Extract tag info for display
                    let tag = '';
                    if (cont.metadata?.category === 'TEXTBOOK') tag = `${cont.metadata.textbook?.subject}`;
                    else if (cont.metadata?.category === 'MOCK') tag = `${cont.metadata.mock?.year} · ${cont.metadata.mock?.month}`;
                    else if (cont.metadata?.category === 'OTHER') tag = cont.metadata.other?.publisher || 'Other';

                    return (
                        <div
                            key={cont.id}
                            onClick={() => setSelectedContinent(cont)}
                            className={`h-28 bg-stone-900/40 border rounded-lg p-0 transition-all group relative hover:shadow-[0_4px_20px_rgba(0,0,0,0.5)] overflow-hidden flex ${selectedIds.includes(cont.id) ? 'border-babel-gold ring-1 ring-babel-gold/20 bg-babel-gold/5' : 'border-white/5 hover:border-babel-gold/50 hover:bg-stone-900/80'}`}
                        >
                            {/* Checkbox Overlay */}
                            <div
                                className="absolute top-2 left-2 z-20 p-2 -m-2 cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedIds(prev => prev.includes(cont.id) ? prev.filter(id => id !== cont.id) : [...prev, cont.id]);
                                }}
                            >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedIds.includes(cont.id) ? 'bg-babel-gold border-babel-gold text-black' : 'bg-black/40 border-white/20 hover:border-white/50 text-transparent'}`}>
                                    <Check size={10} />
                                </div>
                            </div>

                            {/* Accent Bar */}
                            <div className={`w-1 h-full ${cont.metadata?.category === 'TEXTBOOK' ? 'bg-blue-500' :
                                cont.metadata?.category === 'MOCK' ? 'bg-purple-500' : 'bg-stone-500'
                                }`} />

                            {/* Content */}
                            <div className="flex-1 p-3 flex flex-col justify-between cursor-pointer max-w-full overflow-hidden">
                                <div>
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded border ${cont.metadata?.category === 'TEXTBOOK' ? 'bg-blue-900/20 text-blue-400 border-blue-500/30' :
                                            cont.metadata?.category === 'MOCK' ? 'bg-purple-900/20 text-purple-400 border-purple-500/30' : 'bg-stone-800 text-stone-400 border-white/10'
                                            }`}>
                                            {cont.metadata?.category || 'UNKNOWN'}
                                        </span>
                                        <span className="text-[10px] text-stone-600 font-mono">
                                            {new Date(cont.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="text-white font-bold text-sm truncate pr-4 group-hover:text-babel-gold transition-colors leading-tight">
                                        {cont.display_name}
                                    </h3>
                                    <p className="text-[10px] text-stone-500 font-mono truncate mt-0.5">
                                        {cont.name}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 text-[10px] text-stone-400">
                                    {tag && (
                                        <span className="flex items-center gap-1 opacity-70">
                                            <Layers size={10} /> {tag}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredContinents.length === 0 && (
                <div className="mt-20 text-center text-stone-600 font-serif">
                    <div className="mb-4 opacity-20"><Filter size={48} className="mx-auto" /></div>
                    <p>조건에 맞는 프로젝트가 없습니다.</p>
                </div>
            )}
        </div>
    );
};
