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

    if (loading) return <div className="p-8 text-[#22d3ee] animate-pulse text-center font-serif text-xl mt-20">Scanning Memory Banks...</div>;

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
                {/* Header Row - Glass Effect */}
                <div className="flex justify-between items-end border-b border-teal-900/50 pb-6">
                    <div>
                        <h2 className="text-4xl font-serif text-cyan-400 mb-2 flex items-center gap-3 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] font-bold font-cinzel tracking-wide">
                            <Book size={32} className="text-cyan-400" /> 심해의 기억 저장소 (Memory Core)
                        </h2>
                        <p className="text-slate-400 text-sm italic opacity-80 pl-1 font-sans tracking-widest">
                            "심연의 시간축을 선택하거나, 새로운 기억을 주입하십시오."
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {selectedIds.length > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                className="bg-red-950/50 hover:bg-red-900/80 text-red-200 border border-red-800/50 px-5 py-2 rounded-full font-sans font-bold flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                            >
                                <Trash2 size={16} /> 선택된 기억 소각 ({selectedIds.length})
                            </button>
                        )}
                        <button
                            onClick={() => {
                                if (selectedIds.length === filteredContinents.length) setSelectedIds([]);
                                else setSelectedIds(filteredContinents.map(c => c.id));
                            }}
                            className="bg-slate-900/50 hover:bg-slate-800 text-slate-400 px-5 py-2 rounded-full font-sans font-bold transition-all border border-slate-700 hover:border-cyan-500/50 hover:text-cyan-400"
                        >
                            {selectedIds.length > 0 && selectedIds.length === filteredContinents.length ? '전체 해제' : '전체 선택'}
                        </button>
                        <button
                            onClick={() => setShowDistributor(true)}
                            className="bg-slate-900/50 hover:bg-slate-800 text-teal-200 px-5 py-2 rounded-full font-sans font-bold flex items-center gap-2 transition-all border border-slate-700 hover:border-teal-400 shadow-lg"
                        >
                            <Layers size={16} /> 신속 배포 (Deploy)
                        </button>
                        <button
                            onClick={() => navigate('/admin/create-project')}
                            className="ancient-button px-6 py-2 rounded-full font-sans font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] transform hover:-translate-y-0.5 border border-teal-500/50 text-cyan-300"
                        >
                            <Plus size={16} /> 새로운 기억 주입
                        </button>
                    </div>
                </div>

                {/* Ancient Filter Bar - Floating Glass Panel */}
                <div className="ancient-panel p-4 rounded-xl flex flex-wrap items-center gap-4 border border-teal-900/30 bg-slate-950/40 backdrop-blur-md shadow-lg">
                    <div className="flex items-center gap-2 text-cyan-500 mr-4 pr-4 border-r border-teal-900/50">
                        <Filter size={18} />
                        <span className="text-xs font-mono font-bold tracking-widest uppercase">SCAN FILTER</span>
                    </div>

                    {/* Category Select - Dark Mode Inputs */}
                    <select
                        value={filterCategory}
                        onChange={(e) => {
                            setFilterCategory(e.target.value as any);
                            setFilterTbSubject('ALL'); setFilterMockYear('ALL'); setFilterMockGrade('ALL'); setFilterOtherPublisher('ALL');
                        }}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-sans font-bold outline-none focus:border-cyan-500 shadow-inner cursor-pointer hover:bg-slate-800 transition-colors"
                    >
                        <option value="ALL">모든 카테고리</option>
                        <option value="TEXTBOOK">교과서 (Textbooks)</option>
                        <option value="MOCK">모의고사 (Mock Tests)</option>
                        <option value="OTHER">기타 (Others)</option>
                    </select>

                    {/* Dynamic Sub Filters */}
                    {filterCategory === 'TEXTBOOK' && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4">
                            <ChevronRight size={14} className="text-slate-600" />
                            <select value={filterTbSubject} onChange={(e) => setFilterTbSubject(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-sans font-bold outline-none focus:border-cyan-500 shadow-inner cursor-pointer hover:bg-slate-800">
                                <option value="ALL">모든 과목</option>
                                {filterOptions.subjects.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    )}
                    {filterCategory === 'MOCK' && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4">
                            <ChevronRight size={14} className="text-slate-600" />
                            <select value={filterMockYear} onChange={(e) => setFilterMockYear(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-sans font-bold outline-none focus:border-cyan-500 shadow-inner cursor-pointer hover:bg-slate-800">
                                <option value="ALL">연도 (Year)</option>
                                {filterOptions.years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <select value={filterMockGrade} onChange={(e) => setFilterMockGrade(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-sans font-bold outline-none focus:border-cyan-500 shadow-inner cursor-pointer hover:bg-slate-800">
                                <option value="ALL">학년 (Grade)</option>
                                {filterOptions.grades.map(g => <option key={g} value={g}>{g === 'High 1' ? '고1' : g === 'High 2' ? '고2' : '고3'}</option>)}
                            </select>
                        </div>
                    )}
                    {filterCategory === 'OTHER' && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4">
                            <ChevronRight size={14} className="text-slate-600" />
                            <select value={filterOtherPublisher} onChange={(e) => setFilterOtherPublisher(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-sans font-bold outline-none focus:border-cyan-500 shadow-inner cursor-pointer hover:bg-slate-800">
                                <option value="ALL">출판사 (Publisher)</option>
                                {filterOptions.publishers.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    )}

                    <div className="ml-auto relative">
                        <input
                            type="text"
                            placeholder="기억 검색 (Search)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-950/50 border border-slate-700 rounded-full pl-9 pr-4 py-1.5 text-xs text-slate-300 font-sans w-56 focus:w-72 transition-all outline-none focus:border-cyan-500 shadow-inner placeholder-slate-600 focus:bg-slate-900"
                        />
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    </div>

                    {(filterCategory !== 'ALL' || searchTerm) && (
                        <button onClick={resetFilters} className="text-slate-500 hover:text-red-400 p-1 transition-colors">
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Create New Card - Holographic Blueprint Style */}
                <div
                    onClick={() => navigate('/admin/create-project')}
                    className="h-36 border border-dashed border-teal-800/50 rounded-lg bg-slate-900/20 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-cyan-500 hover:bg-slate-800/40 transition-all group relative overflow-hidden backdrop-blur-sm"
                >
                    <div className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center group-hover:bg-cyan-900/30 group-hover:text-cyan-400 transition-colors border border-teal-900 text-teal-700 z-10 shadow-lg">
                        <Plus size={24} />
                    </div>
                    <span className="text-teal-700 font-mono font-bold tracking-widest text-xs group-hover:text-cyan-400 transition-colors z-10">INITIALIZE NEW MEMORY</span>
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
                            className={`h-36 relative ancient-card flex flex-col cursor-pointer transition-transform duration-200 overflow-hidden ${isSelected
                                ? 'ring-1 ring-cyan-400 border-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.2)] transform -translate-y-1'
                                : 'hover:border-teal-500/50'
                                }`}
                        >
                            {/* Accent Bar */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 z-10 ${cont.metadata?.category === 'TEXTBOOK' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' :
                                cont.metadata?.category === 'MOCK' ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-slate-500'
                                }`} />

                            {/* Checkbox (Holo-Check) */}
                            <div
                                className="absolute top-2 left-4 z-20 cursor-pointer p-2 -m-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ opacity: isSelected ? 1 : undefined }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedIds(prev => prev.includes(cont.id) ? prev.filter(id => id !== cont.id) : [...prev, cont.id]);
                                }}
                            >
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all shadow-md ${isSelected
                                    ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                                    : 'bg-slate-950/50 border-slate-600 text-transparent hover:border-cyan-500'
                                    }`}>
                                    <Check size={12} strokeWidth={4} />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 pl-6 p-4 flex flex-col justify-between relative z-10">
                                <div className="flex flex-col gap-1">
                                    {/* Date Stamp */}
                                    <div className="text-[10px] text-slate-500 font-mono flex justify-end opacity-80">
                                        {new Date(cont.created_at).toLocaleDateString()}
                                    </div>

                                    {/* Title */}
                                    <h3
                                        className={`font-sans font-bold text-lg leading-tight truncate pr-2 transition-colors ${isSelected ? 'text-cyan-300' : 'text-slate-200 group-hover:text-cyan-100'
                                            }`}
                                    >
                                        {cont.display_name}
                                    </h3>

                                    {/* Subtitle */}
                                    <p className="text-[10px] text-slate-500 font-mono truncate">
                                        ID: {cont.name}
                                    </p>
                                </div>

                                {/* Footer Row */}
                                <div className="flex items-end justify-between mt-2">
                                    <div className="flex items-center gap-2">
                                        <span className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-950/50 px-2 py-1 rounded border border-slate-800 font-bold tracking-wide">
                                            <Layers size={10} className="text-teal-500" /> {tag || '일반'}
                                        </span>
                                    </div>

                                    {/* Category Label */}
                                    <span className={`text-[10px] px-2 py-0.5 rounded border font-mono font-bold uppercase tracking-wider ${cont.metadata?.category === 'TEXTBOOK' ? 'bg-blue-950/30 text-blue-400 border-blue-900/50' :
                                        cont.metadata?.category === 'MOCK' ? 'bg-purple-950/30 text-purple-400 border-purple-900/50' :
                                            'bg-slate-900 text-slate-500 border-slate-800'
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
                <div className="mt-20 text-center text-slate-600 font-sans">
                    <div className="mb-4 opacity-50"><Scroll size={64} className="mx-auto text-slate-700" /></div>
                    <p className="text-xl">심연 속에 저장된 기억이 없습니다.</p>
                </div>
            )}
        </div>
    );
};
