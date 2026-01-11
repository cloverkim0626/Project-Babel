import { useEffect, useState } from 'react';

import { Plus, MoreVertical, Calendar, Globe, BookOpen, Layers } from 'lucide-react';
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
}

export const ProjectList = ({ onCreate: _legacyOnCreate }: { onCreate: () => void }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [continents, setContinents] = useState<Continent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedContinent, setSelectedContinent] = useState<Continent | null>(null);
    const [showDistributor, setShowDistributor] = useState(false);

    useEffect(() => {
        fetchContinents();
    }, []);

    // Auto-open new project if redirected from creation page
    useEffect(() => {
        if (continents.length > 0 && location.state && (location.state as any).newProjectId) {
            const newId = (location.state as any).newProjectId;
            console.log('[ProjectList] Detected new project:', newId);

            const target = continents.find(c => c.id === newId);
            if (target) {
                // Open with isNew=true to trigger 'add' view
                setSelectedContinent({ ...target, isNew: true });

                // Clear state to prevent re-opening on refresh
                window.history.replaceState({}, document.title);
            }
        }
    }, [continents, location]);

    const fetchContinents = async () => {
        try {
            // Nuclear Auth Logic for Project List
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

            let projectId = '';
            try { projectId = supabaseUrl.split('//')[1].split('.')[0]; } catch (e) { }

            const key = `sb-${projectId}-auth-token`;
            const sessionStr = localStorage.getItem(key) ||
                localStorage.getItem(Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token')) || '');

            if (!sessionStr) {
                // If no token, maybe truly logged out. 
                // But try fetch anyway just in case RLS allows public read (unlikely for this app)
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

    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const handleBulkDelete = async () => {
        if (!selectedIds.length) return;
        if (!confirm(`선택한 ${selectedIds.length}개 프로젝트를 정말 삭제하시겠습니까? 복구할 수 없습니다.`)) return;

        try {
            // Nuclear Auth Logic for Deletion
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
                        fetchContinents(); // Refresh list on close
                    }}
                />
            )}

            <div className="flex justify-between items-center mb-12 border-b border-white/10 pb-6">
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
                            className="bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-800 px-4 py-2 rounded font-bold flex items-center gap-2 transition-colors"
                        >
                            <MoreVertical size={18} /> 삭제 ({selectedIds.length})
                        </button>
                    )}
                    <button
                        onClick={() => {
                            if (selectedIds.length === continents.length) setSelectedIds([]);
                            else setSelectedIds(continents.map(c => c.id));
                        }}
                        className="bg-stone-800 hover:bg-stone-700 text-stone-300 px-4 py-2 rounded font-bold transition-colors border border-white/10"
                    >
                        {selectedIds.length === continents.length ? '선택 해제' : '전체 선택'}
                    </button>
                    <button
                        onClick={() => setShowDistributor(true)}
                        className="bg-stone-800 hover:bg-stone-700 text-white px-4 py-2 rounded font-bold flex items-center gap-2 transition-colors border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                    >
                        <Layers size={18} /> 빠른 배포 (Quick Distribute)
                    </button>
                    <button
                        onClick={() => navigate('/admin/create-project')}
                        className="bg-babel-gold hover:bg-yellow-500 text-black px-6 py-3 rounded font-bold flex items-center gap-2 transition-transform hover:scale-105 shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                    >
                        <Plus size={18} /> 새 프로젝트 (New Project)
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {/* Create New Card */}
                <div
                    onClick={() => navigate('/admin/create-project')}
                    className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-babel-gold/50 hover:bg-white/5 transition-all group h-64"
                >
                    <div className="w-16 h-16 rounded-full bg-stone-900 flex items-center justify-center group-hover:bg-babel-gold group-hover:text-black transition-colors border border-white/10">
                        <Plus size={32} />
                    </div>
                    <span className="text-stone-500 font-medium group-hover:text-white uppercase tracking-widest text-xs">New Project</span>
                </div>

                {continents.map((cont) => (
                    <div
                        key={cont.id}
                        className={`bg-black border rounded-xl p-0 transition-all group relative hover:shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden h-64 flex flex-col ${selectedIds.includes(cont.id) ? 'border-babel-gold ring-1 ring-babel-gold/50' : 'border-white/10 hover:border-babel-gold'}`}
                    >
                        <div
                            className="absolute top-3 left-3 z-10"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedIds(prev => prev.includes(cont.id) ? prev.filter(id => id !== cont.id) : [...prev, cont.id]);
                            }}
                        >
                            <div className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer ${selectedIds.includes(cont.id) ? 'bg-babel-gold border-babel-gold text-black' : 'bg-black/50 border-white/30 hover:border-white'}`}>
                                {selectedIds.includes(cont.id) && <Plus size={12} className="rotate-45" />}
                            </div>
                        </div>

                        {/* Cover Image Area */}
                        <div
                            onClick={() => setSelectedContinent(cont)}
                            className="h-32 bg-stone-900 border-b border-white/5 relative overflow-hidden cursor-pointer"
                        >
                            {cont.image_url ? (
                                <img src={cont.image_url} className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-stone-800 to-black flex items-center justify-center">
                                    <Globe size={48} className="text-white/5" />
                                </div>
                            )}
                            <div className="absolute top-3 right-3">
                                <button className="text-white/50 hover:text-white bg-black/50 rounded-full p-1">
                                    <MoreVertical size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Info Area */}
                        <div
                            onClick={() => setSelectedContinent(cont)}
                            className="p-5 flex-1 flex flex-col justify-between bg-stone-900/50 cursor-pointer"
                        >
                            <div>
                                <h3 className="text-white font-serif font-bold text-lg mb-1 truncate group-hover:text-babel-gold transition-colors">{cont.display_name}</h3>
                                <p className="text-xs text-stone-500 font-mono truncate">{cont.name}</p>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-white/5 text-[10px] text-stone-400 uppercase tracking-wider">
                                <span className="flex items-center gap-1">
                                    <BookOpen size={12} /> Content Lib
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar size={12} /> {new Date(cont.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {continents.length === 0 && (
                <div className="mt-12 text-center text-stone-600 font-serif">
                    기록된 프로젝트가 없습니다. (Empty Archive)
                </div>
            )}
        </div>
    );
};
